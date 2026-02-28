import OpenAI from 'openai';
import { db } from '@/lib/db';
import { leads, leadAssignments, contractorBillingHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStripe } from '@/lib/billing/stripe';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

interface DisputeAnalysis {
  shouldRefund: boolean;
  confidence: number;
  reason: string;
  category: 'spam' | 'incomplete_info' | 'wrong_service' | 'duplicate' | 'legitimate' | 'unclear';
}

const SYSTEM_PROMPT = `You are an AI that evaluates lead quality disputes from contractors.

A contractor is disputing a lead they were charged for. Analyze the lead details and the contractor's dispute reason to determine if a refund is warranted.

REFUND CRITERIA (should refund if ANY are true):
1. SPAM: Lead contains gibberish, test data, fake info, or obvious spam patterns
2. INCOMPLETE: Missing critical contact info (no valid email AND no valid phone)
3. WRONG SERVICE: Lead is clearly for a service the contractor doesn't offer
4. DUPLICATE: Contractor claims they already received this exact lead
5. UNREACHABLE: Contact info is clearly fake (e.g., test@test.com, 555-555-5555)

DO NOT REFUND if:
- Lead has valid contact info and reasonable project description
- Contractor just didn't win the job
- Contractor didn't respond in time
- Lead changed their mind (this is normal)

Respond with JSON only:
{
  "shouldRefund": boolean,
  "confidence": number (0-1),
  "reason": "brief explanation",
  "category": "spam" | "incomplete_info" | "wrong_service" | "duplicate" | "legitimate" | "unclear"
}`;

export async function analyzeDispute(data: {
  leadName: string;
  leadEmail: string;
  leadPhone: string | null;
  leadMessage: string | null;
  workType: string | null;
  contractorServices: string[];
  disputeReason: string;
}): Promise<DisputeAnalysis> {
  const openai = getOpenAI();

  if (!openai) {
    console.warn('[dispute-resolver] OpenAI not configured, defaulting to manual review');
    return {
      shouldRefund: false,
      confidence: 0,
      reason: 'AI analysis unavailable - requires manual review',
      category: 'unclear',
    };
  }

  const userPrompt = `
Lead Details:
- Name: ${data.leadName}
- Email: ${data.leadEmail}
- Phone: ${data.leadPhone || 'Not provided'}
- Message: ${data.leadMessage || 'Not provided'}
- Work Type: ${data.workType || 'General'}

Contractor Services: ${data.contractorServices.join(', ')}

Dispute Reason: ${data.disputeReason}

Analyze this dispute and determine if a refund is warranted.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content) as DisputeAnalysis;
    return analysis;
  } catch (error) {
    console.error('[dispute-resolver] AI analysis failed:', error);
    return {
      shouldRefund: false,
      confidence: 0,
      reason: 'AI analysis failed - requires manual review',
      category: 'unclear',
    };
  }
}

export async function processDispute(data: {
  leadAssignmentId: number;
  contractorId: number;
  disputeReason: string;
}): Promise<{
  success: boolean;
  refunded: boolean;
  message: string;
}> {
  try {
    // Get lead assignment with lead details
    const [assignment] = await db
      .select({
        id: leadAssignments.id,
        leadId: leadAssignments.leadId,
        priceCharged: leadAssignments.priceCharged,
        status: leadAssignments.status,
      })
      .from(leadAssignments)
      .where(eq(leadAssignments.id, data.leadAssignmentId))
      .limit(1);

    if (!assignment) {
      return { success: false, refunded: false, message: 'Lead assignment not found' };
    }

    if (assignment.status === 'refunded') {
      return { success: false, refunded: false, message: 'This lead has already been refunded' };
    }

    // Get lead details
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, assignment.leadId))
      .limit(1);

    if (!lead) {
      return { success: false, refunded: false, message: 'Lead not found' };
    }

    // Get contractor's services for context
    const { getContractorCategories } = await import('@/lib/db/queries/contractors');
    const categories = await getContractorCategories(data.contractorId);
    const contractorServices = categories.map((c) => c.category);

    // Analyze with AI
    const analysis = await analyzeDispute({
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      leadMessage: lead.message,
      workType: lead.workType,
      contractorServices,
      disputeReason: data.disputeReason,
    });

    // Update assignment with dispute info
    await db
      .update(leadAssignments)
      .set({
        disputeReason: data.disputeReason,
        outcome: analysis.category,
        feedback: `AI Analysis (${Math.round(analysis.confidence * 100)}% confidence): ${analysis.reason}`,
      })
      .where(eq(leadAssignments.id, data.leadAssignmentId));

    // Auto-refund if AI is confident
    if (analysis.shouldRefund && analysis.confidence >= 0.7) {
      // Find the billing record
      const [billingRecord] = await db
        .select()
        .from(contractorBillingHistory)
        .where(eq(contractorBillingHistory.leadAssignmentId, data.leadAssignmentId))
        .limit(1);

      if (billingRecord?.stripePaymentIntentId) {
        try {
          const stripe = getStripe();
          await stripe.refunds.create({
            payment_intent: billingRecord.stripePaymentIntentId,
          });

          // Update records
          await db
            .update(leadAssignments)
            .set({ status: 'refunded', disputeResolvedAt: new Date() })
            .where(eq(leadAssignments.id, data.leadAssignmentId));

          await db
            .update(contractorBillingHistory)
            .set({ status: 'refunded' })
            .where(eq(contractorBillingHistory.id, billingRecord.id));

          return {
            success: true,
            refunded: true,
            message: `Refund approved: ${analysis.reason}`,
          };
        } catch (refundError) {
          console.error('[dispute-resolver] Stripe refund failed:', refundError);
          return {
            success: true,
            refunded: false,
            message: 'Dispute recorded. Refund requires manual processing.',
          };
        }
      }
    }

    // If AI says don't refund or low confidence
    if (!analysis.shouldRefund && analysis.confidence >= 0.7) {
      return {
        success: true,
        refunded: false,
        message: `Dispute reviewed: ${analysis.reason}. This lead appears to be legitimate.`,
      };
    }

    // Low confidence - flag for manual review
    return {
      success: true,
      refunded: false,
      message: 'Dispute recorded and flagged for manual review.',
    };
  } catch (error) {
    console.error('[dispute-resolver] Error processing dispute:', error);
    return {
      success: false,
      refunded: false,
      message: 'An error occurred processing your dispute.',
    };
  }
}

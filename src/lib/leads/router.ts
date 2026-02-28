import { db } from '@/lib/db';
import {
  leads,
  contractors,
  contractorServiceAreas,
  contractorCategories,
  leadAssignments,
  contractorBillingHistory,
  leadPricing,
} from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { getLeadPrice, chargeForLead, formatCurrency } from '@/lib/billing/stripe';
import { sendLeadNotificationToContractor } from '@/lib/email/send-contractor-lead';

const MAX_CONTRACTORS_PER_LEAD = 3;

interface RoutingResult {
  success: boolean;
  assignedContractors: number[];
  errors: string[];
}

export async function routeLeadToContractors(leadId: number): Promise<RoutingResult> {
  const result: RoutingResult = {
    success: false,
    assignedContractors: [],
    errors: [],
  };

  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

    if (!lead) {
      result.errors.push('Lead not found');
      return result;
    }

    if (!lead.cityId) {
      result.errors.push('Lead has no city assigned');
      return result;
    }

    const category = lead.workType || 'general';

    const matchingContractors = await db
      .select({
        id: contractors.id,
        companyName: contractors.companyName,
        email: contractors.email,
        phone: contractors.phone,
        stripeCustomerId: contractors.stripeCustomerId,
        billingPlan: contractors.billingPlan,
        leadCredits: contractors.leadCredits,
        leadsThisMonth: contractors.leadsThisMonth,
        monthlyLeadLimit: contractors.monthlyLeadLimit,
      })
      .from(contractors)
      .innerJoin(contractorServiceAreas, eq(contractors.id, contractorServiceAreas.contractorId))
      .innerJoin(contractorCategories, eq(contractors.id, contractorCategories.contractorId))
      .where(
        and(
          eq(contractors.status, 'active'),
          eq(contractorServiceAreas.cityId, lead.cityId),
          eq(contractorServiceAreas.isActive, true),
          eq(contractorCategories.category, category),
          eq(contractorCategories.isActive, true)
        )
      )
      .groupBy(contractors.id)
      .orderBy(desc(contractors.createdAt))
      .limit(MAX_CONTRACTORS_PER_LEAD * 2);

    if (matchingContractors.length === 0) {
      result.errors.push(`No contractors available for city ${lead.cityId} and category ${category}`);
      return result;
    }

    const leadPrice = getLeadPrice(category);

    for (const contractor of matchingContractors) {
      if (result.assignedContractors.length >= MAX_CONTRACTORS_PER_LEAD) {
        break;
      }

      const existingAssignment = await db
        .select()
        .from(leadAssignments)
        .where(
          and(eq(leadAssignments.leadId, leadId), eq(leadAssignments.contractorId, contractor.id))
        )
        .limit(1);

      if (existingAssignment.length > 0) {
        continue;
      }

      if (contractor.billingPlan === 'subscription') {
        if (
          contractor.monthlyLeadLimit &&
          (contractor.leadsThisMonth ?? 0) >= contractor.monthlyLeadLimit
        ) {
          result.errors.push(`Contractor ${contractor.id} has reached monthly lead limit`);
          continue;
        }
      } else {
        if (!contractor.stripeCustomerId) {
          result.errors.push(`Contractor ${contractor.id} has no payment method`);
          continue;
        }
      }

      try {
        const [assignment] = await db
          .insert(leadAssignments)
          .values({
            leadId,
            contractorId: contractor.id,
            status: 'pending',
            priceCharged: (leadPrice / 100).toFixed(2),
          })
          .returning();

        if (contractor.billingPlan === 'per_lead' && contractor.stripeCustomerId) {
          try {
            const paymentIntent = await chargeForLead({
              customerId: contractor.stripeCustomerId,
              amount: leadPrice,
              description: `Lead #${leadId} - ${category}`,
              metadata: {
                leadId: leadId.toString(),
                leadAssignmentId: assignment.id.toString(),
                contractorId: contractor.id.toString(),
                category,
              },
            });

            await db.insert(contractorBillingHistory).values({
              contractorId: contractor.id,
              type: 'lead_charge',
              amount: (leadPrice / 100).toFixed(2),
              description: `Lead #${leadId} - ${category}`,
              stripePaymentIntentId: paymentIntent.id,
              leadAssignmentId: assignment.id,
              status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
            });

            if (paymentIntent.status === 'succeeded') {
              await db
                .update(leadAssignments)
                .set({ status: 'paid', paidAt: new Date() })
                .where(eq(leadAssignments.id, assignment.id));
            }
          } catch (paymentError) {
            console.error(`[lead-router] Payment failed for contractor ${contractor.id}:`, paymentError);
            await db
              .update(leadAssignments)
              .set({ status: 'payment_failed' })
              .where(eq(leadAssignments.id, assignment.id));
            result.errors.push(`Payment failed for contractor ${contractor.id}`);
            continue;
          }
        } else if (contractor.billingPlan === 'subscription') {
          await db
            .update(contractors)
            .set({ leadsThisMonth: sql`${contractors.leadsThisMonth} + 1` })
            .where(eq(contractors.id, contractor.id));

          await db
            .update(leadAssignments)
            .set({ status: 'paid', paidAt: new Date() })
            .where(eq(leadAssignments.id, assignment.id));
        }

        try {
          await sendLeadNotificationToContractor({
            contractorEmail: contractor.email,
            contractorName: contractor.companyName,
            leadName: lead.name,
            leadEmail: lead.email,
            leadPhone: lead.phone ?? undefined,
            leadMessage: lead.message ?? undefined,
            workType: category,
            price: formatCurrency(leadPrice),
          });
        } catch (emailError) {
          console.error(`[lead-router] Email notification failed for contractor ${contractor.id}:`, emailError);
        }

        result.assignedContractors.push(contractor.id);
      } catch (assignmentError) {
        console.error(`[lead-router] Assignment failed for contractor ${contractor.id}:`, assignmentError);
        result.errors.push(`Assignment failed for contractor ${contractor.id}`);
      }
    }

    if (result.assignedContractors.length > 0) {
      await db
        .update(leads)
        .set({
          status: 'routed',
          routedTo: result.assignedContractors,
          routedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      result.success = true;
    }

    return result;
  } catch (error) {
    console.error('[lead-router] Unexpected error:', error);
    result.errors.push('Unexpected error during lead routing');
    return result;
  }
}

export async function getLeadPriceForCategory(
  cityId: number | null,
  category: string
): Promise<number> {
  if (cityId) {
    const [customPrice] = await db
      .select()
      .from(leadPricing)
      .where(and(eq(leadPricing.cityId, cityId), eq(leadPricing.category, category), eq(leadPricing.isActive, true)))
      .limit(1);

    if (customPrice) {
      const base = parseFloat(customPrice.basePrice);
      const multiplier = parseFloat(customPrice.premiumMultiplier ?? '1');
      return Math.round(base * multiplier * 100);
    }
  }

  return getLeadPrice(category);
}

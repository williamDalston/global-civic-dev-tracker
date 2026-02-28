import OpenAI from 'openai';
import { Resend } from 'resend';
import { db } from '@/lib/db';
import { SITE_URL, SITE_NAME } from '@/lib/config/constants';

let _openai: OpenAI | null = null;
let _resend: Resend | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface ContractorProspect {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city: string;
  services: string[];
  rating?: number;
  reviewCount?: number;
}

interface OutreachEmail {
  subject: string;
  body: string;
}

const EMAIL_PROMPT = `You are writing a cold outreach email to a contractor to invite them to join a lead generation platform.

Key points to convey:
1. We have homeowners in their city looking for their services
2. No monthly fees - they only pay per lead ($15-75)
3. Leads are qualified and matched to their services
4. Easy signup, takes 2 minutes
5. They get a free public profile page

Keep it:
- Short (under 150 words)
- Professional but friendly
- Focused on the VALUE to them
- Include a clear call to action

Do NOT:
- Be pushy or salesy
- Make unrealistic promises
- Use excessive punctuation or emojis

Respond with JSON:
{
  "subject": "email subject line",
  "body": "email body (plain text, use \\n for line breaks)"
}`;

export async function generateOutreachEmail(prospect: ContractorProspect): Promise<OutreachEmail> {
  const openai = getOpenAI();

  if (!openai) {
    // Fallback template
    return {
      subject: `${prospect.name} - Get Leads from Homeowners in ${prospect.city}`,
      body: `Hi,

I noticed ${prospect.name} serves homeowners in ${prospect.city}. We're reaching out because we have homeowners on our platform actively looking for ${prospect.services[0] || 'contractor'} services in your area.

${SITE_NAME} connects contractors with qualified leads from homeowners. Unlike other services:
- No monthly fees - you only pay per lead ($15-75)
- Leads are matched to your services and location
- You get a free public profile page

Would you be interested in receiving leads from homeowners in ${prospect.city}?

Sign up free: ${SITE_URL}/contractors/signup

Best,
${SITE_NAME} Team`,
    };
  }

  const userPrompt = `
Contractor Details:
- Business Name: ${prospect.name}
- City: ${prospect.city}
- Services: ${prospect.services.join(', ') || 'General contracting'}
${prospect.rating ? `- Rating: ${prospect.rating}/5 (${prospect.reviewCount} reviews)` : ''}

Platform: ${SITE_NAME}
Signup URL: ${SITE_URL}/contractors/signup

Write a personalized cold outreach email.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EMAIL_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as OutreachEmail;
  } catch (error) {
    console.error('[contractor-outreach] AI email generation failed:', error);
    // Return fallback
    return {
      subject: `${prospect.name} - Get Leads from Homeowners in ${prospect.city}`,
      body: `Hi,

We have homeowners in ${prospect.city} looking for ${prospect.services[0] || 'contractor'} services.

${SITE_NAME} connects contractors with qualified leads. No monthly fees - you only pay per lead ($15-75).

Sign up free: ${SITE_URL}/contractors/signup

Best,
${SITE_NAME} Team`,
    };
  }
}

export async function sendOutreachEmail(
  prospect: ContractorProspect,
  email: OutreachEmail
): Promise<boolean> {
  const resend = getResend();

  if (!resend || !prospect.email) {
    console.log('[contractor-outreach] Cannot send - Resend not configured or no email');
    return false;
  }

  try {
    await resend.emails.send({
      from: `${SITE_NAME} <outreach@alstonanalytics.com>`,
      to: prospect.email,
      subject: email.subject,
      text: email.body,
      headers: {
        'X-Entity-Ref-ID': `outreach-${prospect.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
    });

    console.log(`[contractor-outreach] Email sent to ${prospect.email}`);
    return true;
  } catch (error) {
    console.error('[contractor-outreach] Email send failed:', error);
    return false;
  }
}

// Database table for tracking outreach
export const outreachTrackingSchema = `
CREATE TABLE IF NOT EXISTS contractor_outreach (
  id BIGSERIAL PRIMARY KEY,
  prospect_name TEXT NOT NULL,
  prospect_email TEXT,
  prospect_phone TEXT,
  prospect_website TEXT,
  city TEXT NOT NULL,
  services TEXT[],
  source TEXT DEFAULT 'manual',
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

interface OutreachResult {
  prospect: ContractorProspect;
  emailGenerated: boolean;
  emailSent: boolean;
  error?: string;
}

export async function runOutreachCampaign(
  prospects: ContractorProspect[],
  options: { dryRun?: boolean; delayMs?: number } = {}
): Promise<OutreachResult[]> {
  const { dryRun = false, delayMs = 2000 } = options;
  const results: OutreachResult[] = [];

  for (const prospect of prospects) {
    try {
      const email = await generateOutreachEmail(prospect);

      if (dryRun) {
        console.log(`[DRY RUN] Would send to ${prospect.email}:`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Body: ${email.body.slice(0, 200)}...`);
        results.push({ prospect, emailGenerated: true, emailSent: false });
      } else {
        const sent = await sendOutreachEmail(prospect, email);
        results.push({ prospect, emailGenerated: true, emailSent: sent });
      }

      // Rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`[contractor-outreach] Failed for ${prospect.name}:`, error);
      results.push({
        prospect,
        emailGenerated: false,
        emailSent: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

// Helper to find contractors via Google Places API
export async function findContractorsInCity(
  city: string,
  serviceType: string
): Promise<ContractorProspect[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('[contractor-outreach] GOOGLE_PLACES_API_KEY not configured');
    return [];
  }

  const query = `${serviceType} contractor in ${city}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[contractor-outreach] Places API error:', data.status);
      return [];
    }

    const prospects: ContractorProspect[] = [];

    for (const place of data.results.slice(0, 20)) {
      // Get place details for contact info
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address,rating,user_ratings_total&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const details = await detailsRes.json();

      if (details.status === 'OK' && details.result) {
        const result = details.result;

        // Try to extract email from website (would need web scraping)
        // For now, we'll just store the website
        prospects.push({
          name: result.name,
          phone: result.formatted_phone_number,
          website: result.website,
          address: result.formatted_address,
          city,
          services: [serviceType],
          rating: result.rating,
          reviewCount: result.user_ratings_total,
        });
      }

      // Rate limit API calls
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return prospects;
  } catch (error) {
    console.error('[contractor-outreach] Failed to find contractors:', error);
    return [];
  }
}

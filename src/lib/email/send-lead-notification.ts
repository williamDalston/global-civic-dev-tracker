import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface LeadNotificationData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  workType?: string;
  cityName: string;
  sourceUrl?: string;
}

export async function sendLeadNotification(data: LeadNotificationData): Promise<boolean> {
  const resend = getResend();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resend || !adminEmail) {
    console.log('[email] Skipping lead notification — RESEND_API_KEY or ADMIN_EMAIL not configured');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'Civic Tracker <notifications@alstonanalytics.com>',
      to: adminEmail,
      subject: `New Lead: ${data.workType || 'General Inquiry'} in ${data.cityName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Contractor Lead</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Name</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Email</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
            </tr>
            ${data.phone ? `<tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Phone</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.phone)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">City</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.cityName)}</td>
            </tr>
            ${data.workType ? `<tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Work Type</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.workType)}</td>
            </tr>` : ''}
            ${data.message ? `<tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Message</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.message)}</td>
            </tr>` : ''}
            ${data.sourceUrl ? `<tr>
              <td style="padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Source</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;"><a href="${escapeHtml(data.sourceUrl)}">${escapeHtml(data.sourceUrl)}</a></td>
            </tr>` : ''}
          </table>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            This lead was captured on <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://civictracker.com'}">Civic Tracker</a>.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[email] Failed to send lead notification:', err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

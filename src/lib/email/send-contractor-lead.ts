import { Resend } from 'resend';
import { SITE_URL } from '@/lib/config/constants';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface ContractorLeadData {
  contractorEmail: string;
  contractorName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadMessage?: string;
  workType: string;
  price: string;
}

export async function sendLeadNotificationToContractor(data: ContractorLeadData): Promise<boolean> {
  const resend = getResend();

  if (!resend) {
    console.log('[email] Skipping contractor lead notification — RESEND_API_KEY not configured');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'Civic Tracker <leads@alstonanalytics.com>',
      to: data.contractorEmail,
      subject: `New Lead: ${data.workType} project from ${data.leadName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">New Lead for ${escapeHtml(data.contractorName)}</h1>
              <p style="color: #6b7280; margin-top: 8px;">A homeowner is looking for ${escapeHtml(data.workType)} services</p>
            </div>

            <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1e40af;">Contact Information</h2>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Name:</td>
                  <td style="padding: 4px 0; font-weight: 600;">${escapeHtml(data.leadName)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 4px 0;"><a href="mailto:${escapeHtml(data.leadEmail)}" style="color: #3b82f6;">${escapeHtml(data.leadEmail)}</a></td>
                </tr>
                ${data.leadPhone ? `<tr>
                  <td style="padding: 4px 0; color: #6b7280;">Phone:</td>
                  <td style="padding: 4px 0;"><a href="tel:${escapeHtml(data.leadPhone)}" style="color: #3b82f6;">${escapeHtml(data.leadPhone)}</a></td>
                </tr>` : ''}
              </table>
            </div>

            ${data.leadMessage ? `
            <div style="background: #fefce8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #854d0e;">Project Details</h2>
              <p style="margin: 0; color: #713f12;">${escapeHtml(data.leadMessage)}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${SITE_URL}/contractors/dashboard/leads" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Dashboard</a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This lead was charged at ${data.price}. 
                <a href="${SITE_URL}/contractors/dashboard/billing" style="color: #6b7280;">View billing</a>
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 16px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              <a href="${SITE_URL}/contractors/profile" style="color: #6b7280;">Manage preferences</a> · 
              <a href="${SITE_URL}/contractors/dashboard" style="color: #6b7280;">Dashboard</a>
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[email] Failed to send contractor lead notification:', err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

'use server';

import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { escapeHtml } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestFingerprint } from '@/lib/public-submissions';

// ─── in-memory rate limiter ───────────────────────────────────────────────────
type SubmissionWindow = { startedAt: number; count: number };
const submissionWindows = new Map<string, SubmissionWindow>();

function allowContactSubmission(fingerprint: string, maximum: number, windowSeconds: number) {
  const now = Date.now();
  const existing = submissionWindows.get(fingerprint);
  if (!existing || now - existing.startedAt >= windowSeconds * 1000) {
    submissionWindows.set(fingerprint, { startedAt: now, count: 1 });
    return true;
  }
  if (existing.count >= maximum) return false;
  existing.count += 1;
  if (submissionWindows.size > 10000) {
    for (const [key, win] of submissionWindows) {
      if (now - win.startedAt >= 24 * 60 * 60 * 1000) submissionWindows.delete(key);
    }
  }
  return true;
}

// ─── schema ──────────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name:    z.string().trim().min(2).max(100),
  email:   z.string().trim().toLowerCase().email().max(254),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(5000),
  company: z.string().max(200),
});

export type ContactFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

// ─── action ──────────────────────────────────────────────────────────────────
export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot
  const company = formData.get('company');
  if (typeof company === 'string' && company.trim()) {
    return { status: 'success', message: 'Your message has been sent.' };
  }

  const parsed = contactSchema.safeParse({
    name:    formData.get('name'),
    email:   formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
    company: typeof company === 'string' ? company : '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check your details and try again.' };
  }

  const gmailUser   = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  const toEmail     = process.env.CONTACT_TO_EMAIL?.trim()
                   || process.env.SUPPORT_EMAIL?.trim()
                   || 'venoox20@gmail.com';

  if (!gmailUser || !appPassword || appPassword === 'your_16_char_app_password_here') {
    return {
      status: 'error',
      message: `The contact form is not fully configured. Please email us directly at ${toEmail}`,
    };
  }

  // Rate limit
  let ipFp = 'unknown';
  let emailFp = parsed.data.email;
  try {
    [ipFp, emailFp] = await Promise.all([
      getRequestFingerprint('contact'),
      getRequestFingerprint('contact-email', parsed.data.email),
    ]);
  } catch { /* localhost may not have headers */ }

  if (!allowContactSubmission(ipFp, 5, 15 * 60) || !allowContactSubmission(emailFp, 3, 24 * 60 * 60)) {
    return { status: 'error', message: 'Too many messages submitted. Please wait a few minutes and try again.' };
  }

  const { name, email, subject, message } = parsed.data;
  const submissionId  = randomUUID();
  const submittedAt   = new Date().toISOString();
  const formattedTime = new Date(submittedAt).toLocaleString('en-US', {
    timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short',
  });
  const initials = name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const refId    = submissionId.slice(0, 8).toUpperCase();

  // ── HTML email template ───────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>New message from ${escapeHtml(name)} – AK Drop Support</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f3f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f3f8;opacity:0;">
    ${escapeHtml(name)} wrote about "${escapeHtml(subject)}" — reply to ${escapeHtml(email)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f4f3f8;padding:40px 16px 56px;">
    <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:560px;width:100%;">

      <!-- brand bar -->
      <tr>
        <td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td valign="middle">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td style="background-color:#7c3aed;border-radius:8px;padding:7px 13px;">
                      <span style="color:#ffffff;font-size:11px;font-weight:900;letter-spacing:4px;">AK&nbsp;DROP</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right" valign="middle">
                <span style="color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Support Inbox</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- main card -->
      <tr>
        <td style="border-radius:16px;overflow:hidden;background-color:#ffffff;border:1px solid #e5e7eb;">

          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">

            <!-- purple top stripe -->
            <tr><td height="4" style="height:4px;background-color:#7c3aed;font-size:0;line-height:0;">&nbsp;</td></tr>

            <!-- dark sender hero -->
            <tr>
              <td style="background-color:#1e1b2e;padding:28px 32px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <!-- avatar -->
                    <td width="56" valign="middle" style="padding-right:14px;">
                      <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                        <tr>
                          <td width="44" height="44" style="width:44px;height:44px;background-color:#7c3aed;border-radius:50%;text-align:center;vertical-align:middle;">
                            <span style="color:#ffffff;font-size:15px;font-weight:900;line-height:44px;display:inline-block;width:44px;text-align:center;">${initials}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <!-- name + email -->
                    <td valign="middle">
                      <p style="margin:0 0 2px;color:#f9fafb;font-size:16px;font-weight:800;line-height:1.2;">${escapeHtml(name)}</p>
                      <a href="mailto:${escapeHtml(email)}" style="color:#a78bfa;font-size:12px;text-decoration:none;">${escapeHtml(email)}</a>
                    </td>
                    <!-- new message pill -->
                    <td align="right" valign="middle">
                      <span style="display:inline-block;border:1px solid #374151;background-color:#111827;border-radius:20px;padding:4px 11px;color:#a78bfa;font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;white-space:nowrap;">New&nbsp;Message</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- subject band -->
            <tr>
              <td style="background-color:#161427;border-top:1px solid #2d2b3d;border-bottom:1px solid #e5e7eb;padding:18px 32px 20px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Subject</p>
                <p style="margin:0;color:#f9fafb;font-size:18px;font-weight:800;line-height:1.35;letter-spacing:-0.2px;">${escapeHtml(subject)}</p>
              </td>
            </tr>

            <!-- message body — white bg for readability -->
            <tr>
              <td style="background-color:#ffffff;padding:28px 32px 24px;">
                <p style="margin:0 0 14px;color:#9ca3af;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Message</p>
                <p style="margin:0;color:#111827;font-size:15px;line-height:1.85;white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</p>
              </td>
            </tr>

            <!-- reply CTA -->
            <tr>
              <td style="background-color:#fafafa;border-top:1px solid #f3f4f6;padding:22px 32px 24px;">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td>
                      <a href="mailto:${escapeHtml(email)}?subject=Re%3A%20${encodeURIComponent(subject)}"
                        style="display:inline-block;padding:12px 28px;background-color:#7c3aed;color:#ffffff;font-size:13px;font-weight:800;letter-spacing:0.3px;text-decoration:none;border-radius:10px;">
                        ↩&nbsp;&nbsp;Reply to ${escapeHtml(name)}
                      </a>
                    </td>
                    <td style="padding-left:16px;vertical-align:middle;">
                      <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.5;">Opens a reply pre-addressed<br>directly to the customer</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- meta row -->
            <tr>
              <td style="background-color:#f9fafb;border-top:1px solid #f3f4f6;padding:14px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td valign="middle">
                      <span style="color:#d1d5db;font-size:10px;">Received &nbsp;<strong style="color:#9ca3af;">${formattedTime}</strong></span>
                    </td>
                    <td align="right" valign="middle">
                      <span style="font-family:monospace;color:#d1d5db;font-size:10px;">Ref:&nbsp;${refId}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- dark footer -->
            <tr>
              <td style="background-color:#1e1b2e;border-top:1px solid #2d2b3d;padding:16px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td valign="middle">
                      <span style="color:#4b5563;font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">AK&nbsp;DROP</span>
                      <span style="color:#374151;font-size:10px;">&nbsp;·&nbsp;Support Notification</span>
                    </td>
                    <td align="right" valign="middle">
                      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:#22c55e;vertical-align:middle;margin-right:5px;"></span>
                      <span style="color:#4b5563;font-size:10px;vertical-align:middle;">Sent via Gmail SMTP</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- purple bottom stripe -->
            <tr><td height="3" style="height:3px;background-color:#7c3aed;font-size:0;line-height:0;">&nbsp;</td></tr>

          </table>
        </td>
      </tr>

      <!-- outside caption -->
      <tr>
        <td style="padding-top:18px;text-align:center;">
          <p style="margin:0;color:#c4b5fd;font-size:10px;">Handle customer information with care &nbsp;·&nbsp; AK Drop Commerce Platform</p>
        </td>
      </tr>

    </table>
    </td></tr>
  </table>

</body>
</html>`;

  // ── send via Gmail SMTP ───────────────────────────────────────────────────
  let emailSent = false;
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: appPassword },
    });

    await transporter.sendMail({
      // Show customer name so inbox reads e.g. "Abraham Gebeyehu via AK Drop"
      // instead of "me". Reply-To ensures replies go to the customer.
      from:    `"${name.replace(/"/g, '')} via AK Drop" <${gmailUser}>`,
      to:      toEmail,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `✉ ${name} – ${subject}`,
      html,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n\nReceived: ${formattedTime}\nRef: ${refId}`,
    });

    emailSent = true;
    console.log('Contact email sent via Gmail SMTP to', toEmail);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Gmail SMTP send failed:', msg);
    if (msg.includes('Invalid login') || msg.includes('Username and Password not accepted')) {
      return { status: 'error', message: 'Gmail authentication failed. Check GMAIL_APP_PASSWORD in .env.local.' };
    }
    return { status: 'error', message: 'Could not send your message right now. Please try again or email us directly.' };
  }

  // ── save to Supabase (best-effort) ────────────────────────────────────────
  if (emailSent) {
    try {
      const admin = createAdminClient();
      await admin.from('contact_submissions').insert({
        id: submissionId, name, email, subject, message,
        status: 'new', created_at: submittedAt,
      });
    } catch (err) {
      console.error('Contact DB save failed (non-fatal):', err instanceof Error ? err.message : err);
    }
  }

  return {
    status: 'success',
    message: "Thanks for reaching out! Your message has been sent and we'll reply to your email shortly.",
  };
}

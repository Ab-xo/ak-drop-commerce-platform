/**
 * Run: node scripts/test-smtp.mjs
 * Sends a realistic contact form test email using the full AK Drop template.
 */
import { readFileSync } from 'fs';
import { createTransport } from 'nodemailer';

// Parse .env.local
const env = {};
const lines = readFileSync('.env.local', 'utf8').split('\n');
for (const line of lines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const gmailUser  = env.GMAIL_USER;
const appPass    = env.GMAIL_APP_PASSWORD;
const toEmail    = env.CONTACT_TO_EMAIL || env.SUPPORT_EMAIL || gmailUser;

if (!gmailUser || !appPass) {
  console.error('GMAIL_USER or GMAIL_APP_PASSWORD missing in .env.local');
  process.exit(1);
}

// ── test data ──
const name    = 'Abraham Gebeyehu';
const email   = 'venoox20@gmail.com';
const subject = 'Order inquiry – AJ1 High Yellow Ochre delivery timeline';
const message = `Hi AK Drop team,\n\nI recently placed an order for the AJ1 High Yellow Ochre and wanted to check on the estimated delivery timeline to Addis Ababa.\n\nCould you also confirm whether the item has been shipped yet? The order number is AKD-FC2A5F064F87.\n\nThank you for your help.`;
const submissionId = 'TEST-' + Date.now().toString(36).toUpperCase();
const formattedTime = new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' });
const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

function escapeHtml(v) {
  return v.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
}

const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>AK Drop – New Message</title></head>
<body style="margin:0;padding:0;background-color:#09080f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#09080f;opacity:0;">
    ${escapeHtml(name)} says: ${escapeHtml(subject)} — reply to ${escapeHtml(email)}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#09080f;padding:36px 16px 48px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:580px;width:100%;">

        <!-- top nav -->
        <tr>
          <td style="padding:0 0 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td valign="middle">
                  <span style="display:inline-block;background-color:#7c3aed;border-radius:8px;padding:6px 12px;color:#fff;font-size:11px;font-weight:900;letter-spacing:4px;">AK DROP</span>
                </td>
                <td align="right" valign="middle">
                  <span style="color:#3d3356;font-size:10px;font-weight:600;letter-spacing:1px;">SUPPORT INBOX</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- hero: sender + subject -->
        <tr>
          <td style="border-radius:20px 20px 0 0;background-color:#13101f;border:1px solid #2a2040;border-bottom:none;padding:32px 32px 28px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;width:100%;">
              <tr>
                <td valign="middle" width="62" style="padding-right:14px;">
                  <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                    <tr>
                      <td width="48" height="48" style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);text-align:center;line-height:48px;font-size:0;">
                        <span style="color:#fff;font-size:17px;font-weight:900;line-height:48px;display:inline-block;">${initials}</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td valign="middle">
                  <p style="margin:0;color:#f5f3ff;font-size:16px;font-weight:800;line-height:1.3;">${escapeHtml(name)}</p>
                  <p style="margin:3px 0 0;">
                    <a href="mailto:${escapeHtml(email)}" style="color:#a78bfa;font-size:13px;text-decoration:none;font-weight:500;">${escapeHtml(email)}</a>
                  </p>
                </td>
                <td align="right" valign="top">
                  <span style="display:inline-block;background-color:#1e1930;border:1px solid #2a2040;border-radius:20px;padding:5px 12px;color:#a78bfa;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">New message</span>
                </td>
              </tr>
            </table>
            <div style="height:1px;background-color:#1e1930;margin-bottom:24px;"></div>
            <p style="margin:0 0 8px;color:#6b5f85;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">About</p>
            <h1 style="margin:0;color:#f5f3ff;font-size:21px;font-weight:900;line-height:1.3;letter-spacing:-0.3px;">${escapeHtml(subject)}</h1>
            <p style="margin:10px 0 0;color:#6b5f85;font-size:12px;">Received ${formattedTime} &nbsp;·&nbsp; <span style="font-family:monospace;font-size:11px;">Ref: ${submissionId.slice(0,12)}</span></p>
          </td>
        </tr>

        <!-- message -->
        <tr>
          <td style="background-color:#0f0d1a;border-left:1px solid #2a2040;border-right:1px solid #2a2040;padding:0 32px;">
            <div style="height:1px;background-color:#1e1930;"></div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#0f0d1a;border-left:1px solid #2a2040;border-right:1px solid #2a2040;padding:28px 32px;">
            <p style="margin:0 0 14px;color:#6b5f85;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Message</p>
            <p style="margin:0;color:#d8d0f0;font-size:15px;line-height:1.9;white-space:pre-wrap;word-break:break-word;">${escapeHtml(message)}</p>
          </td>
        </tr>

        <!-- reply cta -->
        <tr>
          <td style="background-color:#0f0d1a;border-left:1px solid #2a2040;border-right:1px solid #2a2040;padding:0 32px 32px;">
            <div style="height:1px;background-color:#1e1930;margin-bottom:24px;"></div>
            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td style="border-radius:12px;overflow:hidden;">
                  <a href="mailto:${escapeHtml(email)}?subject=Re: ${escapeHtml(subject)}"
                    style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-size:13px;font-weight:800;letter-spacing:0.5px;text-decoration:none;border-radius:12px;">
                    ↩&nbsp; Reply to ${escapeHtml(name)}
                  </a>
                </td>
                <td style="padding-left:14px;">
                  <span style="color:#3d3356;font-size:11px;line-height:1.6;">Clicking reply sends<br>directly to their inbox</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="background-color:#0a0812;border:1px solid #2a2040;border-top:1px solid #1e1930;border-radius:0 0 20px 20px;padding:18px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td valign="middle">
                  <span style="color:#2a2040;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">AK DROP</span>
                  <span style="color:#1e1930;font-size:11px;"> · </span>
                  <span style="color:#2a2040;font-size:11px;">Support Notification</span>
                </td>
                <td align="right" valign="middle">
                  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:#22c55e;vertical-align:middle;margin-right:5px;"></span>
                  <span style="color:#2a2040;font-size:10px;vertical-align:middle;">Delivered via Gmail SMTP</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- bottom gradient line -->
        <tr>
          <td style="padding-top:24px;">
            <div style="height:2px;background:linear-gradient(90deg,transparent,#7c3aed,#a855f7,#7c3aed,transparent);border-radius:2px;"></div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

console.log('Testing Gmail SMTP with full contact template...');
console.log('  From:', gmailUser, '→ To:', toEmail);
console.log('  Simulating message from:', name, '<' + email + '>');

const transporter = createTransport({
  host: 'smtp.gmail.com', port: 465, secure: true,
  auth: { user: gmailUser, pass: appPass },
});

try {
  await transporter.verify();
  console.log('✅ SMTP connection verified');
} catch (e) {
  console.error('❌ SMTP failed:', e.message);
  process.exit(1);
}

const info = await transporter.sendMail({
  from:    `"AK Drop Contact Form" <${gmailUser}>`,
  to:      toEmail,
  replyTo: `"${name}" <${email}>`,
  subject: `[AK Drop] New message from ${name} – ${subject}`,
  html,
  text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n\nReceived: ${formattedTime}\nRef: ${submissionId}`,
});

console.log('✅ Email sent! Message ID:', info.messageId);
console.log('\nCheck your inbox at', toEmail);
console.log('You should see: sender name, email, subject, full message, reply button.');

import 'server-only';
import nodemailer from 'nodemailer';

type OrderItem = {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
};

type OrderEmailData = {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotalEtb: number;
  shippingAddress: {
    full_name?: string;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    phone?: string;
  };
  currency: string;
};

function escHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c] ?? c));
}

function fmtEtb(amount: number) {
  return `ETB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const gmailUser  = process.env.GMAIL_USER?.trim();
  const appPass    = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!gmailUser || !appPass || appPass === 'your_16_char_app_password_here') {
    console.warn('Gmail SMTP not configured — skipping order confirmation email.');
    return;
  }

  const { orderNumber, orderId, customerName, customerEmail, items, subtotalEtb, shippingAddress } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000';

  const itemRows = items.map((item) => {
    const opts = [item.size ? `Size ${item.size}` : null, item.color].filter(Boolean).join(' · ');
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2d2b3d;vertical-align:top;">
          <p style="margin:0;color:#f9fafb;font-size:14px;font-weight:600;">${escHtml(item.product_name)}</p>
          ${opts ? `<p style="margin:3px 0 0;color:#8b7faa;font-size:12px;">${escHtml(opts)}</p>` : ''}
          ${item.product_sku ? `<p style="margin:2px 0 0;color:#6b5f85;font-size:11px;">SKU: ${escHtml(item.product_sku)}</p>` : ''}
        </td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #2d2b3d;text-align:center;color:#8b7faa;font-size:13px;white-space:nowrap;">×${item.quantity}</td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #2d2b3d;text-align:right;color:#f9fafb;font-size:13px;font-weight:700;white-space:nowrap;">${fmtEtb(item.unit_price * item.quantity)}</td>
      </tr>`;
  }).join('');

  const addr = [
    shippingAddress.address,
    [shippingAddress.city, shippingAddress.region].filter(Boolean).join(', '),
    shippingAddress.country,
  ].filter(Boolean).join('<br>');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#09080f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#09080f;opacity:0;">
    Order #${escHtml(orderNumber)} confirmed — thank you for shopping with AK Drop.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#09080f;padding:36px 16px 48px;">
    <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:580px;width:100%;">

      <!-- Brand bar -->
      <tr><td style="padding-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td><span style="display:inline-block;background-color:#7c3aed;border-radius:8px;padding:7px 13px;color:#fff;font-size:11px;font-weight:900;letter-spacing:4px;">AK&nbsp;DROP</span></td>
            <td align="right"><span style="color:#3d3356;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Order Confirmation</span></td>
          </tr>
        </table>
      </td></tr>

      <!-- Main card -->
      <tr><td style="border-radius:16px;overflow:hidden;background-color:#13101f;border:1px solid #2a2040;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <!-- top stripe -->
          <tr><td height="4" style="height:4px;background-color:#7c3aed;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Hero -->
          <tr><td style="padding:28px 32px 24px;background-color:#1e1b2e;">
            <p style="margin:0 0 6px;color:#a78bfa;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Order Confirmed</p>
            <h1 style="margin:0;color:#f9fafb;font-size:24px;font-weight:900;line-height:1.3;">
              Thank you, ${escHtml(customerName.split(' ')[0])}!
            </h1>
            <p style="margin:8px 0 0;color:#8b7faa;font-size:13px;line-height:1.6;">
              Your order has been received and payment confirmed. We'll update you when it ships.
            </p>
            <table style="margin-top:16px;" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td style="background-color:#0f0d1a;border:1px solid #2a2040;border-radius:10px;padding:12px 20px;">
                  <p style="margin:0 0 2px;color:#6b5f85;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Order number</p>
                  <p style="margin:0;color:#a78bfa;font-size:16px;font-weight:900;font-family:monospace;">#${escHtml(orderNumber)}</p>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- Items -->
          <tr><td style="padding:24px 32px;background-color:#0f0d1a;border-top:1px solid #2a2040;">
            <p style="margin:0 0 16px;color:#6b5f85;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Items ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              ${itemRows}
              <tr>
                <td colspan="2" style="padding:14px 0 0;text-align:right;color:#8b7faa;font-size:12px;">Product subtotal</td>
                <td style="padding:14px 0 0;text-align:right;color:#f9fafb;font-size:14px;font-weight:900;">${fmtEtb(subtotalEtb)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding:4px 0 0;text-align:right;color:#6b5f85;font-size:11px;">
                  Delivery fee: not included · charges in ETB
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- Delivery address -->
          <tr><td style="padding:24px 32px;background-color:#13101f;border-top:1px solid #2a2040;">
            <p style="margin:0 0 10px;color:#6b5f85;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Delivery address</p>
            <p style="margin:0;color:#d8d0f0;font-size:13px;line-height:1.8;">${escHtml(shippingAddress.full_name || customerName)}<br>${addr}${shippingAddress.phone ? `<br>${escHtml(shippingAddress.phone)}` : ''}</p>
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding:24px 32px;background-color:#0f0d1a;border-top:1px solid #2a2040;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td style="border-radius:10px;overflow:hidden;">
                  <a href="${siteUrl}/orders/${encodeURIComponent(orderId)}"
                    style="display:inline-block;padding:13px 28px;background-color:#7c3aed;color:#fff;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;">
                    View order details →
                  </a>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background-color:#1e1b2e;border-top:1px solid #2d2b3d;padding:16px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td><span style="color:#4b5563;font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">AK&nbsp;DROP</span><span style="color:#374151;font-size:10px;"> · Order Confirmation</span></td>
                <td align="right"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:#22c55e;vertical-align:middle;margin-right:5px;"></span><span style="color:#4b5563;font-size:10px;vertical-align:middle;">Payment confirmed</span></td>
              </tr>
            </table>
          </td></tr>
          <tr><td height="3" style="height:3px;background-color:#7c3aed;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding-top:18px;text-align:center;">
        <p style="margin:0;color:#3d3356;font-size:10px;">AK Drop Commerce Platform · Orders stored in ETB</p>
      </td></tr>

    </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: appPass },
  });

  await transporter.sendMail({
    from: `"AK Drop" <${gmailUser}>`,
    to: customerEmail,
    replyTo: gmailUser,
    subject: `✅ Order confirmed – #${orderNumber}`,
    html,
    text: `Order #${orderNumber} confirmed.\n\nThank you, ${customerName}! Your order has been received.\n\nItems:\n${items.map((i) => `  ${i.product_name} ×${i.quantity} — ${fmtEtb(i.unit_price * i.quantity)}`).join('\n')}\n\nSubtotal: ${fmtEtb(subtotalEtb)}\n\nView order: ${siteUrl}/orders/${orderId}`,
  });

  console.log(`Order confirmation email sent to ${customerEmail} for order #${orderNumber}`);
}

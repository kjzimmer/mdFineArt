import { Resend } from 'resend';

const FROM_ONBOARDING = process.env.RESEND_FROM_EMAIL ?? 'onboarding@mygalleryworks.com';
const FROM_NOTIFICATIONS = process.env.RESEND_NOTIFY_EMAIL ?? 'notifications@mygalleryworks.com';

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

export interface WelcomeEmailParams {
  to: string;
  galleryName: string;
  previewUrl: string;
  customDomainUrl?: string;
  adminUrl: string;
  password?: string;
  nameservers?: string[];
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { to, galleryName, previewUrl, customDomainUrl, adminUrl, password, nameservers } = params;

  const nsSection = (nameservers && nameservers.length > 0 && customDomainUrl) ? `
            <!-- NS instructions — shown first so client sees this before clicking URLs -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 32px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Step 1 — Point Your Domain</p>
                <p style="margin:0 0 16px;color:#3d3530;font-size:14px;line-height:1.7;">
                  To activate <strong>${customDomainUrl.replace('https://', '')}</strong>, update your nameservers at your domain registrar to the following:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:6px;padding:0;">
                  <tr><td style="padding:12px 16px;">
                    ${nameservers.map(ns => `<p style="margin:0 0 6px;color:#1a1612;font-size:13px;font-family:monospace;">${ns}</p>`).join('')}
                  </td></tr>
                </table>
                <p style="margin:12px 0 0;color:#8a7a6e;font-size:13px;line-height:1.6;">
                  DNS changes typically propagate within a few hours. While you wait, use your preview URL to log in and start setting up your gallery — everything you configure now will carry over automatically when the domain is live.
                </p>
              </td></tr>
            </table>` : '';

  const urlsSection = `
            <!-- URLs -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 32px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 16px;color:#8a7a6e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">${nameservers?.length ? 'Step 2 — Your Gallery URLs' : 'Your Gallery URLs'}</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;width:90px;">Preview</td>
                    <td style="padding:6px 0;"><a href="${previewUrl}" style="color:#c9a96e;text-decoration:none;font-size:13px;">${previewUrl}</a></td>
                  </tr>
                  ${customDomainUrl ? `
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;">Main URL</td>
                    <td style="padding:6px 0;color:#3d3530;font-size:13px;">${customDomainUrl.replace('https://', '')} <span style="color:#b0a89e;font-size:12px;">(active after NS switch)</span></td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;">Admin</td>
                    <td style="padding:6px 0;"><a href="${adminUrl}" style="color:#c9a96e;text-decoration:none;font-size:13px;">${adminUrl}</a></td>
                  </tr>
                </table>
              </td></tr>
            </table>`;

  const credentialsSection = password ? `
            <!-- Credentials -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 32px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 16px;color:#8a7a6e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">${nameservers?.length ? 'Step 3 — Your Login' : 'Your Login'}</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;width:90px;">Email</td>
                    <td style="padding:6px 0;color:#3d3530;font-size:13px;">${to}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;">Password</td>
                    <td style="padding:6px 0;color:#3d3530;font-size:13px;font-family:monospace;">${password}</td>
                  </tr>
                </table>
                <p style="margin:12px 0 0;color:#8a7a6e;font-size:12px;">We recommend changing your password after your first login.</p>
              </td></tr>
            </table>` : `
            <p style="margin:0 0 32px;color:#8a7a6e;font-size:13px;line-height:1.7;">
              Sign in with your existing Gallery Works credentials.
            </p>`;

  await getResend().emails.send({
    from: FROM_ONBOARDING,
    to,
    subject: `Your ${galleryName} gallery is ready`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9f7f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1612;padding:36px 48px;text-align:center;">
            <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Gallery Works</p>
            <h1 style="margin:12px 0 0;color:#f5f0eb;font-size:24px;font-weight:normal;letter-spacing:0.05em;">${galleryName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 32px;color:#3d3530;font-size:16px;line-height:1.7;">
              Welcome — your gallery is ready. Here's how to get started.
            </p>

            ${nsSection}
            ${urlsSection}
            ${credentialsSection}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #ede8e3;text-align:center;">
            <p style="margin:0;color:#b0a89e;font-size:12px;">Gallery Works · <a href="https://mygalleryworks.com" style="color:#b0a89e;">mygalleryworks.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  galleryName: string;
  resetUrl: string;
}): Promise<void> {
  const { to, galleryName, resetUrl } = params;
  await getResend().emails.send({
    from: FROM_NOTIFICATIONS,
    to,
    subject: `Reset your ${galleryName} password`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1612;padding:36px 48px;text-align:center;">
            <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Gallery Works</p>
            <h1 style="margin:12px 0 0;color:#f5f0eb;font-size:24px;font-weight:normal;letter-spacing:0.05em;">${galleryName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 24px;color:#3d3530;font-size:16px;line-height:1.7;">
              We received a request to reset your password.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr><td align="center">
                <a href="${resetUrl}" style="display:inline-block;background:#c9a96e;color:#1a1612;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.05em;padding:14px 32px;border-radius:10px;">
                  Reset Password
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 12px;color:#8a7a6e;font-size:13px;line-height:1.7;">
              This link expires in 1 hour. If you didn't request a password reset, you can ignore this email — your password won't change.
            </p>
            <p style="margin:0;color:#b0a89e;font-size:12px;line-height:1.7;word-break:break-all;">
              Or copy this link: ${resetUrl}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #ede8e3;text-align:center;">
            <p style="margin:0;color:#b0a89e;font-size:12px;">Gallery Works · <a href="https://mygalleryworks.com" style="color:#b0a89e;">mygalleryworks.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

function notificationHtml(galleryName: string, rows: { label: string; value: string }[], bodyBlock?: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1612;padding:28px 48px;">
            <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">${galleryName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 24px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${rows.map(r => `
                  <tr>
                    <td style="padding:5px 0;color:#8a7a6e;font-size:13px;width:80px;vertical-align:top;">${r.label}</td>
                    <td style="padding:5px 0;color:#3d3530;font-size:13px;">${r.value}</td>
                  </tr>`).join('')}
                </table>
              </td></tr>
            </table>
            ${bodyBlock ? `<div style="color:#3d3530;font-size:14px;line-height:1.7;white-space:pre-wrap;">${bodyBlock}</div>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 48px;border-top:1px solid #ede8e3;text-align:center;">
            <p style="margin:0;color:#b0a89e;font-size:12px;">Gallery Works · <a href="https://mygalleryworks.com" style="color:#b0a89e;">mygalleryworks.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendContactNotification(params: {
  to: string;
  galleryName: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<void> {
  const { to, galleryName, name, email, phone, subject, message } = params;
  await getResend().emails.send({
    from: FROM_NOTIFICATIONS,
    to,
    replyTo: email,
    subject: `New message: ${subject} — ${name}`,
    html: notificationHtml(galleryName, [
      { label: 'From', value: name },
      { label: 'Email', value: email },
      ...(phone ? [{ label: 'Phone', value: phone }] : []),
      { label: 'Subject', value: subject },
    ], message),
  });
}

export interface InvoiceEmailParams {
  to: string;
  recipientName: string;
  galleryName: string;
  invoiceUrl: string;
  amount: number;
  items: Array<{ label: string; quantity: number; unitPrice: number }>;
  notes: string | null;
}

export async function sendInvoiceEmail(params: InvoiceEmailParams): Promise<void> {
  const { to, recipientName, galleryName, invoiceUrl, amount, items, notes } = params;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 0;color:#3d3530;font-size:13px;border-bottom:1px solid #ede8e3;">${item.label}</td>
      <td style="padding:8px 0;color:#8a7a6e;font-size:13px;text-align:center;border-bottom:1px solid #ede8e3;">${item.quantity}</td>
      <td style="padding:8px 0;color:#3d3530;font-size:13px;text-align:right;border-bottom:1px solid #ede8e3;">${fmt(item.unitPrice * item.quantity)}</td>
    </tr>`).join('');

  await getResend().emails.send({
    from: FROM_NOTIFICATIONS,
    to,
    subject: `Invoice from ${galleryName}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1612;padding:36px 48px;text-align:center;">
            <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Gallery Works</p>
            <h1 style="margin:12px 0 0;color:#f5f0eb;font-size:24px;font-weight:normal;letter-spacing:0.05em;">${galleryName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 28px;color:#3d3530;font-size:15px;line-height:1.7;">
              Hello ${recipientName}, you have an invoice ready for payment.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
              <thead>
                <tr>
                  <th style="padding:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:left;font-weight:normal;border-bottom:2px solid #ede8e3;">Item</th>
                  <th style="padding:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:center;font-weight:normal;border-bottom:2px solid #ede8e3;">Qty</th>
                  <th style="padding:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:right;font-weight:normal;border-bottom:2px solid #ede8e3;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="padding:12px 0 0;color:#1a1612;font-size:16px;font-weight:bold;">Total</td>
                <td></td>
                <td style="padding:12px 0 0;color:#1a1612;font-size:16px;font-weight:bold;text-align:right;">${fmt(amount)}</td>
              </tr>
            </table>
            ${notes ? `<p style="margin:0 0 28px;color:#8a7a6e;font-size:13px;line-height:1.7;background:#f9f7f5;border-radius:8px;padding:16px 20px;">${notes}</p>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr><td align="center">
                <a href="${invoiceUrl}" style="display:inline-block;background:#c9a96e;color:#1a1612;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.05em;padding:16px 40px;border-radius:10px;">
                  View &amp; Pay Invoice
                </a>
              </td></tr>
            </table>
            <p style="margin:0;color:#b0a89e;font-size:12px;line-height:1.7;text-align:center;word-break:break-all;">
              Or copy this link: <a href="${invoiceUrl}" style="color:#b0a89e;">${invoiceUrl}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #ede8e3;text-align:center;">
            <p style="margin:0;color:#b0a89e;font-size:12px;">Gallery Works · <a href="https://mygalleryworks.com" style="color:#b0a89e;">mygalleryworks.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  recipientName: string;
  galleryName: string;
  amount: number;
  paidAt: Date;
  items: Array<{ label: string; quantity: number; unitPrice: number }>;
}): Promise<void> {
  const { to, recipientName, galleryName, amount, paidAt, items } = params;
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:8px 0;color:#3d3530;font-size:13px;border-bottom:1px solid #ede8e3;">${item.label}</td>
      <td style="padding:8px 0;color:#8a7a6e;font-size:13px;text-align:center;border-bottom:1px solid #ede8e3;">${item.quantity}</td>
      <td style="padding:8px 0;color:#3d3530;font-size:13px;text-align:right;border-bottom:1px solid #ede8e3;">${fmt(item.unitPrice * item.quantity)}</td>
    </tr>`).join('');

  await getResend().emails.send({
    from: FROM_NOTIFICATIONS,
    to,
    subject: `Payment received — ${galleryName}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1612;padding:36px 48px;text-align:center;">
            <p style="margin:0;color:#c9a96e;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Gallery Works</p>
            <h1 style="margin:12px 0 0;color:#f5f0eb;font-size:24px;font-weight:normal;letter-spacing:0.05em;">${galleryName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <div style="text-align:center;margin:0 0 32px;">
              <div style="display:inline-block;width:48px;height:48px;background:#2d6a4f;border-radius:50%;line-height:48px;text-align:center;font-size:22px;color:#ffffff;">✓</div>
              <p style="margin:16px 0 0;color:#3d3530;font-size:16px;line-height:1.7;">
                Thank you, ${recipientName}. Your payment has been received.
              </p>
              <p style="margin:4px 0 0;color:#8a7a6e;font-size:13px;">
                ${paidAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
              <thead>
                <tr>
                  <th style="padding:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:left;font-weight:normal;border-bottom:2px solid #ede8e3;">Item</th>
                  <th style="padding:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:center;font-weight:normal;border-bottom:2px solid #ede8e3;">Qty</th>
                  <th style="padding:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:right;font-weight:normal;border-bottom:2px solid #ede8e3;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 0;">
              <tr>
                <td style="padding:12px 0 0;color:#1a1612;font-size:16px;font-weight:bold;">Total paid</td>
                <td></td>
                <td style="padding:12px 0 0;color:#1a1612;font-size:16px;font-weight:bold;text-align:right;">${fmt(amount)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #ede8e3;text-align:center;">
            <p style="margin:0;color:#b0a89e;font-size:12px;">Gallery Works · <a href="https://mygalleryworks.com" style="color:#b0a89e;">mygalleryworks.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendCommissionNotification(params: {
  to: string;
  galleryName: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
}): Promise<void> {
  const { to, galleryName, name, email, phone, subject, description } = params;
  await getResend().emails.send({
    from: FROM_NOTIFICATIONS,
    to,
    replyTo: email,
    subject: `Commission request: ${subject} — ${name}`,
    html: notificationHtml(galleryName, [
      { label: 'From', value: name },
      { label: 'Email', value: email },
      ...(phone ? [{ label: 'Phone', value: phone }] : []),
      { label: 'Subject', value: subject },
    ], description),
  });
}

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@mygalleryworks.com';

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

  const credentialsSection = password ? `
            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 32px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 16px;color:#8a7a6e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Your Login Details</p>
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
              </td></tr>
            </table>` : `
            <p style="margin:0 0 32px;color:#8a7a6e;font-size:13px;line-height:1.7;">
              Sign in with your existing Gallery Works credentials.
            </p>`;

  const nameserverSection = (nameservers && nameservers.length > 0) ? `
            <!-- NS instructions -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 32px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 8px;color:#8a7a6e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Point Your Domain</p>
                <p style="margin:0 0 16px;color:#3d3530;font-size:13px;line-height:1.6;">
                  To activate <strong>${customDomainUrl?.replace('https://', '')}</strong>, update your nameservers at your domain registrar to:
                </p>
                ${nameservers.map(ns => `<p style="margin:0 0 6px;color:#3d3530;font-size:13px;font-family:monospace;">${ns}</p>`).join('')}
                <p style="margin:12px 0 0;color:#8a7a6e;font-size:12px;line-height:1.6;">
                  DNS changes typically propagate within a few hours. Until then, use your preview URL below.
                </p>
              </td></tr>
            </table>` : '';

  await resend.emails.send({
    from: FROM,
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
            <p style="margin:0 0 24px;color:#3d3530;font-size:16px;line-height:1.7;">
              Welcome — your gallery is live and ready to set up.
            </p>

            <!-- URLs box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f5;border-radius:8px;margin:0 0 32px;">
              <tr><td style="padding:24px 28px;">
                <p style="margin:0 0 16px;color:#8a7a6e;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Your Gallery URLs</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${customDomainUrl ? `
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;width:90px;">Main URL</td>
                    <td style="padding:6px 0;"><a href="${customDomainUrl}" style="color:#c9a96e;text-decoration:none;font-size:13px;">${customDomainUrl}</a></td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;width:90px;">Preview</td>
                    <td style="padding:6px 0;"><a href="${previewUrl}" style="color:#c9a96e;text-decoration:none;font-size:13px;">${previewUrl}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a7a6e;font-size:13px;">Admin</td>
                    <td style="padding:6px 0;"><a href="${adminUrl}" style="color:#c9a96e;text-decoration:none;font-size:13px;">${adminUrl}</a></td>
                  </tr>
                </table>
              </td></tr>
            </table>

            ${credentialsSection}

            ${nameserverSection}

            <p style="margin:0 0 16px;color:#3d3530;font-size:15px;line-height:1.7;">
              Sign in at the admin link above to add your paintings, configure your site, and customize your gallery.
            </p>
            ${password ? `<p style="margin:0;color:#8a7a6e;font-size:13px;line-height:1.7;">
              We recommend changing your password after your first login.
            </p>` : ''}
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

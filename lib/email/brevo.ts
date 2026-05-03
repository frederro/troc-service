import { BrevoClient } from '@getbrevo/brevo';

const BRAND = '#1D9E75';
const SENDER = { email: 'noreply@troc-service.fr', name: 'Troc-Service' };

function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_URL?.trim();
  if (raw) return raw.replace(/\/+$/, '');
  return 'http://localhost:3000';
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Gabarit HTML commun : bandeau vert, contenu, lien vers le site. */
export function buildTransactionalHtml(innerBodyHtml: string): string {
  const siteUrl = escapeHtml(appBaseUrl());
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Troc-Service</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f2;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f4f2;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e1e8e4;">
          <tr>
            <td style="background:${BRAND};padding:20px 24px;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;">Troc-Service</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#333333;font-size:16px;line-height:1.6;">
              ${innerBodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 28px;">
              <a href="${siteUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Voir sur Troc-Service</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBrevoTransactionalEmail(params: {
  toEmail: string;
  toName: string;
  subject: string;
  innerBodyHtml: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY manquant');
  }
  const client = new BrevoClient({ apiKey });
  await client.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: params.toEmail, name: params.toName }],
    subject: params.subject,
    htmlContent: buildTransactionalHtml(params.innerBodyHtml),
  });
}

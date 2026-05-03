import { NextRequest, NextResponse } from 'next/server';
import { BrevoClient } from '@getbrevo/brevo';
import { buildTransactionalHtml, escapeHtml } from '@/lib/email/brevo';

const SENDER = { email: 'noreply@troc-service.eu', name: 'Troc-Service' };

type MatchBody = {
  membre1_email?: string;
  membre1_nom?: string;
  membre2_nom?: string;
  annonce_titre?: string;
};

export async function POST(req: NextRequest) {
  let body: MatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { membre1_email, membre1_nom, membre2_nom, annonce_titre } = body;

  if (
    !membre1_email?.trim() ||
    !membre1_nom?.trim() ||
    !membre2_nom?.trim() ||
    !annonce_titre?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          'Champs requis : membre1_email, membre1_nom, membre2_nom, annonce_titre',
      },
      { status: 400 },
    );
  }

  const innerBodyHtml = `<p style="margin:0;font-size:18px;">🎉 Vous avez un match avec <strong>${escapeHtml(membre2_nom.trim())}</strong> !</p>
<p style="margin:16px 0 0;color:#555;">Annonce : <strong>${escapeHtml(annonce_titre.trim())}</strong></p>`;

  const subject = `🎉 Match avec ${membre2_nom.trim()} !`;

  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'BREVO_API_KEY manquant' }, { status: 500 });
    }

    const client = new BrevoClient({ apiKey });
    await client.transactionalEmails.sendTransacEmail({
      sender: SENDER,
      to: [
        {
          email: membre1_email.trim(),
          name: membre1_nom.trim(),
        },
      ],
      subject,
      htmlContent: buildTransactionalHtml(innerBodyHtml),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur envoi email';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

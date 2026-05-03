import { NextRequest, NextResponse } from 'next/server';
import { BrevoClient } from '@getbrevo/brevo';
import { buildTransactionalHtml, escapeHtml } from '@/lib/email/brevo';

const SENDER = { email: 'noreply@troc-service.eu', name: 'Troc-Service' };

type MessageBody = {
  destinataire_email?: string;
  destinataire_nom?: string;
  expediteur_nom?: string;
  annonce_titre?: string;
  contenu?: string;
};

export async function POST(req: NextRequest) {
  let body: MessageBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const {
    destinataire_email,
    destinataire_nom,
    expediteur_nom,
    annonce_titre,
    contenu,
  } = body;

  if (
    !destinataire_email?.trim() ||
    !destinataire_nom?.trim() ||
    !expediteur_nom?.trim() ||
    !annonce_titre?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          'Champs requis : destinataire_email, destinataire_nom, expediteur_nom, annonce_titre',
      },
      { status: 400 },
    );
  }

  const intro = `Vous avez un nouveau message de <strong>${escapeHtml(expediteur_nom.trim())}</strong> concernant votre annonce <strong>${escapeHtml(annonce_titre.trim())}</strong>.`;
  const messagePreview =
    contenu != null && String(contenu).trim().length > 0
      ? `<p style="margin:16px 0 0;padding:12px 14px;background:#E1F5EE;border-radius:8px;border-left:4px solid #1D9E75;color:#1a1a1a;">${escapeHtml(String(contenu).trim())}</p>`
      : '';

  const innerBodyHtml = `<p style="margin:0;">${intro}</p>${messagePreview}`;

  const subject = `Nouveau message de ${expediteur_nom.trim()} — ${annonce_titre.trim()}`;

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
          email: destinataire_email.trim(),
          name: destinataire_nom.trim(),
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

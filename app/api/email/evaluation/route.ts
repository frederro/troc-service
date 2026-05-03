import { NextRequest, NextResponse } from 'next/server';
import { BrevoClient } from '@getbrevo/brevo';
import { buildTransactionalHtml, escapeHtml } from '@/lib/email/brevo';

const SENDER = { email: 'noreply@troc-service.eu', name: 'Troc-Service' };

type EvaluationBody = {
  destinataire_email?: string;
  destinataire_nom?: string;
  evaluateur_nom?: string;
  note?: number | string;
  commentaire?: string | null;
};

export async function POST(req: NextRequest) {
  let body: EvaluationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const {
    destinataire_email,
    destinataire_nom,
    evaluateur_nom,
    note,
    commentaire,
  } = body;

  if (
    !destinataire_email?.trim() ||
    !destinataire_nom?.trim() ||
    !evaluateur_nom?.trim() ||
    note === undefined ||
    note === null ||
    String(note).trim() === ''
  ) {
    return NextResponse.json(
      {
        error:
          'Champs requis : destinataire_email, destinataire_nom, evaluateur_nom, note',
      },
      { status: 400 },
    );
  }

  const noteStr = String(note).trim();
  const intro = `⭐ <strong>${escapeHtml(evaluateur_nom.trim())}</strong> vous a laissé une évaluation <strong>${escapeHtml(noteStr)}/5</strong>.`;
  const commentBlock =
    commentaire != null && String(commentaire).trim().length > 0
      ? `<p style="margin:16px 0 0;padding:12px 14px;background:#E1F5EE;border-radius:8px;border-left:4px solid #1D9E75;">${escapeHtml(String(commentaire).trim())}</p>`
      : '';

  const innerBodyHtml = `<p style="margin:0;">${intro}</p>${commentBlock}`;

  const subject = `⭐ ${evaluateur_nom.trim()} — évaluation ${noteStr}/5`;

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

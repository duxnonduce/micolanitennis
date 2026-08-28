import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'iscrizioni@micolanitennis.com';

type SendResult = { ok: boolean; error?: string };

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { ok: true };
  } catch (err: any) {
    console.error('Errore invio email:', err);
    return { ok: false, error: err?.message ?? 'unknown error' };
  }
}

function wrapper(title: string, bodyHtml: string) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color:#1a1a1a;">
    <div style="background:#0B3D91; padding:24px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:20px;">Micolani Tennis</h1>
    </div>
    <div style="padding:24px; background:#fff;">
      <h2 style="color:#0B3D91; font-size:18px;">${title}</h2>
      ${bodyHtml}
    </div>
    <div style="padding:16px; text-align:center; color:#888; font-size:12px;">
      Micolani Tennis — Via Vecchia San Donato ang. Via Pepini, Cavallino (LE)
    </div>
  </div>`;
}

export async function sendRequestReceivedEmail(params: {
  to: string;
  athleteName: string;
  courseName: string;
  entryDate: string;
  totalAmount: string;
  installments: { index: number; amount: string; dueDate: string | null }[];
  registrationFee: string;
  areaRiservataUrl: string;
}) {
  const rows = params.installments
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;">Rata ${i.index}</td><td style="padding:4px 8px;">${i.amount}</td><td style="padding:4px 8px;">${i.dueDate ?? '—'}</td></tr>`
    )
    .join('');

  const html = wrapper(
    'Richiesta ricevuta',
    `
    <p>Ciao ${params.athleteName},</p>
    <p>Abbiamo ricevuto la tua richiesta di iscrizione al corso <strong>${params.courseName}</strong>,
    con ingresso previsto il <strong>${params.entryDate}</strong>.</p>
    <p><strong>Quota d'iscrizione:</strong> ${params.registrationFee}</p>
    <table style="width:100%; border-collapse:collapse; margin:12px 0;">
      <thead><tr><th style="text-align:left; padding:4px 8px;">Rata</th><th style="text-align:left; padding:4px 8px;">Importo</th><th style="text-align:left; padding:4px 8px;">Scadenza</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p><strong>Totale complessivo:</strong> ${params.totalAmount}</p>
    <p>La tua richiesta è ora <strong>in gestione</strong> da parte della segreteria.</p>
    <p style="margin-top:24px;">
      <a href="${params.areaRiservataUrl}" style="background:#FFB703; color:#082C6B; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
        Accedi all'Area riservata
      </a>
    </p>
    `
  );

  return send(params.to, 'Micolani Tennis — Richiesta ricevuta', html);
}

export async function sendRequestApprovedEmail(params: {
  to: string;
  athleteName: string;
  startDate: string;
  assignmentsText: string; // es. "Lunedì 19:00 – Campo 2, Gruppo Adulti Cat.2"
  areaRiservataUrl: string;
}) {
  const html = wrapper(
    'Iscrizione confermata',
    `
    <p>Ciao ${params.athleteName},</p>
    <p>Ti confermiamo i seguenti giorni e orari definitivi per la tua nuova stagione tennistica,
    a partire dal <strong>${params.startDate}</strong>:</p>
    <p style="background:#f2f5fb; padding:12px; border-radius:8px;">${params.assignmentsText}</p>
    <p>Le istruzioni di pagamento sono disponibili nella tua Area riservata.</p>
    <p style="margin-top:24px;">
      <a href="${params.areaRiservataUrl}" style="background:#FFB703; color:#082C6B; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
        Vai all'Area riservata
      </a>
    </p>
    `
  );
  return send(params.to, 'Micolani Tennis — Iscrizione confermata', html);
}

export async function sendRequestRejectedEmail(params: {
  to: string;
  athleteName: string;
  reason?: string;
}) {
  const html = wrapper(
    'Aggiornamento sulla tua richiesta',
    `
    <p>Ciao ${params.athleteName},</p>
    <p>Ti scriviamo in merito alla tua richiesta di iscrizione, che al momento non può essere confermata.</p>
    ${params.reason ? `<p><strong>Motivo:</strong> ${params.reason}</p>` : ''}
    <p>Per qualsiasi chiarimento contatta la segreteria: +39 351 816 7085.</p>
    `
  );
  return send(params.to, 'Micolani Tennis — Aggiornamento richiesta', html);
}

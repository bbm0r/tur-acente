import "server-only";

export type Mail = { to: string; subject: string; html: string };
export type SendResult = { ok: boolean; id?: string; error?: string };

/**
 * Sends via Resend when RESEND_API_KEY is set; otherwise logs to the console
 * (dev transport) so the booking flow completes without a provider configured.
 */
export async function sendEmail(mail: Mail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Tur Acente <onboarding@resend.dev>";

  if (!key) {
    console.log(`\n📧 [DEV EMAIL] → ${mail.to}\n   konu: ${mail.subject}\n   (gerçek gönderim için RESEND_API_KEY ayarlayın)\n`);
    return { ok: true, id: "dev-console" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const res = await resend.emails.send({ from, to: mail.to, subject: mail.subject, html: mail.html });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "send failed" };
  }
}

/** Minimal branded HTML wrapper for transactional emails. */
export function emailLayout(heading: string, body: string) {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <div style="background:#0f766e;color:#fff;padding:20px 24px;border-radius:14px 14px 0 0">
      <div style="font-size:18px;font-weight:800">Tur Acente</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 14px 14px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${heading}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
      <p style="font-size:12px;color:#64748b;margin:0">Bu e-posta Tur Acente rezervasyon sistemi tarafından gönderilmiştir.</p>
      <p style="font-size:11px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px;margin:10px 0 0">⚠️ DEMO / ÖRNEK: Bu mesaj geliştirme/demo amaçlı bir sistemden gönderilmiştir; gerçek bir rezervasyon, ödeme veya satış teşkil etmez. Bağlayıcı değildir.</p>
    </div>
  </div>`;
}

import { Resend } from "resend";

// Lazily-initialized Resend client. Constructed on first send so the
// app can boot without RESEND_API_KEY (e.g., in local dev) — the
// send call falls back to console-logging the URL instead.
let _client: Resend | null = null;
function client(): Resend | null {
  if (_client) return _client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _client = new Resend(key);
  return _client;
}

// Resolve the canonical app URL at module load. In production we
// refuse to boot if NEXT_PUBLIC_APP_URL is missing, so a Vercel
// deploy without the env var fails loudly here instead of silently
// shipping verification emails that point at http://localhost:3000.
// Local dev keeps the localhost fallback.
const APP_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[email] NEXT_PUBLIC_APP_URL is required in production — verification email links would otherwise point at http://localhost:3000.",
    );
  }
  return "http://localhost:3000";
})();

function appUrl(): string {
  return APP_URL;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@dopiqapp.com";
}

const BRAND = {
  green: "#00C853",
  greenDark: "#00B248",
  navy: "#0A0F1E",
  ink: "#0A0F1E",
  inkMuted: "#6B7280",
  bg: "#FAFAF8",
};

function verificationEmailHtml(verifyUrl: string): string {
  // Inline styles only — most email clients strip <style>, and Gmail
  // mangles class-based selectors. Table layout for Outlook compat.
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-size:28px;font-weight:800;color:${BRAND.green};letter-spacing:-0.02em;">dopiq</span>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;font-weight:700;color:${BRAND.navy};">Verify your email address</h1>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${BRAND.ink};">Thanks for signing up for Dopiq. Click the button below to verify your email and get started.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;">
                  <tr>
                    <td align="center" bgcolor="${BRAND.green}" style="border-radius:9999px;">
                      <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9999px;background-color:${BRAND.green};">Verify my email</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:${BRAND.inkMuted};">Or paste this link into your browser:</p>
                <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${verifyUrl}" style="color:${BRAND.green};text-decoration:underline;">${verifyUrl}</a></p>
                <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
                <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.inkMuted};">This link expires in 24 hours. If you did not create a Dopiq account you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const html = verificationEmailHtml(verifyUrl);
  const c = client();
  if (!c) {
    console.warn(
      `[email] RESEND_API_KEY not set — would have sent verification to ${to}. Verify URL:\n${verifyUrl}`,
    );
    return { ok: true as const, dev: true as const };
  }
  try {
    const result = await c.emails.send({
      from: fromAddress(),
      to,
      subject: "Verify your Dopiq email",
      html,
    });
    if (result.error) {
      console.error("[email] resend error:", result.error);
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const, dev: false as const };
  } catch (err) {
    console.error("[email] send failed:", err);
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}

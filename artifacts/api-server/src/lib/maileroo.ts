const MAILEROO_API_KEY = process.env["MAILEROO_API_KEY"];
const MAILEROO_FROM = process.env["MAILEROO_FROM_EMAIL"] ?? "noreply@338b5fe5d007f093.maileroo.org";

const SUBJECTS: Record<string, string> = {
  "forgot-password":       "Your password reset code",
  "forgot-number":         "Your phone number reset code",
  "update-email":          "Verify your email address",
  "reset-password":        "Your password reset code",
  "verify-current-email":  "Verify your email address",
};

function buildHtml(code: string, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h2 style="margin:0 0 8px;color:#1a1a1a">${subject}</h2>
    <p style="color:#555;margin:0 0 24px">Use the code below to complete your request. It expires in 10 minutes.</p>
    <div style="text-align:center;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:12px;padding:24px 0;margin-bottom:24px">
      <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#fff">${code}</span>
    </div>
    <p style="color:#999;font-size:12px;margin:0">If you did not request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`;
}

export async function sendOtpEmail(
  to: string,
  purpose: string,
  code: string,
): Promise<void> {
  if (!MAILEROO_API_KEY) {
    throw new Error("MAILEROO_API_KEY is not set");
  }

  const subject = SUBJECTS[purpose] ?? "Your verification code";

  const payload = {
    from: MAILEROO_FROM,
    to,
    subject,
    html: buildHtml(code, subject),
    plain_text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  };

  const res = await fetch("https://smtp.maileroo.com/send", {
    method: "POST",
    headers: {
      "X-API-Key": MAILEROO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Maileroo error ${res.status}: ${body}`);
  }
}

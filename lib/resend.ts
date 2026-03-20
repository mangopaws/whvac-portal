import { Resend } from "resend";

// Lazy initialization — avoids build-time throw when env vars aren't set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@abreeze.studio";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";

async function sendEmail(params: Parameters<ReturnType<typeof getResend>['emails']['send']>[0]) {
  const { data, error } = await getResend().emails.send(params);
  if (error) {
    console.error("[resend] send failed:", JSON.stringify(error));
    throw new Error(`Resend error: ${error.message}`);
  }
  return data;
}

const TIER_MAP: Record<string, string> = {
  individual: "Individual",
  student: "Student",
  corporate: "Corporate",
};

export async function sendWelcomeEmail(
  to: string,
  name: string,
  magicLink: string,
  tier: string
) {
  const tierLabel = TIER_MAP[tier] ?? tier;
  return sendEmail({
    from: FROM,
    to,
    subject: "Welcome to WHVAC — Your membership is active!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#E8006A;padding:24px 32px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;">Welcome to WHVAC</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Women in HVAC & Refrigeration</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:18px;">Hi ${name},</p>
          <p>Your <strong>${tierLabel}</strong> membership is now active. We're thrilled to have you in our community!</p>
          <p>Click below to access your member portal:</p>
          <a href="${magicLink}" style="display:inline-block;background:#E8006A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Access Your Dashboard →
          </a>
          <p style="color:#aaa;font-size:14px;">This link expires in 24 hours. If you have questions, reply to this email.</p>
          <hr style="border:1px solid #333;margin:24px 0;" />
          <p style="color:#aaa;font-size:13px;">Women in HVAC &amp; Refrigeration (WHVAC)<br/>womeninhvac.ca</p>
        </div>
      </div>
    `,
  });
}

export async function sendEMTInstructionsEmail(
  to: string,
  name: string,
  tier: string,
  price: number,
  magicLink: string
) {
  const tierLabel = TIER_MAP[tier] ?? tier;
  return sendEmail({
    from: FROM,
    to,
    subject: "WHVAC Membership — e-Transfer Payment Instructions",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#E8006A;padding:24px 32px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;">Payment Instructions</h1>
          <p style="margin:8px 0 0;opacity:0.9;">WHVAC ${tierLabel}</p>
        </div>
        <div style="padding:32px;">
          <p>Hi ${name},</p>
          <p>Thank you for joining WHVAC as a <strong>${tierLabel}</strong>! To complete your membership, please send an e-Transfer:</p>
          <div style="background:#252540;border-radius:8px;padding:20px;margin:16px 0;">
            <p style="margin:0 0 8px;"><strong>Send to:</strong> treasurer@womeninhvac.ca</p>
            <p style="margin:0 0 8px;"><strong>Amount:</strong> $${price} CAD</p>
            <p style="margin:0;"><strong>Message:</strong> WHVAC ${tierLabel} — ${name}</p>
          </div>
          <p>Your account will be activated within 1–2 business days after we receive your transfer.</p>
          <p>Once activated, use this link to access your dashboard:</p>
          <a href="${magicLink}" style="display:inline-block;background:#E8006A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
            Access Your Dashboard →
          </a>
          <p style="color:#aaa;font-size:14px;">Questions? Reply to this email and we'll get back to you quickly.</p>
        </div>
      </div>
    `,
  });
}

export async function sendCashInstructionsEmail(
  to: string,
  name: string,
  tier: string,
  price: number
) {
  const tierLabel = TIER_MAP[tier] ?? tier;
  return sendEmail({
    from: FROM,
    to,
    subject: "WHVAC Membership — Cash Payment Instructions",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1A1A2E;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#E8006A;padding:24px 32px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;">Cash Payment Instructions</h1>
          <p style="margin:8px 0 0;opacity:0.9;">WHVAC ${tierLabel}</p>
        </div>
        <div style="padding:32px;">
          <p>Hi ${name},</p>
          <p>Thank you for joining WHVAC! Your <strong>${tierLabel}</strong> membership ($${price} CAD) will be activated once cash payment is received at your next event or via a designated WHVAC coordinator.</p>
          <p>Our team will be in touch with the next steps. If you have questions, reply to this email.</p>
          <hr style="border:1px solid #333;margin:24px 0;" />
          <p style="color:#aaa;font-size:13px;">Women in HVAC &amp; Refrigeration (WHVAC)</p>
        </div>
      </div>
    `,
  });
}

export async function sendMagicLinkEmail(to: string, magicLink: string) {
  return sendEmail({
    from: FROM,
    to,
    subject: "Your WHVAC login link",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <p>Click below to log into your WHVAC member portal:</p>
        <a href="${magicLink}" style="display:inline-block;background:#E8006A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
          Log in to WHVAC →
        </a>
        <p style="color:#aaa;font-size:14px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function addToAudience(email: string, name: string) {
  if (!AUDIENCE_ID) return;
  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "";
  return getResend().contacts.create({
    audienceId: AUDIENCE_ID,
    email,
    firstName,
    lastName,
    unsubscribed: false,
  });
}

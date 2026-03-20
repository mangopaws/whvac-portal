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
const APP_URL = process.env.BETTER_AUTH_URL ?? "https://portal.womeninhvaccanada.ca";

async function sendEmail(params: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0]) {
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

const TIER_PRICES: Record<string, number> = {
  individual: 79,
  student: 55,
  corporate: 99,
};

// ── Shared coming-soon banner (dark theme) ───────────────────────────────────
// Returns a <tr> block to drop into any table-based email above the portal CTA.
function comingSoonBanner(): string {
  return `
            <tr>
              <td style="background-color:#0a1628;padding:28px 48px 0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:rgba(143,164,200,0.07);border:1px solid #1e3460;border-radius:10px;">
                  <tr>
                    <td style="padding:14px 20px;">
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:13px;color:#8fa4c8;line-height:1.5;">
                        <strong style="color:#a8bcd4;">Member Portal — Coming Soon.&nbsp;</strong>The member portal is launching soon — stay tuned for access to your full member dashboard.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
}

// ── Shared footer block ───────────────────────────────────────────────────────
function emailFooter(): string {
  return `
            <!-- QUOTE -->
            <tr>
              <td style="background-color:#0a1628;padding:48px 48px 0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="border-left:3px solid #ff1f6e;">
                  <tr>
                    <td style="padding:4px 0 4px 24px;">
                      <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:20px;font-style:italic;color:#ffffff;line-height:1.5;">"Building a stronger trades industry — one woman at a time."</p>
                      <p style="margin:8px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#8fa4c8;">Women in HVAC Canada</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- FOOTER -->
            <tr>
              <td style="background-color:#0a1628;padding:48px 48px 16px 48px;">
                <div style="height:1px;background:#1e3460;margin-bottom:32px;"></div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 6px 0;font-family:'DM Serif Display',Georgia,serif;font-size:14px;color:#ffffff;font-weight:400;letter-spacing:0.05em;">Women in HVAC Canada</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8fa4c8;line-height:1.6;">
                        Questions? Reply to this email or contact us at<br />
                        <a href="mailto:info@womeninhvaccanada.ca" style="color:#ff1f6e;text-decoration:none;">info@womeninhvaccanada.ca</a>
                      </p>
                    </td>
                    <td align="right" style="vertical-align:bottom;">
                      <a href="https://womeninhvaccanada.ca" style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8fa4c8;text-decoration:none;">womeninhvaccanada.ca</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:32px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#3d5275;line-height:1.6;text-align:center;">
                  You're receiving this because you completed a membership application with Women in HVAC Canada.<br />
                  <a href="https://womeninhvaccanada.ca" style="color:#3d5275;text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
            <!-- BOTTOM ACCENT -->
            <tr>
              <td style="padding:24px 48px 40px 48px;background-color:#0a1628;">
                <div style="height:2px;background:linear-gradient(90deg,#ff1f6e 0%,rgba(255,31,110,0) 100%);"></div>
              </td>
            </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// sendWelcomeEmail — sent when a member is fully activated / payment confirmed
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(
  to: string,
  name: string,
  magicLink: string,
  tier: string,
  opts?: {
    province?: string;
    paymentDate?: string;
    paymentIntentId?: string;
    amount?: number;
  }
) {
  const tierLabel = TIER_MAP[tier] ?? tier;
  const firstName = name.trim().split(/\s+/)[0];
  const paymentDate =
    opts?.paymentDate ??
    new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  const province = opts?.province ?? "—";
  const amount = opts?.amount ?? TIER_PRICES[tier] ?? 79;
  const receiptId = opts?.paymentIntentId ?? "—";

  return sendEmail({
    from: FROM,
    to,
    subject: "Welcome to WHVAC — Your membership is active!",
    html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>You're in — Women in HVAC Canada</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#0a1628;font-family:'DM Sans',Arial,sans-serif;">
    <div style="display:none;font-size:1px;color:#0a1628;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Your membership is active. Welcome to Women in HVAC Canada.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a1628;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
            <!-- TOP ACCENT BAR -->
            <tr>
              <td style="background:linear-gradient(90deg,#ff1f6e 0%,#ff6fa8 100%);height:4px;line-height:4px;font-size:4px;">&nbsp;</td>
            </tr>
            <!-- HEADER -->
            <tr>
              <td style="background-color:#0d1f3c;padding:36px 48px 32px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <img src="${APP_URL}/whvac-logo@2x.png" alt="WHVAC" width="110" height="54" style="display:block;border:0;" />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8fa4c8;">Member Confirmation</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- HERO -->
            <tr>
              <td style="background-color:#0d1f3c;padding:0 48px 48px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding-bottom:36px;">
                      <div style="width:48px;height:2px;background:#ff1f6e;"></div>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                  <tr>
                    <td style="background:rgba(255,31,110,0.12);border:1px solid rgba(255,31,110,0.3);border-radius:100px;padding:6px 16px;">
                      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#ff1f6e;font-weight:600;">● Membership Active</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:0 0 8px 0;font-family:'DM Serif Display',Georgia,serif;font-size:46px;line-height:1.08;color:#ffffff;font-weight:400;letter-spacing:-0.01em;">
                  You're in,<br />
                  <em style="color:#ff1f6e;font-style:italic;">${firstName}.</em>
                </h1>
                <p style="margin:24px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:17px;line-height:1.7;color:#a8bcd4;max-width:440px;">
                  Your payment has been confirmed and your membership is now active. Welcome to the Women in HVAC Canada community.
                </p>
              </td>
            </tr>
            <!-- MEMBERSHIP CARD -->
            <tr>
              <td style="background-color:#0a1628;padding:0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:linear-gradient(135deg,#0d1f3c 0%,#112244 100%);border:1px solid #1e3460;border-radius:12px;margin-top:-24px;">
                  <tr>
                    <td style="padding:32px 36px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
                        <tr>
                          <td>
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Member Since</p>
                            <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:20px;color:#ffffff;">${paymentDate}</p>
                          </td>
                          <td align="right" style="vertical-align:top;">
                            <div style="background:rgba(255,31,110,0.1);border:1px solid rgba(255,31,110,0.25);border-radius:8px;padding:8px 14px;display:inline-block;">
                              <span style="font-family:'DM Sans',Arial,sans-serif;font-size:12px;font-weight:600;color:#ff6fa8;">${tierLabel}</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      <div style="height:1px;background:#1e3460;margin-bottom:24px;"></div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="width:50%;padding-right:12px;vertical-align:top;padding-bottom:20px;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Name</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${name}</p>
                          </td>
                          <td style="width:50%;padding-left:12px;vertical-align:top;padding-bottom:20px;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Province</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${province}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width:50%;padding-right:12px;vertical-align:top;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Payment</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">CAD $${amount.toFixed(2)}</p>
                          </td>
                          <td style="width:50%;padding-left:12px;vertical-align:top;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Receipt</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${receiptId}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${comingSoonBanner()}
            <!-- PORTAL CTA -->
            <tr>
              <td style="background-color:#0a1628;padding:24px 48px 0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:linear-gradient(135deg,#ff1f6e 0%,#d4145a 100%);border-radius:12px;">
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 6px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Your Access</p>
                      <h2 style="margin:0 0 12px 0;font-family:'DM Serif Display',Georgia,serif;font-size:26px;color:#ffffff;font-weight:400;line-height:1.2;">Access your member portal and get started.</h2>
                      <p style="margin:0 0 8px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.5;">
                        Login email: <strong style="color:#ffffff;">${to}</strong>
                      </p>
                      <p style="margin:0 0 28px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.5;">
                        Click the button below to log in to your dashboard. This link expires in 24 hours.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="background-color:#ffffff;border-radius:8px;">
                            <a href="${magicLink}" target="_blank"
                              style="display:inline-block;padding:14px 32px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#d4145a;text-decoration:none;letter-spacing:0.01em;">
                              Access Your Dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- WHAT'S INCLUDED -->
            <tr>
              <td style="background-color:#0a1628;padding:40px 48px 0 48px;">
                <p style="margin:0 0 24px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Your membership includes</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-right:16px;padding-top:1px;">
                      <div style="width:20px;height:20px;background:rgba(255,31,110,0.15);border-radius:50%;text-align:center;line-height:20px;">
                        <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#ff1f6e;font-weight:600;">✓</span>
                      </div>
                    </td>
                    <td><p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">Member directory &amp; networking</p></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-right:16px;padding-top:1px;">
                      <div style="width:20px;height:20px;background:rgba(255,31,110,0.15);border-radius:50%;text-align:center;line-height:20px;">
                        <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#ff1f6e;font-weight:600;">✓</span>
                      </div>
                    </td>
                    <td><p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">Access to industry resources &amp; training</p></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-right:16px;padding-top:1px;">
                      <div style="width:20px;height:20px;background:rgba(255,31,110,0.15);border-radius:50%;text-align:center;line-height:20px;">
                        <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#ff1f6e;font-weight:600;">✓</span>
                      </div>
                    </td>
                    <td><p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">Events, workshops &amp; mentorship programs</p></td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-right:16px;padding-top:1px;">
                      <div style="width:20px;height:20px;background:rgba(255,31,110,0.15);border-radius:50%;text-align:center;line-height:20px;">
                        <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;color:#ff1f6e;font-weight:600;">✓</span>
                      </div>
                    </td>
                    <td><p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">WHVAC newsletter &amp; industry updates</p></td>
                  </tr>
                </table>
              </td>
            </tr>
            ${emailFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// sendEMTInstructionsEmail — sent to pending e-Transfer members at signup
// ─────────────────────────────────────────────────────────────────────────────
export async function sendEMTInstructionsEmail(
  to: string,
  name: string,
  tier: string,
  price: number,
  magicLink: string
) {
  const tierLabel = TIER_MAP[tier] ?? tier;
  const firstName = name.trim().split(/\s+/)[0];
  const submittedDate = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return sendEmail({
    from: FROM,
    to,
    subject: "WHVAC Membership — e-Transfer Payment Instructions",
    html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>WHVAC — e-Transfer Instructions</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#0a1628;font-family:'DM Sans',Arial,sans-serif;">
    <div style="display:none;font-size:1px;color:#0a1628;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Your membership application has been received. Complete your e-Transfer to activate your account.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a1628;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
            <!-- TOP ACCENT BAR -->
            <tr>
              <td style="background:linear-gradient(90deg,#ff1f6e 0%,#ff6fa8 100%);height:4px;line-height:4px;font-size:4px;">&nbsp;</td>
            </tr>
            <!-- HEADER -->
            <tr>
              <td style="background-color:#0d1f3c;padding:36px 48px 32px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <img src="${APP_URL}/whvac-logo@2x.png" alt="WHVAC" width="110" height="54" style="display:block;border:0;" />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8fa4c8;">Member Application</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- HERO -->
            <tr>
              <td style="background-color:#0d1f3c;padding:0 48px 48px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding-bottom:36px;">
                      <div style="width:48px;height:2px;background:#ff1f6e;display:inline-block;"></div>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:0 0 8px 0;font-family:'DM Serif Display',Georgia,serif;font-size:46px;line-height:1.08;color:#ffffff;font-weight:400;letter-spacing:-0.01em;">
                  Almost there,<br />
                  <em style="color:#ff1f6e;font-style:italic;">${firstName}.</em>
                </h1>
                <p style="margin:24px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:17px;line-height:1.7;color:#a8bcd4;max-width:440px;">
                  Your membership application has been received. Complete your e-Transfer payment and we'll activate your account within 1–2 business days.
                </p>
              </td>
            </tr>
            <!-- STATUS CARD -->
            <tr>
              <td style="background-color:#0a1628;padding:0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:linear-gradient(135deg,#0d1f3c 0%,#112244 100%);border:1px solid #1e3460;border-radius:12px;margin-top:-24px;">
                  <tr>
                    <td style="padding:32px 36px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="vertical-align:top;padding-right:20px;width:24px;">
                            <div style="width:10px;height:10px;background:#ff1f6e;border-radius:50%;margin-top:6px;"></div>
                          </td>
                          <td>
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Application Status</p>
                            <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#ffffff;font-weight:400;">Payment Pending</p>
                          </td>
                        </tr>
                      </table>
                      <div style="height:1px;background:#1e3460;margin:24px 0;"></div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="width:50%;padding-right:12px;vertical-align:top;padding-bottom:20px;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Name</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${name}</p>
                          </td>
                          <td style="width:50%;padding-left:12px;vertical-align:top;padding-bottom:20px;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Membership Type</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${tierLabel}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width:50%;padding-right:12px;vertical-align:top;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Amount Due</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">CAD $${price.toFixed(2)}</p>
                          </td>
                          <td style="width:50%;padding-left:12px;vertical-align:top;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Submitted</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${submittedDate}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${comingSoonBanner()}
            <!-- E-TRANSFER INSTRUCTIONS CTA -->
            <tr>
              <td style="background-color:#0a1628;padding:24px 48px 0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:linear-gradient(135deg,#ff1f6e 0%,#d4145a 100%);border-radius:12px;">
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 6px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Next Step</p>
                      <h2 style="margin:0 0 20px 0;font-family:'DM Serif Display',Georgia,serif;font-size:26px;color:#ffffff;font-weight:400;line-height:1.2;">Send your e-Transfer to complete your membership.</h2>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                        style="background:rgba(0,0,0,0.2);border-radius:8px;margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px 24px;">
                            <p style="margin:0 0 10px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.9);line-height:1.5;">
                              <strong style="color:#ffffff;display:inline-block;width:90px;">Send to:</strong> treasurer@womeninhvac.ca
                            </p>
                            <p style="margin:0 0 10px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.9);line-height:1.5;">
                              <strong style="color:#ffffff;display:inline-block;width:90px;">Amount:</strong> CAD $${price.toFixed(2)}
                            </p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.9);line-height:1.5;">
                              <strong style="color:#ffffff;display:inline-block;width:90px;">Message:</strong> WHVAC ${tierLabel} — ${name}
                            </p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 0 20px 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.5;">
                        Your account will be activated within 1–2 business days after we receive your transfer. You can use the button below to access your dashboard once activated.
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="background-color:#ffffff;border-radius:8px;">
                            <a href="${magicLink}" target="_blank"
                              style="display:inline-block;padding:14px 32px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#d4145a;text-decoration:none;letter-spacing:0.01em;">
                              Access Your Dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- WHAT HAPPENS NEXT -->
            <tr>
              <td style="background-color:#0a1628;padding:40px 48px 0 48px;">
                <p style="margin:0 0 24px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">What happens next</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-right:16px;padding-top:2px;">
                      <div style="width:28px;height:28px;background:#0d1f3c;border:1px solid #1e3460;border-radius:50%;text-align:center;line-height:28px;">
                        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13px;color:#ff1f6e;">1</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">Send your e-Transfer</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#8fa4c8;line-height:1.5;">Follow the instructions above to send your payment to our treasurer.</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-right:16px;padding-top:2px;">
                      <div style="width:28px;height:28px;background:#0d1f3c;border:1px solid #1e3460;border-radius:50%;text-align:center;line-height:28px;">
                        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13px;color:#ff1f6e;">2</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">We confirm your payment</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#8fa4c8;line-height:1.5;">Our team will verify and activate your membership within 1–2 business days.</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-right:16px;padding-top:2px;">
                      <div style="width:28px;height:28px;background:#0d1f3c;border:1px solid #1e3460;border-radius:50%;text-align:center;line-height:28px;">
                        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13px;color:#ff1f6e;">3</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">Welcome email + portal access</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#8fa4c8;line-height:1.5;">You'll receive a welcome email with your portal login link once your membership is activated.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${emailFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// sendCashInstructionsEmail — sent to pending cash members at signup
// ─────────────────────────────────────────────────────────────────────────────
export async function sendCashInstructionsEmail(
  to: string,
  name: string,
  tier: string,
  price: number
) {
  const tierLabel = TIER_MAP[tier] ?? tier;
  const firstName = name.trim().split(/\s+/)[0];
  const submittedDate = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return sendEmail({
    from: FROM,
    to,
    subject: "WHVAC Membership — Cash Payment Instructions",
    html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>WHVAC — Cash Payment Instructions</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background-color:#0a1628;font-family:'DM Sans',Arial,sans-serif;">
    <div style="display:none;font-size:1px;color:#0a1628;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Your membership application has been received. Our team will be in touch to arrange your cash payment.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a1628;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
            <!-- TOP ACCENT BAR -->
            <tr>
              <td style="background:linear-gradient(90deg,#ff1f6e 0%,#ff6fa8 100%);height:4px;line-height:4px;font-size:4px;">&nbsp;</td>
            </tr>
            <!-- HEADER -->
            <tr>
              <td style="background-color:#0d1f3c;padding:36px 48px 32px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <img src="${APP_URL}/whvac-logo@2x.png" alt="WHVAC" width="110" height="54" style="display:block;border:0;" />
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8fa4c8;">Member Application</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- HERO -->
            <tr>
              <td style="background-color:#0d1f3c;padding:0 48px 48px 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding-bottom:36px;">
                      <div style="width:48px;height:2px;background:#ff1f6e;display:inline-block;"></div>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:0 0 8px 0;font-family:'DM Serif Display',Georgia,serif;font-size:46px;line-height:1.08;color:#ffffff;font-weight:400;letter-spacing:-0.01em;">
                  Almost there,<br />
                  <em style="color:#ff1f6e;font-style:italic;">${firstName}.</em>
                </h1>
                <p style="margin:24px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:17px;line-height:1.7;color:#a8bcd4;max-width:440px;">
                  Your membership application has been received. Our team will reach out to arrange your cash payment and get your membership activated.
                </p>
              </td>
            </tr>
            <!-- STATUS CARD -->
            <tr>
              <td style="background-color:#0a1628;padding:0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:linear-gradient(135deg,#0d1f3c 0%,#112244 100%);border:1px solid #1e3460;border-radius:12px;margin-top:-24px;">
                  <tr>
                    <td style="padding:32px 36px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="vertical-align:top;padding-right:20px;width:24px;">
                            <div style="width:10px;height:10px;background:#ff1f6e;border-radius:50%;margin-top:6px;"></div>
                          </td>
                          <td>
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Application Status</p>
                            <p style="margin:0;font-family:'DM Serif Display',Georgia,serif;font-size:22px;color:#ffffff;font-weight:400;">Payment Pending</p>
                          </td>
                        </tr>
                      </table>
                      <div style="height:1px;background:#1e3460;margin:24px 0;"></div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="width:50%;padding-right:12px;vertical-align:top;padding-bottom:20px;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Name</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${name}</p>
                          </td>
                          <td style="width:50%;padding-left:12px;vertical-align:top;padding-bottom:20px;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Membership Type</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${tierLabel}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="width:50%;padding-right:12px;vertical-align:top;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Amount</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">CAD $${price.toFixed(2)}</p>
                          </td>
                          <td style="width:50%;padding-left:12px;vertical-align:top;">
                            <p style="margin:0 0 4px 0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">Submitted</p>
                            <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:#ffffff;font-weight:500;">${submittedDate}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${comingSoonBanner()}
            <!-- CASH PAYMENT INSTRUCTIONS -->
            <tr>
              <td style="background-color:#0a1628;padding:24px 48px 0 48px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:linear-gradient(135deg,#ff1f6e 0%,#d4145a 100%);border-radius:12px;">
                  <tr>
                    <td style="padding:32px 36px;">
                      <p style="margin:0 0 6px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Next Step</p>
                      <h2 style="margin:0 0 12px 0;font-family:'DM Serif Display',Georgia,serif;font-size:26px;color:#ffffff;font-weight:400;line-height:1.2;">Arrange your cash payment with a coordinator.</h2>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;">
                        A WHVAC coordinator will reach out to arrange your cash payment of <strong style="color:#ffffff;">CAD $${price.toFixed(2)}</strong>. This typically happens at your next WHVAC event or by arrangement.
                      </p>
                      <p style="margin:16px 0 0 0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">
                        Questions? Reply to this email and we'll get back to you quickly.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- WHAT HAPPENS NEXT -->
            <tr>
              <td style="background-color:#0a1628;padding:40px 48px 0 48px;">
                <p style="margin:0 0 24px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8fa4c8;">What happens next</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-right:16px;padding-top:2px;">
                      <div style="width:28px;height:28px;background:#0d1f3c;border:1px solid #1e3460;border-radius:50%;text-align:center;line-height:28px;">
                        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13px;color:#ff1f6e;">1</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">A coordinator will be in touch</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#8fa4c8;line-height:1.5;">We'll reach out to confirm the details and arrange your payment in person.</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-right:16px;padding-top:2px;">
                      <div style="width:28px;height:28px;background:#0d1f3c;border:1px solid #1e3460;border-radius:50%;text-align:center;line-height:28px;">
                        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13px;color:#ff1f6e;">2</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">Payment confirmed</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#8fa4c8;line-height:1.5;">Once we receive your payment, your membership will be activated immediately.</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:36px;vertical-align:top;padding-right:16px;padding-top:2px;">
                      <div style="width:28px;height:28px;background:#0d1f3c;border:1px solid #1e3460;border-radius:50%;text-align:center;line-height:28px;">
                        <span style="font-family:'DM Serif Display',Georgia,serif;font-size:13px;color:#ff1f6e;">3</span>
                      </div>
                    </td>
                    <td>
                      <p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;">Welcome email + portal access</p>
                      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#8fa4c8;line-height:1.5;">You'll receive a welcome email with your portal login link once your membership is activated.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${emailFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// sendMagicLinkEmail — self-service login request
// ─────────────────────────────────────────────────────────────────────────────
export async function sendMagicLinkEmail(to: string, magicLink: string) {
  return sendEmail({
    from: FROM,
    to,
    subject: "Your WHVAC login link",
    html: `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a1628;color:#fff;border-radius:12px;overflow:hidden;padding:32px;">
        <p style="font-size:16px;color:#a8bcd4;">Click below to log into your WHVAC member portal:</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
          <tr>
            <td style="background:#ff1f6e;border-radius:8px;">
              <a href="${magicLink}" style="display:inline-block;padding:14px 28px;font-family:'DM Sans',Arial,sans-serif;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">
                Log in to WHVAC →
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#8fa4c8;font-size:14px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// addToAudience — adds contact to Resend audience (marketing list)
// ─────────────────────────────────────────────────────────────────────────────
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

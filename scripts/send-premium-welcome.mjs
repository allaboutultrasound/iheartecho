/**
 * send-premium-welcome.mjs
 * Sends premium welcome emails to the N most recently added premium_user role rows.
 * Usage: node scripts/send-premium-welcome.mjs [--limit 10] [--dry-run]
 *
 * Skips users who already have a magic link sent recently (tracked by console output).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const LIMIT = parseInt(process.argv.find((a, i) => process.argv[i - 1] === "--limit") ?? "10", 10);
const DRY_RUN = process.argv.includes("--dry-run");

const BRAND_COLOR = "#189aa1";
const BRAND_DARK = "#0e1e2e";
const APP_URL = process.env.VITE_APP_URL || "https://app.iheartecho.com";
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@iheartecho.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "iHeartEcho™";
const JWT_SECRET = process.env.JWT_SECRET;

if (!SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY not set");
if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

// ─── Email builder ────────────────────────────────────────────────────────────
function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#0e1e2e,#0e4a50);padding:24px 32px;">
        <div style="font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">iHeartEcho™</div>
        <div style="font-size:12px;color:#4ad9e0;margin-top:4px;">Echocardiography Clinical Intelligence</div>
      </td></tr>
      <tr><td style="padding:32px;">${content}</td></tr>
      <tr><td style="background:#f8fffe;border-top:1px solid #e5f7f8;padding:20px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">© All About Ultrasound · <a href="https://www.iheartecho.com" style="color:${BRAND_COLOR};text-decoration:none;">www.iheartecho.com</a></p>
        <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">You received this email because a Premium Access account was created for you on iHeartEcho™.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function buildEmail(firstName, magicUrl) {
  const subject = "Welcome to iHeartEcho™ — your Premium account is ready";
  const previewText = "Your iHeartEcho™ Premium account is set up. Click to sign in instantly — no password needed.";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND_DARK};font-family:Georgia,serif;">Welcome to iHeartEcho™, ${firstName}!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Your <strong>Premium Access</strong> account is ready. Click the button below to sign in instantly &mdash; no password needed.
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${BRAND_COLOR};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${BRAND_COLOR};">Your Premium membership includes:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
        <li>Full EchoAssist™ clinical decision support</li>
        <li>Echo severity calculators (ASE 2025 guidelines)</li>
        <li>Daily echo challenges &amp; 500+ case library</li>
        <li>Hemodynamics Lab, ScanCoach™ &amp; more</li>
        <li>Unlimited Echo Flashcards</li>
      </ul>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${magicUrl}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_COLOR},#4ad9e0);color:#ffffff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:8px;text-decoration:none;">
        Sign In to iHeartEcho™
      </a>
    </div>
    <div style="background:#fff8ed;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#92400e;"><strong>This sign-in link expires in 72 hours</strong> and can only be used once. After signing in you can set a password from your profile, or continue using magic links each time.</p>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      Questions? Contact us at <a href="mailto:support@iheartecho.com" style="color:${BRAND_COLOR};">support@iheartecho.com</a>.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#cbd5e1;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${magicUrl}" style="color:${BRAND_COLOR};word-break:break-all;font-size:11px;">${magicUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

// ─── Magic link generator ─────────────────────────────────────────────────────
async function generateMagicLink(userId) {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT({ sub: String(userId), type: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("72h")
    .setIssuedAt()
    .sign(secret);
  return `${APP_URL}/auth/magic?token=${token}`;
}

// ─── Send via SendGrid ────────────────────────────────────────────────────────
async function sendEmail(to, subject, htmlBody, previewText) {
  const body = {
    personalizations: [{ to: [{ email: to.email, name: to.name }] }],
    from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
    subject,
    content: [{ type: "text/html", value: htmlBody }],
  };
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${text}`);
  }
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get the N most recently added premium_user roles
  // Use query() with interpolated integer (safe — LIMIT is always a validated integer)
  const [rows] = await conn.query(`
    SELECT ur.userId, ur.createdAt, u.email, u.name, u.displayName
    FROM userRoles ur
    JOIN users u ON u.id = ur.userId
    WHERE ur.role = 'premium_user'
    ORDER BY ur.createdAt DESC
    LIMIT ${LIMIT}
  `);

  await conn.end();

  if (rows.length === 0) {
    console.log("No premium_user roles found.");
    return;
  }

  console.log(`Found ${rows.length} recent premium users:`);
  rows.forEach(r => console.log(`  - ${r.email} (${r.name ?? r.displayName ?? "unknown"}) — assigned ${r.createdAt}`));

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No emails sent.");
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const firstName = (row.name ?? row.displayName ?? row.email.split("@")[0]).split(" ")[0];
      const magicUrl = await generateMagicLink(row.userId);
      const { subject, htmlBody, previewText } = buildEmail(firstName, magicUrl);
      await sendEmail({ email: row.email, name: row.name ?? firstName }, subject, htmlBody, previewText);
      console.log(`  ✓ Sent to ${row.email}`);
      sent++;
    } catch (err) {
      console.error(`  ✗ Failed for ${row.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed.`);
}

main().catch(err => { console.error(err); process.exit(1); });

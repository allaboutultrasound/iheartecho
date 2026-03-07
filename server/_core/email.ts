/**
 * SendGrid transactional email helper
 * API: POST https://api.sendgrid.com/v3/mail/send
 * Auth: Authorization: Bearer <SENDGRID_API_KEY>
 */

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

interface EmailRecipient {
  name: string;
  email: string;
}

interface SendEmailOptions {
  to: EmailRecipient;
  subject: string;
  htmlBody: string;
  previewText?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@iheartecho.com";
  const senderName = process.env.SENDGRID_FROM_NAME || "iHeartEcho";

  if (!apiKey) {
    console.warn("[email] SENDGRID_API_KEY not set — skipping email send");
    return false;
  }

  try {
    const payload = {
      personalizations: [
        {
          to: [{ name: opts.to.name, email: opts.to.email }],
          subject: opts.subject,
        },
      ],
      from: { name: senderName, email: senderEmail },
      reply_to: { name: senderName, email: senderEmail },
      content: [
        {
          type: "text/html",
          value: opts.htmlBody,
        },
      ],
      tracking_settings: {
        click_tracking: { enable: false },
        open_tracking: { enable: false },
      },
    };

    const res = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[email] SendGrid API error ${res.status}: ${text}`);
      return false;
    }

    console.log(`[email] Sent "${opts.subject}" to ${opts.to.email}`);
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const brandColor = "#189aa1";
const brandDark = "#0e1e2e";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>iHeartEcho</title>
</head>
<body style="margin:0;padding:0;background:#f0fbfc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fbfc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${brandDark} 0%,#0e4a50 60%,${brandColor} 100%);padding:28px 32px;text-align:center;">
              <img src="https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/tMerpTNEMefRhZwO.png?Expires=1804389585&Signature=WUUmbeKd6gRL-5YievLbV1CH3uu0nlv-Re4ouPNZeR8Uaa5fZGvIpyzCfN4GeYzdNVN-L2Dfhpb6wP3tKMLML8tU2MU77LZNA0Db1Qt~FgBKmBrDM8f98IhyhaIIh3mcPdLcoP5aezbNBOluLkAKxGF1onaa3LNS33jvn6RdWOARg3rQF-iGyCG8t~MaJrqXCHCHnEQWkv8ww0KFZrIE6cKq-EgnS6NZ6Ugc~9fSwQmMSgxfKiJuZdqcca1LwferRwRh3oNdounneCfHfE~QI00U4T7~b0DybwkrOKG0VWDKwXiSGd2AgO7up05Jcgsq7v8V58dmlV9XRRUqXN~soA__&Key-Pair-Id=K2HSFNDJXOU9YS"
                alt="iHeartEcho" width="80" height="80"
                style="border-radius:50%;display:block;margin:0 auto 12px;" />
              <div style="font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">iHeartEcho™</div>
              <div style="font-size:12px;color:#4ad9e0;margin-top:4px;">Echocardiography Clinical Companion</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fffe;border-top:1px solid #e5f7f8;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © All About Ultrasound · <a href="https://www.iheartecho.com" style="color:${brandColor};text-decoration:none;">www.iheartecho.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
                You received this email because an account was created for you on iHeartEcho.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmail(opts: {
  firstName: string;
  verificationUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Verify your iHeartEcho account";
  const previewText = "Click to verify your email and activate your account";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Welcome to iHeartEcho™, ${opts.firstName}!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Thank you for registering. Please verify your email address to activate your account and access all clinical tools.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.verificationUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.verificationUrl}" style="color:${brandColor};word-break:break-all;">${opts.verificationUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildPasswordResetEmail(opts: {
  firstName: string;
  resetUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Reset your iHeartEcho password";
  const previewText = "Click to reset your password — link expires in 1 hour";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Password Reset Request
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, we received a request to reset your iHeartEcho password.
      Click the button below to choose a new password.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.resetUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Reset Password
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your password will not change.
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.resetUrl}" style="color:${brandColor};word-break:break-all;">${opts.resetUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildEmailChangeVerificationEmail(opts: {
  firstName: string;
  newEmail: string;
  verificationUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Confirm your new email address — iHeartEcho";
  const previewText = "Click to confirm your new email address for iHeartEcho";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Confirm Your New Email Address
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, you recently requested to change your iHeartEcho email address to:
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:${brandColor};">${opts.newEmail}</p>
    </div>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Click the button below to confirm this change. Your current email address will remain active until you confirm.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.verificationUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Confirm New Email Address
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link expires in 24 hours. If you did not request this change, you can safely ignore this email — your current email address will not change.
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.verificationUrl}" style="color:${brandColor};word-break:break-all;">${opts.verificationUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildMagicLinkEmail(opts: {
  firstName: string;
  magicUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Your iHeartEcho sign-in link";
  const previewText = "Click to sign in to iHeartEcho — link expires in 15 minutes";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Sign in to iHeartEcho™
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, click the button below to sign in instantly — no password needed.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.magicUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Sign In to iHeartEcho
      </a>
    </div>
    <div style="background:#fff8ed;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>This link expires in 15 minutes</strong> and can only be used once.
        If you did not request this link, you can safely ignore this email.
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.magicUrl}" style="color:${brandColor};word-break:break-all;">${opts.magicUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildCaseApprovedEmail(opts: {
  firstName: string;
  caseTitle: string;
  caseUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `Your echo case has been approved — "${opts.caseTitle}"`;
  const previewText = "Great news! Your submitted echo case has been approved and is now live in the Echo Case Library.";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Your Case Has Been Approved! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, great news — your submitted echo case has been reviewed and <strong style="color:#16a34a;">approved</strong>.
      It is now live in the iHeartEcho Echo Case Library and available to the community.
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:${brandDark};">${opts.caseTitle}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Now live in the Echo Case Library</p>
    </div>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Thank you for contributing to the iHeartEcho learning community. Your case will help sonographers and cardiologists sharpen their echo interpretation skills.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.caseUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        View Your Case
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      Keep contributing — every case helps the community grow.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildCaseRejectedEmail(opts: {
  firstName: string;
  caseTitle: string;
  reason: string;
  submitUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `Update on your submitted echo case — "${opts.caseTitle}"`;
  const previewText = "Your submitted echo case requires some changes before it can be published.";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Case Submission Update
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, thank you for submitting a case to the iHeartEcho Echo Case Library.
      After review, our team was unable to approve the following submission at this time:
    </p>
    <div style="background:#fef2f2;border-left:3px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:${brandDark};">${opts.caseTitle}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#64748b;font-weight:600;">Reviewer feedback:</p>
      <p style="margin:4px 0 0;font-size:14px;color:#475569;line-height:1.5;">${opts.reason}</p>
    </div>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      We encourage you to address the feedback above and resubmit. Please ensure all submitted cases:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#475569;line-height:1.8;">
      <li>Contain <strong>no patient-identifiable information (HIPAA/PHI)</strong></li>
      <li>Include a clear clinical history, diagnosis, and teaching points</li>
      <li>Have high-quality images or video clips that illustrate the case</li>
    </ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.submitUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Submit a Revised Case
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      If you have questions about this decision, please contact us at
      <a href="mailto:support@iheartecho.com" style="color:${brandColor};">support@iheartecho.com</a>.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildWelcomeEmail(opts: {
  firstName: string;
  loginUrl: string;
  roles: string[];
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Your iHeartEcho account is ready";
  const previewText = "Your account has been set up — sign in to get started";
  const roleLabels: Record<string, string> = {
    premium_user: "Premium Access",
    diy_user: "DIY Accreditation",
    diy_admin: "Lab Admin",
    platform_admin: "Platform Admin",
  };
  const roleList = opts.roles
    .filter(r => roleLabels[r])
    .map(r => `<li style="margin:4px 0;color:#475569;">${roleLabels[r]}</li>`)
    .join("");

  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Welcome to iHeartEcho™, ${opts.firstName}!
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Your account has been set up by an administrator. You now have access to the iHeartEcho clinical platform.
    </p>
    ${roleList ? `
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${brandColor};">Your assigned access:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;">
        ${roleList}
      </ul>
    </div>` : ""}
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.loginUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Sign In to iHeartEcho
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      If you have any questions, please contact us at
      <a href="mailto:support@iheartecho.com" style="color:${brandColor};">support@iheartecho.com</a>.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

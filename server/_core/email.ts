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
  const senderName = process.env.SENDGRID_FROM_NAME || "iHeartEcho™";

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
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>iHeartEcho™</title>
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
                alt="iHeartEcho™" width="80" height="80"
                style="border-radius:50%;display:block;margin:0 auto 12px;" />
              <div style="font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">iHeartEcho™</div>
              <div style="font-size:12px;color:#4ad9e0;margin-top:4px;">Echocardiography Clinical Intelligence</div>
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
                © All About Ultrasound · <a href="https://www.iheartecho.com" style="color:${brandColor};text-decoration:none;" target="_blank" rel="noopener noreferrer">www.iheartecho.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
                You received this email because an account was created for you on iHeartEcho™.
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

export function buildStreakReminderEmail(opts: {
  firstName: string;
  currentStreak: number;
  loginUrl: string;
  unsubscribeUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const streakMsg =
    opts.currentStreak > 0
      ? `Your current streak is <strong style="color:${brandColor};">${opts.currentStreak} day${opts.currentStreak === 1 ? "" : "s"}</strong>. Keep it going!`
      : `Start your streak today &mdash; every session builds your clinical knowledge.`;
  const subject =
    opts.currentStreak > 0
      ? `\u26a1 Don't break your ${opts.currentStreak}-day streak \u2014 Daily Challenge is waiting!`
      : `\u26a1 Your Daily Challenge is ready \u2014 jump in!`;
  const previewText =
    opts.currentStreak > 0
      ? `You haven't completed today's Daily Challenge yet. Keep your ${opts.currentStreak}-day streak alive!`
      : `Today's Daily Challenge is ready. Start your streak now!`;
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Hi ${opts.firstName}, your Daily Challenge is waiting!
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      ${streakMsg}
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:14px 16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#0e4a50;font-weight:600;">Today's session includes:</p>
      <ul style="margin:8px 0 0;padding-left:20px;font-size:14px;color:#475569;">
        <li style="margin:4px 0;">Scenario-based clinical questions</li>
        <li style="margin:4px 0;">Image interpretation challenges</li>
        <li style="margin:4px 0;">Quick-review flashcards</li>
      </ul>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.loginUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        26a1 Complete Today's Daily Challenge
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
      <a href="${opts.unsubscribeUrl}" style="color:#94a3b8;" target="_blank" rel="noopener noreferrer">Unsubscribe from Daily Challenge reminders</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildVerificationEmail(opts: {
  firstName: string;
  verificationUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Verify your iHeartEcho™ account";
  const previewText = "Click to verify your email and activate your account";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Welcome to iHeartEcho, ${opts.firstName}!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Thank you for registering. Please verify your email address to activate your account and access all clinical tools.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.verificationUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.verificationUrl}" style="color:${brandColor};word-break:break-all;" target="_blank" rel="noopener noreferrer">${opts.verificationUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildPasswordResetEmail(opts: {
  firstName: string;
  resetUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Reset your iHeartEcho™ password";
  const previewText = "Click to reset your password — link expires in 1 hour";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Password Reset Request
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, we received a request to reset your iHeartEcho™ password.
      Click the button below to choose a new password.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.resetUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Reset Password
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email — your password will not change.
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.resetUrl}" style="color:${brandColor};word-break:break-all;" target="_blank" rel="noopener noreferrer">${opts.resetUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildEmailChangeVerificationEmail(opts: {
  firstName: string;
  newEmail: string;
  verificationUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Confirm your new email address — iHeartEcho™";
  const previewText = "Click to confirm your new email address for iHeartEcho™";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Confirm Your New Email Address
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, you recently requested to change your iHeartEcho™ email address to:
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:${brandColor};">${opts.newEmail}</p>
    </div>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Click the button below to confirm this change. Your current email address will remain active until you confirm.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.verificationUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Confirm New Email Address
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This link expires in 24 hours. If you did not request this change, you can safely ignore this email — your current email address will not change.
    </p>
    <p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.verificationUrl}" style="color:${brandColor};word-break:break-all;" target="_blank" rel="noopener noreferrer">${opts.verificationUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildMagicLinkEmail(opts: {
  firstName: string;
  magicUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Your iHeartEcho™ sign-in link";
  const previewText = "Click to sign in to iHeartEcho™ — link expires in 15 minutes";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Sign in to iHeartEcho™
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.firstName}, click the button below to sign in instantly — no password needed.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.magicUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Sign In to iHeartEcho™
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
      <a href="${opts.magicUrl}" style="color:${brandColor};word-break:break-all;" target="_blank" rel="noopener noreferrer">${opts.magicUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildNewCaseSubmissionAdminEmail(opts: {
  submitterName: string;
  caseTitle: string;
  modality: string;
  difficulty: string;
  adminUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `New case submission pending review — "${opts.caseTitle}"`;
  const previewText = `${opts.submitterName} submitted a new echo case for your review: "${opts.caseTitle}"`;
  const difficultyLabel: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      New Case Submission Awaiting Review
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      A user has submitted a new echo case to the iHeartEcho™ Echo Case Library.
      Please review it and approve or reject it from the Case Management panel.
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b;width:120px;">Submitted by</td>
          <td style="padding:4px 0;font-size:14px;font-weight:700;color:${brandDark};">${opts.submitterName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b;">Case title</td>
          <td style="padding:4px 0;font-size:14px;font-weight:700;color:${brandDark};">${opts.caseTitle}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b;">Modality</td>
          <td style="padding:4px 0;font-size:14px;color:#475569;">${opts.modality}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b;">Difficulty</td>
          <td style="padding:4px 0;font-size:14px;color:#475569;">${difficultyLabel[opts.difficulty] ?? opts.difficulty}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.adminUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Review in Case Management
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      This is an automated notification from iHeartEcho™. The submitter has acknowledged the HIPAA/PHI policy.
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
      It is now live in the iHeartEcho™ Echo Case Library and available to the community.
    </p>
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:${brandDark};">${opts.caseTitle}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Now live in the Echo Case Library</p>
    </div>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Thank you for contributing to the iHeartEcho™ learning community. Your case will help sonographers and cardiologists sharpen their echo interpretation skills.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.caseUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
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
      Hi ${opts.firstName}, thank you for submitting a case to the iHeartEcho™ Echo Case Library.
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
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Submit a Revised Case
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      If you have questions about this decision, please contact us at
      <a href="mailto:support@iheartecho.com" style="color:${brandColor};" target="_blank" rel="noopener noreferrer">support@iheartecho.com</a>.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildWelcomeEmail(opts: {
  firstName: string;
  loginUrl: string;
  roles: string[];
  /** Override the CTA button label. Defaults to 'Set Up Your Account' */
  ctaLabel?: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Your iHeartEcho™ account is ready";
  const previewText = "Your account has been set up — click to get started";
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
      Welcome to iHeartEcho, ${opts.firstName}!
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      An account has been created for you on the iHeartEcho™ clinical platform. Click the button below to complete your registration and set your password.
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
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        ${opts.ctaLabel ?? "Set Up Your Account"}
      </a>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      If you have any questions, please contact us at
      <a href="mailto:support@iheartecho.com" style="color:${brandColor};" target="_blank" rel="noopener noreferrer">support@iheartecho.com</a>.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

// ─── Physician Over-Read Invitation Email ─────────────────────────────────────

export function buildPhysicianOverReadInvitationEmail(opts: {
  physicianName: string;
  labName: string;
  examType: string;
  examIdentifier: string;
  examDos?: string | null;
  reviewUrl: string;
  expiresInDays?: number;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `Physician Over-Read Request — ${opts.examType} (${opts.examIdentifier})`;
  const previewText = `${opts.labName} has requested your blind over-read for a ${opts.examType} study.`;
  const expiry = opts.expiresInDays ?? 14;
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Physician Over-Read Request
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Dear ${opts.physicianName},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      <strong>${opts.labName}</strong> has requested your independent blind over-read for the following echocardiogram study:
    </p>
    <div style="background:#f0fbfc;border:1px solid #b2e8eb;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;width:45%;">Exam Type</td>
          <td style="padding:6px 0;color:#0e1e2e;font-weight:700;">${opts.examType}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Exam Identifier</td>
          <td style="padding:6px 0;color:#0e1e2e;">${opts.examIdentifier}</td>
        </tr>
        ${opts.examDos ? `
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Date of Study</td>
          <td style="padding:6px 0;color:#0e1e2e;">${opts.examDos}</td>
        </tr>` : ""}
      </table>
    </div>
    <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">Important: Blind Over-Read</p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.5;">
        Please complete this form as a <strong>blind over-read</strong> — do NOT review the original physician's report before submitting your independent assessment. Your findings will be compared with the original read to evaluate concordance.
      </p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.reviewUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Complete Over-Read Form
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;line-height:1.5;text-align:center;">
      This link expires in <strong>${expiry} days</strong>. If you have questions, contact the lab directly.
    </p>
    <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.reviewUrl}" style="color:${brandColor};word-break:break-all;font-size:11px;" target="_blank" rel="noopener noreferrer">${opts.reviewUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

// ─── Lab Admin Notification: Over-Read Completed ─────────────────────────────

export function buildOverReadCompletedEmail(opts: {
  adminName: string;
  labName: string;
  physicianName: string;
  examType: string;
  examIdentifier: string;
  step2Url: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `Over-Read Completed — ${opts.examType} (${opts.examIdentifier})`;
  const previewText = `${opts.physicianName} has completed the over-read. You can now complete Step 2.`;
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Physician Over-Read Completed
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.adminName},
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      <strong>${opts.physicianName}</strong> has completed the blind over-read for the following study in <strong>${opts.labName}</strong>:
    </p>
    <div style="background:#f0fbfc;border:1px solid #b2e8eb;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;width:45%;">Exam Type</td>
          <td style="padding:6px 0;color:#0e1e2e;font-weight:700;">${opts.examType}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-weight:600;">Exam Identifier</td>
          <td style="padding:6px 0;color:#0e1e2e;">${opts.examIdentifier}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      You can now complete <strong>Step 2: Comparison Review</strong> to enter the original read findings and generate the concordance score.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.step2Url}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Complete Step 2: Comparison Review
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.step2Url}" style="color:${brandColor};word-break:break-all;font-size:11px;" target="_blank" rel="noopener noreferrer">${opts.step2Url}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

// ─── Sonographer Peer Review Feedback Email ───────────────────────────────────
export function buildPeerReviewFeedbackEmail(opts: {
  sonographerName: string;
  reviewerName: string;
  examType: string;
  examDate: string;
  examIdentifier: string;
  qualityScore?: number;
  qualityTier?: string;
  comments?: string;
  appUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `Peer Review Feedback — ${opts.examType} (${opts.examDate})`;
  const previewText = `${opts.reviewerName} has completed a peer review of your ${opts.examType} study. View your feedback.`;

  const tierColor =
    (opts.qualityTier ?? "").toLowerCase().includes("excellent") ? "#16a34a" :
    (opts.qualityTier ?? "").toLowerCase().includes("good") ? "#2563eb" :
    (opts.qualityTier ?? "").toLowerCase().includes("adequate") ? "#d97706" : "#dc2626";

  const scoreBlock = opts.qualityScore != null ? `
    <div style="background:#f0fbfc;border:1px solid #b2e8eb;border-radius:8px;padding:16px 20px;margin:0 0 20px;text-align:center;">
      <div style="font-size:36px;font-weight:900;color:${tierColor};">${opts.qualityScore}%</div>
      ${opts.qualityTier ? `<div style="font-size:13px;font-weight:700;color:${tierColor};margin-top:4px;">${opts.qualityTier}</div>` : ""}
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Quality Score</div>
    </div>
  ` : "";

  const commentsBlock = opts.comments ? `
    <div style="background:#f8fafc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Reviewer Comments</p>
      <p style="margin:0;font-size:14px;color:#0e1e2e;line-height:1.6;">${opts.comments}</p>
    </div>
  ` : "";

  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Peer Review Feedback
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.sonographerName}, a peer review has been completed for one of your studies.
    </p>
    <div style="background:#f0fbfc;border:1px solid #b2e8eb;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:5px 0;color:#64748b;font-weight:600;width:45%;">Exam Type</td>
          <td style="padding:5px 0;color:#0e1e2e;font-weight:700;">${opts.examType}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#64748b;font-weight:600;">Exam Date</td>
          <td style="padding:5px 0;color:#0e1e2e;">${opts.examDate}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#64748b;font-weight:600;">Exam Identifier</td>
          <td style="padding:5px 0;color:#0e1e2e;">${opts.examIdentifier || "—"}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;color:#64748b;font-weight:600;">Reviewed By</td>
          <td style="padding:5px 0;color:#0e1e2e;">${opts.reviewerName}</td>
        </tr>
      </table>
    </div>
    ${scoreBlock}
    ${commentsBlock}
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.appUrl}/diy-accreditation?tab=sono-peer"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        View Full Review
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
      This is an automated notification from iHeartEcho™ DIY Accreditation Tool.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

// ─── Quality Meeting Invitation Email ─────────────────────────────────────────
export function buildMeetingInvitationEmail(opts: {
  recipientName: string;
  meetingTitle: string;
  meetingType: string;
  scheduledAt: Date;
  durationMinutes: number;
  location?: string | null;
  meetingLink?: string | null;
  agenda?: string | null;
  organizerName: string;
  appUrl: string;
  rsvpUrl: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `Meeting Invitation: ${opts.meetingTitle}`;
  const previewText = `You have been invited to "${opts.meetingTitle}" on ${opts.scheduledAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`;

  const dateStr = opts.scheduledAt.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const meetingTypeLabel: Record<string, string> = {
    quality_review: "Quality Review",
    staff_meeting: "Staff Meeting",
    accreditation: "Accreditation Meeting",
    education: "Education Session",
    other: "Meeting",
  };

  const joinButton = opts.meetingLink
    ? `<div style="text-align:center;margin:20px 0;">
        <a href="${opts.meetingLink}"
          style="display:inline-block;background:#0e4a50;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
          🎥 Join Meeting (Zoom/Teams)
        </a>
      </div>`
    : "";

  const agendaBlock = opts.agenda
    ? `<div style="background:#f8fafc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Agenda</p>
        <p style="margin:0;font-size:14px;color:#0e1e2e;line-height:1.6;white-space:pre-wrap;">${opts.agenda}</p>
      </div>`
    : "";

  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Quality Meeting Invitation
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.recipientName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      <strong>${opts.organizerName}</strong> has invited you to the following quality meeting:
    </p>
    <div style="background:#f0fbfc;border:1px solid #b2e8eb;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:7px 0;color:#64748b;font-weight:600;width:40%;">Meeting</td>
          <td style="padding:7px 0;color:#0e1e2e;font-weight:700;">${opts.meetingTitle}</td>
        </tr>
        <tr style="background:rgba(24,154,161,0.05);">
          <td style="padding:7px 0;color:#64748b;font-weight:600;">Type</td>
          <td style="padding:7px 0;color:#0e1e2e;">${meetingTypeLabel[opts.meetingType] ?? opts.meetingType}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;color:#64748b;font-weight:600;">Date &amp; Time</td>
          <td style="padding:7px 0;color:#0e1e2e;font-weight:600;">${dateStr}</td>
        </tr>
        <tr style="background:rgba(24,154,161,0.05);">
          <td style="padding:7px 0;color:#64748b;font-weight:600;">Duration</td>
          <td style="padding:7px 0;color:#0e1e2e;">${opts.durationMinutes} minutes</td>
        </tr>
        ${opts.location ? `<tr><td style="padding:7px 0;color:#64748b;font-weight:600;">Location</td><td style="padding:7px 0;color:#0e1e2e;">${opts.location}</td></tr>` : ""}
        ${opts.meetingLink ? `<tr style="background:rgba(24,154,161,0.05);"><td style="padding:7px 0;color:#64748b;font-weight:600;">Meeting Link</td><td style="padding:7px 0;"><a href="${opts.meetingLink}" style="color:${brandColor};font-weight:600;word-break:break-all;" target="_blank" rel="noopener noreferrer">Join Meeting</a></td></tr>` : ""}
      </table>
    </div>
    ${agendaBlock}
    ${joinButton}
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;text-align:center;">
      Please confirm your attendance by clicking below:
    </p>
    <div style="text-align:center;margin:0 0 28px;display:flex;gap:12px;justify-content:center;">
      <a href="${opts.rsvpUrl}?response=accepted"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;text-decoration:none;margin-right:8px;" target="_blank" rel="noopener noreferrer">
        ✓ Accept
      </a>
      <a href="${opts.rsvpUrl}?response=declined"
        style="display:inline-block;background:#f1f5f9;color:#475569;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;" target="_blank" rel="noopener noreferrer">
        ✗ Decline
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
      This invitation was sent from the iHeartEcho™ DIY Accreditation Tool.<br/>
      You can also manage your RSVP by logging in to <a href="${opts.appUrl}" style="color:${brandColor};" target="_blank" rel="noopener noreferrer">iHeartEcho™</a>.
    </p>
  `);
  return { subject, htmlBody, previewText };
}

// ─── Welcome Email with Magic Link (for new Thinkific subscribers) ────────────

/**
 * Welcome email sent to new iHeartEcho direct subscribers via Thinkific webhook.
 * Embeds a one-click magic link so the user can sign in immediately without
 * needing to set a password. The token should be valid for 72 hours (not the
 * usual 15-minute request-time token) to give users time to see the email.
 *
 * Sent for: iHeartEcho free, premium, DIY accreditation, and education memberships.
 * NOT sent for: All About Ultrasound free membership sign-ups.
 */
export function buildWelcomeWithMagicLinkEmail(opts: {
  firstName: string;
  magicUrl: string;
  membershipLabel: string;  // e.g. "Free", "Premium Access", "DIY Accreditation"
  roles: string[];
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = "Welcome to iHeartEcho™ — your account is ready";
  const previewText = "Your iHeartEcho™ account is set up. Click to sign in instantly — no password needed.";

  const roleLabels: Record<string, string> = {
    premium_user: "Premium Access",
    diy_user: "DIY Accreditation",
    diy_admin: "Lab Admin",
    platform_admin: "Platform Admin",
    education_manager: "Education Manager",
    education_admin: "Education Admin",
    education_student: "Education Student",
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
      Your <strong>${opts.membershipLabel}</strong> account is ready. Click the button below
      to sign in instantly &mdash; no password needed.
    </p>
    ${roleList ? `
    <div style="background:#f0fbfc;border-left:3px solid ${brandColor};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${brandColor};">Your membership includes:</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;">
        ${roleList}
      </ul>
    </div>` : ""}
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.magicUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:16px;padding:16px 36px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Sign In to iHeartEcho™
      </a>
    </div>
    <div style="background:#fff8ed;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        <strong>This sign-in link expires in 72 hours</strong> and can only be used once.
        After signing in you can set a password from your profile, or continue using
        magic links each time.
      </p>
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
      What you can do on iHeartEcho™:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:13px;color:#475569;line-height:1.8;">
      <li>Daily echo challenges &amp; case library</li>
      <li>Echo severity calculators (ASE 2025 guidelines)</li>
      <li>Hemodynamics Lab &amp; ScanCoach™</li>
      <li>EchoAssist™ clinical decision support</li>
    </ul>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
      If you have any questions, contact us at
      <a href="mailto:support@iheartecho.com" style="color:${brandColor};" target="_blank" rel="noopener noreferrer">support@iheartecho.com</a>.
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#cbd5e1;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${opts.magicUrl}" style="color:${brandColor};word-break:break-all;font-size:11px;" target="_blank" rel="noopener noreferrer">${opts.magicUrl}</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

export function buildAdminNewSubmissionEmail(opts: {
  submitterName: string;
  submitterEmail?: string;
  category: string;
  difficulty: string;
  questionPreview: string;
  qid: string;
  reviewUrl: string;
  hasImage: boolean;
  hasVideo: boolean;
}): { subject: string; htmlBody: string; previewText: string } {
  const subject = `📋 New Question Submission — ${opts.category} (${opts.qid})`;
  const previewText = `${opts.submitterName} submitted a new ${opts.category} question for review.`;

  const difficultyColor =
    opts.difficulty === "beginner" ? "#16a34a" :
    opts.difficulty === "advanced" ? "#dc2626" : "#2563eb";

  const mediaLine = [
    opts.hasImage ? "📷 Image attached" : "",
    opts.hasVideo ? "🎬 Video attached" : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      New Question Submission
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      A user has submitted a new challenge question for your review.
    </p>

    <!-- Metadata row -->
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td style="padding:12px 16px;background:#f0fbfc;border-radius:8px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size:12px;color:#64748b;padding-bottom:6px;"><strong>Submitter</strong></td>
              <td style="font-size:12px;color:#0e1e2e;padding-bottom:6px;">${opts.submitterName}${opts.submitterEmail ? ` &lt;${opts.submitterEmail}&gt;` : ""}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;padding-bottom:6px;"><strong>Category</strong></td>
              <td style="font-size:12px;color:#0e1e2e;padding-bottom:6px;">${opts.category}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;padding-bottom:6px;"><strong>Difficulty</strong></td>
              <td style="font-size:12px;color:${difficultyColor};font-weight:600;padding-bottom:6px;">${opts.difficulty}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;"><strong>Question ID</strong></td>
              <td style="font-size:12px;color:#0e1e2e;font-family:monospace;">${opts.qid}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Question preview -->
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Question Preview</p>
      <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${opts.questionPreview}</p>
      ${mediaLine ? `<p style="margin:10px 0 0;font-size:12px;color:#64748b;">${mediaLine}</p>` : ""}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="${opts.reviewUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Review Submission
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
      Go to Admin → Submissions tab to approve or reject this question.
    </p>
  `);

  return { subject, htmlBody, previewText };
}

// --- User Submission Confirmation Email ---
interface UserSubmissionConfirmationEmailOpts {
  recipientName: string;
  qid: string;
  category: string;
  difficulty: string;
  questionPreview: string;
  hasImage?: boolean;
  hasVideo?: boolean;
}

export function buildUserSubmissionConfirmationEmail(opts: UserSubmissionConfirmationEmailOpts): {
  subject: string;
  htmlBody: string;
  previewText: string;
} {
  const subject = `✅ Question Received — ${opts.qid} | iHeartEcho™`;
  const previewText = `Thank you for submitting your ${opts.category} question! We will review it within 5–7 business days.`;

  const difficultyColor =
    opts.difficulty === 'beginner' ? '#16a34a' :
    opts.difficulty === 'intermediate' ? '#d97706' : '#dc2626';

  const mediaLine = [
    opts.hasImage ? '📷 Image attached' : '',
    opts.hasVideo ? '🎦 Video attached' : '',
  ].filter(Boolean).join(' &nbsp;&middot;&nbsp; ');

  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${brandDark};font-family:Georgia,serif;">
      Thank You for Your Submission!
    </h2>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      Hi ${opts.recipientName}, we received your challenge question and it is now in our review queue.
      Our editorial team will review it within <strong>5&ndash;7 business days</strong>.
      You will receive another email once a decision has been made.
    </p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr>
        <td style="padding:16px 20px;background:#f0fbfc;border-radius:10px;border-left:4px solid ${brandColor};">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Submission Summary</p>
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
            <tr>
              <td style="font-size:12px;color:#64748b;padding-bottom:7px;width:120px;"><strong>Question ID</strong></td>
              <td style="font-size:13px;color:#0e1e2e;font-family:monospace;font-weight:700;padding-bottom:7px;">${opts.qid}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;padding-bottom:7px;"><strong>Category</strong></td>
              <td style="font-size:12px;color:#0e1e2e;padding-bottom:7px;">${opts.category}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;padding-bottom:7px;"><strong>Difficulty</strong></td>
              <td style="font-size:12px;color:${difficultyColor};font-weight:600;padding-bottom:7px;">${opts.difficulty.charAt(0).toUpperCase() + opts.difficulty.slice(1)}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#64748b;"><strong>Status</strong></td>
              <td style="font-size:12px;color:#d97706;font-weight:600;">Pending Review</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Your Question</p>
      <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${opts.questionPreview}</p>
      ${mediaLine ? `<p style="margin:10px 0 0;font-size:12px;color:#64748b;">${mediaLine}</p>` : ''}
    </div>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">What Happens Next?</p>
      <ol style="margin:0;padding-left:18px;font-size:13px;color:#78350f;line-height:1.8;">
        <li>Our editorial team reviews your question for clinical accuracy and guideline alignment.</li>
        <li>If approved, your question will be added to the daily challenge queue.</li>
        <li>If revisions are needed, we may reach out with feedback.</li>
        <li>You will receive a confirmation email once a decision is made.</li>
      </ol>
    </div>
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="https://app.iheartecho.com/quickfire?tab=submit"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:14px;padding:13px 28px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Submit Another Question
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.5;">
      Questions? Reply to this email or visit <a href="https://www.iheartecho.com" style="color:${brandColor};">iheartecho.com</a>.
    </p>
  `);

  return { subject, htmlBody, previewText };
}


// --- First Sign-In Welcome Email ---
export function buildFirstSignInWelcomeEmail(opts: {
  firstName: string;
  appUrl?: string;
  notifSettingsUrl?: string;
}): { subject: string; htmlBody: string; previewText: string } {
  const appUrl = opts.appUrl ?? "https://app.iheartecho.com";
  const notifUrl = opts.notifSettingsUrl ?? appUrl + "/profile";
  const subject = "Welcome to iHeartEcho™ — your daily echo challenge starts now";
  const previewText = "You are in! Expect a daily echo challenge in your inbox every morning.";
  const htmlBody = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:22px;color:${brandDark};font-family:Georgia,serif;">
      Welcome to iHeartEcho™, ${opts.firstName}!
    </h2>
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      You are now part of a community of sonographers, cardiologists, and ACS professionals
      sharpening their echo skills every day.
    </p>
    <div style="background:linear-gradient(135deg,#0e1e2e,#0e4a50);border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#4ad9e0;text-transform:uppercase;letter-spacing:0.08em;">
        Daily Echo Challenge
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;">
        A new clinical echo question lands in your inbox every morning. Test your knowledge,
        earn Echo Ninja points, and climb the leaderboard.
      </p>
      <a href="${appUrl}/quickfire"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:14px;padding:11px 24px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Try Today Challenge
      </a>
    </div>
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${brandDark};">What is waiting for you:</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;">
      <tr><td style="padding:8px 0;font-size:14px;color:#475569;border-bottom:1px solid #e2e8f0;">Adult TTE and TEE EchoNavigator</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#475569;border-bottom:1px solid #e2e8f0;">Pediatric and Fetal Echo Coaches</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#475569;border-bottom:1px solid #e2e8f0;">Echo Severity Calculator (ASE 2025)</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#475569;">500+ Echo Cases with gamified learning</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0 20px;">
      <a href="${appUrl}"
        style="display:inline-block;background:linear-gradient(135deg,${brandColor},#4ad9e0);color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;text-decoration:none;" target="_blank" rel="noopener noreferrer">
        Open iHeartEcho
      </a>
    </div>
    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
      You will receive the daily challenge email each morning. To manage your email preferences,
      <a href="${notifUrl}" style="color:${brandColor};" target="_blank" rel="noopener noreferrer">update your notification settings</a>.
    </p>
    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
      Questions? Contact us at <a href="mailto:support@iheartecho.com" style="color:${brandColor};">support@iheartecho.com</a>
    </p>
  `);
  return { subject, htmlBody, previewText };
}

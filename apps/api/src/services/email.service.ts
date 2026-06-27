import nodemailer from 'nodemailer';

// ─── Transport ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface WelcomeEmailParams {
  to: string;
  name: string;
  role: string;
  identifier: string;
  password: string;
  hostelName?: string;
  hostelCode?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const baseStyles = `
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
`;

const header = (title: string) => `
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 28px 24px; border-radius: 12px 12px 0 0;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">🏠</div>
      <span style="color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">NexStay</span>
    </div>
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">${title}</h1>
  </div>
`;

const footer = () => `
  <div style="background: #f8fafc; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
    <hr style="margin: 0 0 12px 0; border: none; border-top: 1px solid #e2e8f0;" />
    <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
      This is an automated email from NexStay. Please do not reply.<br />
      © ${new Date().getFullYear()} NexStay. All rights reserved.
    </p>
  </div>
`;

const roleBadge = (role: string) => {
  const map: Record<string, { label: string; color: string }> = {
    SUPER_ADMIN:  { label: 'Super Admin',    color: '#7c3aed' },
    HOSTEL_ADMIN: { label: 'Hostel Owner',   color: '#1d4ed8' },
    WARDEN:       { label: 'Warden',         color: '#0f766e' },
    MESS_MANAGER: { label: 'Mess Manager',   color: '#b45309' },
    STUDENT:      { label: 'Student',        color: '#15803d' },
  };
  const info = map[role] || { label: role, color: '#64748b' };
  return `<span style="background: ${info.color}1a; color: ${info.color}; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; border: 1px solid ${info.color}33;">${info.label}</span>`;
};

// ─── Welcome Email ────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async (params: WelcomeEmailParams): Promise<void> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIPPED - no SMTP config] Welcome email for ${params.to}`);
    return;
  }

  const { to, name, role, identifier, password, hostelName, hostelCode } = params;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const html = `
  <div style="${baseStyles}">
    ${header('Welcome to NexStay! 🎉')}
    <div style="background: white; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: 0;">
      <p style="color: #334155; font-size: 15px; margin: 0 0 8px 0;">Hi <strong>${name}</strong>,</p>
      ${roleBadge(role)}
      <p style="color: #475569; font-size: 14px; margin: 16px 0;">Your NexStay account has been created successfully. Here are your login credentials:</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 40%;">Login ID</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; font-family: monospace;">${identifier}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Password</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; font-family: monospace;">${password}</td>
          </tr>
          ${hostelName ? `
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Hostel</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${hostelName}</td>
          </tr>` : ''}
          ${hostelCode ? `
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Hostel Code</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600; font-family: monospace;">${hostelCode}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">⚠️</span>
        <p style="color: #b91c1c; font-size: 13px; margin: 0; font-weight: 500;">Please change your password after your first login.</p>
      </div>

      <div style="text-align: center; margin: 24px 0 8px 0;">
        <a href="${frontendUrl}/login" style="background: #1d4ed8; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
          Sign In to NexStay →
        </a>
      </div>
    </div>
    ${footer()}
  </div>`;

  try {
    await transporter.sendMail({
      from: `"NexStay" <${process.env.SMTP_USER}>`,
      to,
      subject: `Welcome to NexStay — Your Login Credentials`,
      html,
    });
    console.log(`[EMAIL SENT] Welcome email to ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send welcome email to ${to}:`, err);
    // Don't throw — app works without email
  }
};

// ─── OTP / Password Reset Email ───────────────────────────────────────────────
export const sendOtpEmail = async (to: string, otp: string, name: string): Promise<void> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIPPED - no SMTP config] OTP email for ${to}: ${otp}`);
    return;
  }

  const html = `
  <div style="${baseStyles}">
    ${header('Password Reset OTP')}
    <div style="background: white; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: 0;">
      <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hi <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">You requested a password reset. Use the OTP below to proceed:</p>
      
      <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
        <div style="color: white; font-size: 40px; font-weight: 700; letter-spacing: 12px; font-family: monospace;">${otp}</div>
      </div>

      <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">This OTP expires in <strong>10 minutes</strong>.</p>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 12px 0 0 0;">If you did not request this, please ignore this email.</p>
    </div>
    ${footer()}
  </div>`;

  try {
    await transporter.sendMail({
      from: `"NexStay" <${process.env.SMTP_USER}>`,
      to,
      subject: `NexStay — Password Reset OTP: ${otp}`,
      html,
    });
    console.log(`[EMAIL SENT] OTP email to ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send OTP email to ${to}:`, err);
  }
};

// ─── Rent Reminder Email ──────────────────────────────────────────────────────
export const sendRentReminderEmail = async (
  to: string,
  name: string,
  amount: number,
  dueDate: string,
  hostelName: string
): Promise<void> => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIPPED - no SMTP config] Rent reminder for ${to}`);
    return;
  }

  const html = `
  <div style="${baseStyles}">
    ${header('Rent Payment Reminder 📋')}
    <div style="background: white; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: 0;">
      <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hi <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">This is a friendly reminder that your rent payment is due soon.</p>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Hostel</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 600;">${hostelName}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Amount Due</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">₹${amount.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Due Date</td>
            <td style="padding: 8px 0; color: #dc2626; font-size: 13px; font-weight: 600;">${dueDate}</td>
          </tr>
        </table>
      </div>
      <p style="color: #475569; font-size: 13px;">Please contact your warden or hostel administrator to process the payment.</p>
    </div>
    ${footer()}
  </div>`;

  try {
    await transporter.sendMail({
      from: `"NexStay" <${process.env.SMTP_USER}>`,
      to,
      subject: `NexStay — Rent Payment Reminder: ₹${amount.toLocaleString('en-IN')} due on ${dueDate}`,
      html,
    });
    console.log(`[EMAIL SENT] Rent reminder to ${to}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send rent reminder to ${to}:`, err);
  }
};

// ─── Legacy mock email compatibility ─────────────────────────────────────────
export function sendMockEmail(to: string, subject: string, body: string): void {
  console.log(`[EMAIL LOG] To: ${to} | Subject: "${subject}" | Body: ${body.slice(0, 100)}`);
}
export function getMockEmails() { return []; }

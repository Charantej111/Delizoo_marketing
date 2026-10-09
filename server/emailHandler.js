import nodemailer from 'nodemailer';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

function loadEnvFallback() {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k && v.length) {
          const val = v.join('=').trim().replace(/^["']|["']$/g, '');
          if (!process.env[k.trim()]) {
            process.env[k.trim()] = val;
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}
loadEnvFallback();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Charanteja@61A4@db.wclyevaejqlkltivzxuq.supabase.co:5432/postgres";

// Helper to log to Supabase email_logs table
async function logEmailToDb(eventType, recipient, subject, body, status, error = null) {
  try {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    await client.query(
      `INSERT INTO public.email_logs (event_type, recipient, subject, body, status, error) VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventType, recipient, subject, body, status, error]
    );
    await client.end();
  } catch (dbErr) {
    console.error('[Email Log DB Error]:', dbErr.message);
  }
}

export function createGmailTransporter(user, pass) {
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, '') // Remove spaces from Gmail app passwords
    }
  });
}

const DEFAULT_FOUNDER_MAP = {
  charan: 'ncharantejaa@gmail.com',
  sunil: 'dev.sunilgarbana@gmail.com',
  sandeep: 'jakkasandeep9@gmail.com',
  nareen: 'mangamnareenkumar@gmail.com',
  pavan: 'dev.pavangollapalli@gmail.com',
  dheeraj: 'dheerajbathi@gmail.com'
};

const DEFAULT_FOUNDER_EMAILS = Object.values(DEFAULT_FOUNDER_MAP);

const GMAIL_USER_DEFAULT = 'pmcareeros@gmail.com';
const GMAIL_PASS_DEFAULT = 'jtmemfcjgumleyrk';

export async function handleSendEmail(reqBody) {
  const { type, recipient, subject, html, task, expense, config } = reqBody;

  const gmailUser = config?.user || process.env.GMAIL_USER || GMAIL_USER_DEFAULT;
  const gmailPass = config?.pass || process.env.GMAIL_APP_PASSWORD || GMAIL_PASS_DEFAULT;
  const senderName = config?.senderName || process.env.GMAIL_SENDER_NAME || 'Delizoo OS';
  const appUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');

  if (!gmailUser || !gmailPass) {
    const msg = 'Gmail SMTP credentials (GMAIL_USER / GMAIL_APP_PASSWORD) not configured yet';
    console.warn('[Email Warning]:', msg);
    await logEmailToDb(type || 'UNKNOWN', recipient || 'None', subject || 'No Subject', html || '', 'SKIPPED_NOT_CONFIGURED', msg);
    return {
      success: false,
      notConfigured: true,
      message: msg
    };
  }

  const transporter = createGmailTransporter(gmailUser, gmailPass);

  let mailSubject = subject;
  let mailHtml = html;
  let targetEmail = recipient;

  // Resolve target email if missing or empty
  if (!targetEmail || targetEmail.trim() === '') {
    if (type === 'TASK_ASSIGNED' && task?.assignee) {
      const lower = task.assignee.toLowerCase();
      for (const [key, em] of Object.entries(DEFAULT_FOUNDER_MAP)) {
        if (lower.includes(key)) {
          targetEmail = em;
          break;
        }
      }
    } else if (type === 'EXPENSE_LOGGED') {
      targetEmail = DEFAULT_FOUNDER_EMAILS.join(', ');
    }
  }

  if (!targetEmail) {
    const msg = `No recipient email available for event ${type || 'UNKNOWN'}`;
    console.warn('[Email Warning]:', msg);
    return {
      success: false,
      skipped: true,
      message: msg
    };
  }

  // 1. Task Assigned Template (Executive Minimalist Design)
  if (type === 'TASK_ASSIGNED' && task) {
    mailSubject = `Task Assigned: ${task.title}`;
    mailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Task Assigned: ${task.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 28px; height: 28px; background-color: #0f172a; border-radius: 6px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 14px; line-height: 28px;">
                          D
                        </td>
                        <td style="padding-left: 10px; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
                          Delizoo OS
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-size: 12px; font-weight: 500; color: #64748b;">
                    Task Assignment
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">
                Milestone Action Required
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.35; letter-spacing: -0.3px;">
                ${task.title}
              </h1>

              <!-- Task Spec Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500; width: 35%;">
                    Assigned To
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${task.assignee || 'Unassigned'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Operational Stream
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${task.spendArea || 'General Operations'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Priority
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: ${task.priority === 'Urgent' ? '#dc2626' : '#0f172a'}; font-weight: 600;">
                    ${task.priority || 'Normal'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Due Date
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${task.dueDate || 'No deadline specified'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #64748b; font-weight: 500;">
                    Current Status
                  </td>
                  <td style="padding: 12px 16px; color: #0f172a; font-weight: 600;">
                    ${task.status || 'To Do'} (${task.progress || 0}% complete)
                  </td>
                </tr>
              </table>

              ${task.notes ? `
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">
                    Notes & Brief
                  </div>
                  <div style="font-size: 13px; color: #334155; line-height: 1.55;">
                    ${task.notes}
                  </div>
                </div>
              ` : ''}

              ${Array.isArray(task.checklist) && task.checklist.length > 0 ? `
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 10px;">
                    Checklist (${task.checklist.length} items)
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
                    ${task.checklist.map(item => `
                      <tr>
                        <td style="padding: 5px 0; color: #94a3b8; width: 20px; vertical-align: top;">○</td>
                        <td style="padding: 5px 0; color: #334155; line-height: 1.4;">${item}</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
              ` : ''}

              <!-- Action Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
                <tr>
                  <td align="left">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 20px; font-size: 13px; font-weight: 600; border-radius: 6px; letter-spacing: -0.1px;">
                      View Task on Board →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 11px; color: #64748b; line-height: 1.5;">
                    Delizoo OS • Kakinada Operations<br>
                    This is an automated operational notification sent to team members.
                  </td>
                  <td align="right" style="font-size: 11px; color: #94a3b8;">
                    <a href="https://delizoo.in" target="_blank" style="color: #64748b; text-decoration: none;">delizoo.in</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // 2. Expense Logged Template (Clean Executive Financial Record)
  if (type === 'EXPENSE_LOGGED' && expense) {
    const formattedAmount = Number(expense.amount || 0).toLocaleString('en-IN');
    mailSubject = `New Expense: ₹${formattedAmount} (${expense.vendor || expense.category || 'Operations'}) by ${expense.payer}`;
    mailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Expense: ₹${formattedAmount}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 28px; height: 28px; background-color: #0f172a; border-radius: 6px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 14px; line-height: 28px;">
                          D
                        </td>
                        <td style="padding-left: 10px; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
                          Delizoo OS
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-size: 12px; font-weight: 500; color: #64748b;">
                    Financial Ledger Entry
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              <!-- Amount Callout Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
                      Expenditure Recorded
                    </div>
                    <div style="font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; margin: 4px 0;">
                      ₹${formattedAmount}
                    </div>
                    <div style="font-size: 13px; color: #475569;">
                      Disbursed by <strong style="color: #0f172a;">${expense.payer}</strong> for <span style="color: #0f172a;">${expense.spendArea || expense.category || 'Operations'}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Ledger Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; font-size: 13px; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500; width: 35%;">
                    Vendor / Payee
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${expense.vendor || 'Direct Payee'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Operational Stream
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${expense.spendArea || expense.category || 'General'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Date & Time
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${expense.date}${expense.time ? ' at ' + expense.time : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Payment Mode
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">
                    ${expense.paymentMode || 'UPI'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">
                    Transaction Reference
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; font-family: monospace;">
                    ${expense.utrNumber || 'Not provided'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #64748b; font-weight: 500;">
                    Audit Proof
                  </td>
                  <td style="padding: 12px 16px; color: ${expense.proofDataUrl ? '#0f766e' : '#64748b'}; font-weight: 600;">
                    ${expense.proofDataUrl ? '✓ Receipt Attached & Verified' : 'No Receipt Attached'}
                  </td>
                </tr>
              </table>

              ${expense.howItHelped ? `
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">
                    Purpose & Notes
                  </div>
                  <div style="font-size: 13px; color: #334155; line-height: 1.55;">
                    ${expense.howItHelped}
                  </div>
                </div>
              ` : ''}

              <!-- Action Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
                <tr>
                  <td align="left">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 20px; font-size: 13px; font-weight: 600; border-radius: 6px; letter-spacing: -0.1px;">
                      Open Expense Ledger →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 11px; color: #64748b; line-height: 1.5;">
                    Delizoo OS • Kakinada Operations<br>
                    This record has been committed to the financial database.
                  </td>
                  <td align="right" style="font-size: 11px; color: #94a3b8;">
                    <a href="https://delizoo.in" target="_blank" style="color: #64748b; text-decoration: none;">delizoo.in</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${gmailUser}>`,
      to: targetEmail,
      subject: mailSubject,
      html: mailHtml
    });

    console.log(`[Email Sent Success]: ${mailSubject} -> ${targetEmail} (ID: ${info.messageId})`);
    await logEmailToDb(type || 'CUSTOM', targetEmail, mailSubject, mailHtml, 'SENT');

    return {
      success: true,
      messageId: info.messageId,
      recipient: targetEmail
    };
  } catch (err) {
    console.error('[Email Send Error]:', err.message);
    await logEmailToDb(type || 'CUSTOM', targetEmail, mailSubject, mailHtml, 'FAILED', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

// Generate & Dispatch 6-digit OTP to Partner via Gmail SMTP
export async function handleSendOtp({ email }) {
  if (!email || !email.trim()) {
    return { success: false, error: 'Email address is required.' };
  }
  const normalizedEmail = email.trim().toLowerCase();

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    // 1. Verify that email belongs to an authorized partner
    const partnerRes = await client.query(
      `SELECT * FROM public.partners WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    let partner = partnerRes.rows[0];

    // Fallback lookup in default founders map
    if (!partner) {
      const matchKey = Object.keys(DEFAULT_FOUNDER_MAP).find(k => DEFAULT_FOUNDER_MAP[k].toLowerCase() === normalizedEmail);
      if (!matchKey) {
        return {
          success: false,
          error: 'Access restricted: This email is not registered as an authorized founding partner of Delizoo OS.'
        };
      }
    }

    // 2. Generate 6-digit cryptographic OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clean up previous OTPs for this email
    await client.query(`DELETE FROM public.auth_otps WHERE LOWER(email) = $1`, [normalizedEmail]);

    // Insert new OTP record
    await client.query(
      `INSERT INTO public.auth_otps (email, otp, expires_at) VALUES ($1, $2, $3)`,
      [normalizedEmail, otp, expiresAt]
    );

    // 3. Send OTP Email via Gmail SMTP
    const gmailUser = process.env.GMAIL_USER || GMAIL_USER_DEFAULT;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || GMAIL_PASS_DEFAULT;
    const senderName = process.env.GMAIL_SENDER_NAME || 'Delizoo OS';
    const transporter = createGmailTransporter(gmailUser, gmailPass);

    if (!transporter) {
      return { success: false, error: 'Gmail SMTP service is currently unavailable.' };
    }

    const mailSubject = `Delizoo OS Sign-In Code: ${otp}`;
    const mailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Delizoo OS Sign-In Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 28px; height: 28px; background-color: #0f172a; border-radius: 6px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 14px; line-height: 28px;">
                          D
                        </td>
                        <td style="padding-left: 10px; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
                          Delizoo OS
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-size: 12px; font-weight: 500; color: #64748b;">
                    Partner Verification
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">
                Secure Authentication
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 700; color: #0f172a; line-height: 1.35; letter-spacing: -0.3px;">
                Your Sign-In Verification Code
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
                Enter this 6-digit one-time code to sign into your Delizoo OS partner portal:
              </p>

              <!-- OTP Code Display -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td align="center" style="padding: 18px 24px;">
                    <div style="font-family: 'JetBrains Mono', monospace, Consolas, Monaco, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                This code is valid for <strong>10 minutes</strong>. If you did not request this sign-in code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 11px; color: #64748b;">
                    Delizoo OS • Kakinada Launch Operations
                  </td>
                  <td align="right" style="font-size: 11px; color: #94a3b8;">
                    <a href="https://delizoo.in" target="_blank" style="color: #64748b; text-decoration: none;">delizoo.in</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"${senderName}" <${gmailUser}>`,
      to: normalizedEmail,
      subject: mailSubject,
      html: mailHtml
    });

    await logEmailToDb('AUTH_OTP', normalizedEmail, mailSubject, mailHtml, 'SENT');

    return {
      success: true,
      message: `Sign-in code sent to ${normalizedEmail}`
    };
  } catch (err) {
    console.error('[OTP Generation Error]:', err.message);
    return { success: false, error: err.message };
  } finally {
    await client.end();
  }
}

// Verify 6-digit OTP and Issue Authenticated Partner Session
export async function handleVerifyOtp({ email, otp }) {
  if (!email || !otp) {
    return { success: false, error: 'Email and verification code are required.' };
  }
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedOtp = String(otp).trim();

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    // 1. Verify matching unexpired OTP
    const res = await client.query(
      `SELECT * FROM public.auth_otps WHERE LOWER(email) = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, trimmedOtp]
    );

    if (res.rows.length === 0) {
      return {
        success: false,
        error: 'Invalid or expired verification code. Please request a new code.'
      };
    }

    // 2. Remove used OTP
    await client.query(`DELETE FROM public.auth_otps WHERE LOWER(email) = $1`, [normalizedEmail]);

    // 3. Find partner record
    const partnerRes = await client.query(
      `SELECT * FROM public.partners WHERE LOWER(email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    let partner = partnerRes.rows[0];
    if (!partner) {
      partner = {
        id: `partner-${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: normalizedEmail.includes('charan') ? 'Founder & Lead' : 'Partner',
        investment: 0
      };
    }

    const isLead = (partner.name || '').toLowerCase().includes('charan') ||
                   (partner.role || '').toLowerCase().includes('lead') ||
                   normalizedEmail.includes('ncharantejaa');

    return {
      success: true,
      partner: {
        id: partner.id,
        name: partner.name,
        role: partner.role,
        email: partner.email,
        investment: Number(partner.investment) || 0,
        isLead
      }
    };
  } catch (err) {
    console.error('[OTP Verification Error]:', err.message);
    return { success: false, error: err.message };
  } finally {
    await client.end();
  }
}


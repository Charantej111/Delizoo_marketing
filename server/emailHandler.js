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

export async function handleSendEmail(reqBody) {
  const { type, recipient, subject, html, task, expense, config } = reqBody;

  const gmailUser = config?.user || process.env.GMAIL_USER;
  const gmailPass = config?.pass || process.env.GMAIL_APP_PASSWORD;
  const senderName = config?.senderName || process.env.GMAIL_SENDER_NAME || 'Delizoo Kakinada';

  if (!gmailUser || !gmailPass) {
    const msg = 'Gmail SMTP credentials (GMAIL_USER / GMAIL_APP_PASSWORD) not configured yet in .env';
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

  // 1. Task Assigned Template
  if (type === 'TASK_ASSIGNED' && task) {
    mailSubject = `[Delizoo Tasks] New Milestone Assigned: "${task.title}"`;
    mailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; padding: 24px; color: #18181b;">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #09090b; font-size: 20px; font-weight: 800;">DELIZOO OPERATIONS — TASK ASSIGNMENT</h2>
          <p style="margin: 4px 0 0 0; color: #71717a; font-size: 13px;">Kakinada Operations & Marketing Blitz</p>
        </div>

        <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Task Title</div>
          <div style="font-size: 16px; font-weight: 800; color: #09090b;">${task.title}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600; width: 35%;">Assigned To:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700;">${task.assignee || 'Unassigned'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Operational Stream:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700;">${task.spendArea || 'General'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Priority:</td>
            <td style="padding: 8px 0; color: ${task.priority === 'Urgent' ? '#e11d48' : '#09090b'}; font-weight: 800;">${task.priority || 'Normal'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Due Date:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700;">${task.dueDate || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Current Progress:</td>
            <td style="padding: 8px 0; color: #10b981; font-weight: 800;">${task.progress || 0}% Completed</td>
          </tr>
        </table>

        ${task.notes ? `
          <div style="background: #fafafa; border-left: 3px solid #10b981; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Instructions & Notes</div>
            <div style="font-size: 13px; color: #27272a; line-height: 1.5;">${task.notes}</div>
          </div>
        ` : ''}

        ${Array.isArray(task.checklist) && task.checklist.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 8px;">Sub-Tasks Checklist:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #27272a;">
              ${task.checklist.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e4e4e7;">
          <a href="http://localhost:3000" style="display: inline-block; background: #09090b; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 700; border-radius: 10px;">
            Open Delizoo Task Board →
          </a>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 12px;">Delizoo Kakinada Automated Milestone Dispatcher</p>
        </div>
      </div>
    `;
  }

  // 2. Expense Logged Template
  if (type === 'EXPENSE_LOGGED' && expense) {
    const formattedAmount = Number(expense.amount || 0).toLocaleString('en-IN');
    mailSubject = `[Delizoo Ledger] New Expense Logged: ₹${formattedAmount} by ${expense.payer}`;
    mailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; padding: 24px; color: #18181b;">
        <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #09090b; font-size: 20px; font-weight: 800;">DELIZOO LEDGER — EXPENDITURE RECORDED</h2>
          <p style="margin: 4px 0 0 0; color: #71717a; font-size: 13px;">Real-Time Financial Audit & Proof Dispatch</p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase;">Amount Disbursed</div>
          <div style="font-size: 32px; font-weight: 900; color: #166534; font-family: monospace; margin: 6px 0;">₹${formattedAmount}</div>
          <div style="font-size: 12px; font-weight: 600; color: #15803d;">Paid by: <strong>${expense.payer}</strong></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600; width: 35%;">Spend Area:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700;">${expense.spendArea || expense.category || 'General'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Vendor / Payee:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700;">${expense.vendor || 'Direct Payee'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Payment Mode:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700;">${expense.paymentMode || 'UPI'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">UTR / Transaction Ref:</td>
            <td style="padding: 8px 0; color: #09090b; font-weight: 700; font-family: monospace;">${expense.utrNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-weight: 600;">Receipt Attached:</td>
            <td style="padding: 8px 0; color: ${expense.proofDataUrl ? '#16a34a' : '#71717a'}; font-weight: 700;">${expense.proofDataUrl ? 'YES (Verified In Dashboard)' : 'NO'}</td>
          </tr>
        </table>

        ${expense.howItHelped ? `
          <div style="background: #fafafa; border-left: 3px solid #06b6d4; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 4px;">Impact & ROI Notes</div>
            <div style="font-size: 13px; color: #27272a; line-height: 1.5;">${expense.howItHelped}</div>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e4e4e7;">
          <a href="http://localhost:3000" style="display: inline-block; background: #09090b; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: 700; border-radius: 10px;">
            Review in Delizoo Ledger →
          </a>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 12px;">Delizoo Kakinada Automated Capital Audit</p>
        </div>
      </div>
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

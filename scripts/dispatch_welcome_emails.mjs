import nodemailer from 'nodemailer';

const founders = [
  { name: 'N Charan Tej', email: 'ncharantejaa@gmail.com', password: 'Charan@delizoo' },
  { name: 'G Pavan', email: 'dev.pavangollapalli@gmail.com', password: 'Pavan@delizoo' },
  { name: 'M Nareen', email: 'mangamnareenkumar@gmail.com', password: 'Nareen@delizoo' },
  { name: 'Dheeraj', email: 'dheerajbathi@gmail.com', password: 'Dheeraj@delizoo' },
  { name: 'G Sunil', email: 'dev.sunilgarbana@gmail.com', password: 'Sunil@delizoo' },
  { name: 'J Sandeep', email: 'jakkasandeep9@gmail.com', password: 'Sandeep@delizoo' }
];

const GMAIL_USER = 'pmcareeros@gmail.com';
const GMAIL_PASS = 'jtmemfcjgumleyrk';
const SENDER_NAME = 'Delizoo Operations';
const APP_URL = 'https://delizoo-os.vercel.app';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER.trim(),
      pass: GMAIL_PASS.trim().replace(/\s+/g, '')
    }
  });
}

function generateWelcomeHtml(founder) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Delizoo OS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 32px; height: 32px; vertical-align: middle;">
                          <img src="${APP_URL}/logo.png" alt="Delizoo Logo" width="32" height="32" style="display: block; border-radius: 8px; width: 32px; height: 32px; object-fit: contain;" />
                        </td>
                        <td style="padding-left: 12px; font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">
                          Delizoo OS
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="font-size: 11px; font-weight: 600; color: #f97316; letter-spacing: 0.5px; text-transform: uppercase;">
                    Private Founder Access
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 8px;">
                Kakinada Launch Operations
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.4px;">
                Welcome to Delizoo OS, ${founder.name}!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                You are officially invited to <strong>Delizoo OS</strong>—our unified operations and launch command center built exclusively for the 6 co-founders to stay in lockstep throughout our Kakinada city rollout.
              </p>

              <!-- Uses of Delizoo OS -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 22px; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
                  What you can do on Delizoo OS
                </div>
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.55; color: #334155;">
                  <tr>
                    <td style="vertical-align: top; width: 20px; font-weight: 700; color: #f97316; padding-bottom: 12px;">•</td>
                    <td style="padding-bottom: 12px;">
                      <strong style="color: #0f172a;">Live Capital & Spends Ledger:</strong> Log any launch expenditure (marketing, printing, fleet, ops) in 30 seconds with UTR reference and receipt uploads.
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top; width: 20px; font-weight: 700; color: #f97316; padding-bottom: 12px;">•</td>
                    <td style="padding-bottom: 12px;">
                      <strong style="color: #0f172a;">Operations Kanban Board:</strong> Organize and track daily launch deliverables across <em>To Do</em>, <em>In Progress</em>, and <em>Done</em> with due dates.
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top; width: 20px; font-weight: 700; color: #f97316; padding-bottom: 12px;">•</td>
                    <td style="padding-bottom: 12px;">
                      <strong style="color: #0f172a;">Automated Team Sync:</strong> Receive instant alerts whenever expenditures are committed or tasks are assigned to you.
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top; width: 20px; font-weight: 700; color: #f97316;">•</td>
                    <td>
                      <strong style="color: #0f172a;">Founder Analytics:</strong> High-level executive dashboards showing launch runway, expense breakdown, and execution velocity.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Login Credentials Box -->
              <div style="border: 1px solid #fed7aa; background-color: #fffbeb; border-radius: 10px; padding: 22px; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #9a3412; margin-bottom: 14px;">
                  Your Sign-In Credentials
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #78350f; font-weight: 500; width: 38%;">Registered Email:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${founder.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #78350f; font-weight: 500;">Initial Password:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${founder.password}</td>
                  </tr>
                </table>

                <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #fed7aa; font-size: 12px; color: #9a3412; line-height: 1.5;">
                  * <em>No account creation needed. Sign in with these credentials. You can change your password anytime using the <strong>Forgot / Change Password?</strong> link on the login page.</em>
                </div>
              </div>

              <!-- Button CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 13px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; letter-spacing: -0.1px; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);">
                      Access Delizoo OS →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                Direct link: <a href="${APP_URL}" target="_blank" style="color: #ea580c; text-decoration: none;">${APP_URL}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 11px; color: #64748b; line-height: 1.5;">
                    Delizoo OS • Kakinada Launch Operations<br>
                    Private & Confidential • Co-Founders Only
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

async function dispatchAll() {
  const transporter = createTransporter();
  console.log(`Starting dispatch of ${founders.length} welcome emails...`);

  for (const founder of founders) {
    try {
      console.log(`Sending to ${founder.name} (${founder.email})...`);
      const info = await transporter.sendMail({
        from: `"${SENDER_NAME}" <${GMAIL_USER}>`,
        to: founder.email,
        subject: `Welcome to Delizoo OS — Your Founder Access & Login Credentials`,
        html: generateWelcomeHtml(founder)
      });
      console.log(`✓ Sent to ${founder.name} (${founder.email}) - Message ID: ${info.messageId}`);
    } catch (err) {
      console.error(`✗ Failed to send to ${founder.email}:`, err.message);
    }
  }

  console.log('Dispatch process completed!');
}

dispatchAll().catch(e => {
  console.error('Fatal dispatch error:', e);
  process.exit(1);
});

import { supabase } from './supabase';
import { normalizePayerName, DEFAULT_PARTNERS } from './storage';

export const emailService = {
  // Send email via local Vite backend endpoint
  async sendEmail(payload) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('[Email Dispatch Error]:', err);
      return { success: false, error: err.message };
    }
  },

  // Notify assigned founder/partner when a task is assigned to them
  async sendTaskAssignedAlert(task, partners = []) {
    if (!task || !task.assignee) return;

    const partnerList = (partners && partners.length > 0) ? partners : DEFAULT_PARTNERS;
    const canonicalName = normalizePayerName(task.assignee, partnerList);

    // Find the assigned partner's email if available
    const assignedPartner = partnerList.find(p => 
      (canonicalName && p.name?.toLowerCase() === canonicalName.toLowerCase()) ||
      p.name?.toLowerCase() === task.assignee.toLowerCase() ||
      p.name?.toLowerCase().includes(task.assignee.toLowerCase()) ||
      task.assignee.toLowerCase().includes(p.name?.toLowerCase())
    );

    const recipientEmail = assignedPartner?.email || '';

    // If no email configured for this partner, we can still notify lead founder or skip
    if (!recipientEmail) {
      console.log(`[Email Notice]: No email address assigned for partner "${task.assignee}". Skipping email.`);
      return { success: false, skipped: true, reason: `No email registered for ${task.assignee}` };
    }

    return await this.sendEmail({
      type: 'TASK_ASSIGNED',
      recipient: recipientEmail,
      task
    });
  },

  // Notify all founders when a new expenditure is recorded in the ledger
  async sendExpenseLoggedAlert(expense, partners = []) {
    if (!expense) return;

    const partnerList = (partners && partners.length > 0) ? partners : DEFAULT_PARTNERS;

    // Gather all founder emails that exist
    const recipientEmails = [
      ...new Set(
        partnerList
          .map(p => p.email?.trim())
          .filter(Boolean)
      )
    ];

    if (recipientEmails.length === 0) {
      console.log('[Email Notice]: No founder email addresses found in partners list. Skipping expense notification.');
      return { success: false, skipped: true, reason: 'No founder emails registered' };
    }

    // Send notification to founders
    return await this.sendEmail({
      type: 'EXPENSE_LOGGED',
      recipient: recipientEmails.join(', '),
      expense
    });
  },

  // Test email delivery
  async sendTestEmail(recipientEmail) {
    return await this.sendEmail({
      type: 'CUSTOM',
      recipient: recipientEmail,
      subject: '[Delizoo Alert] Gmail SMTP Test Verification',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 12px;">
          <h2 style="color: #10b981; margin: 0 0 10px;">Delizoo Gmail SMTP Connected!</h2>
          <p style="color: #374151;">Your Gmail SMTP backend service is successfully connected to Delizoo Marketing & Operations Tracker.</p>
          <p style="color: #6b7280; font-size: 12px;">Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
  },

  // Fetch email audit logs from Supabase
  async getEmailLogs() {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[Error fetching email logs]:', err);
      return [];
    }
  }
};

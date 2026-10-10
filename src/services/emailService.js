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
    let assignedPartner = partnerList.find(p => 
      (canonicalName && p.name?.toLowerCase() === canonicalName.toLowerCase()) ||
      p.name?.toLowerCase() === task.assignee.toLowerCase() ||
      p.name?.toLowerCase().includes(task.assignee.toLowerCase()) ||
      task.assignee.toLowerCase().includes(p.name?.toLowerCase())
    );

    let recipientEmail = assignedPartner?.email?.trim() || '';
    if (!recipientEmail) {
      const def = DEFAULT_PARTNERS.find(dp => 
        (canonicalName && dp.name?.toLowerCase() === canonicalName.toLowerCase()) ||
        dp.name?.toLowerCase() === task.assignee.toLowerCase() ||
        task.assignee.toLowerCase().includes(dp.name?.toLowerCase())
      );
      recipientEmail = def?.email?.trim() || '';
    }

    // If no email configured for this partner, skip
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

    // Gather all founder emails that exist with robust fallback
    const recipientEmails = [
      ...new Set(
        partnerList
          .map(p => {
            if (p.email && p.email.trim()) return p.email.trim();
            const canonical = normalizePayerName(p.name, DEFAULT_PARTNERS);
            const def = DEFAULT_PARTNERS.find(dp => dp.name === canonical || dp.name.toLowerCase() === (p.name || '').toLowerCase());
            return def?.email?.trim();
          })
          .filter(Boolean)
      )
    ];

    const finalRecipients = recipientEmails.length > 0
      ? recipientEmails
      : DEFAULT_PARTNERS.map(p => p.email).filter(Boolean);

    if (finalRecipients.length === 0) {
      console.warn('[Email Notice]: No founder email addresses found. Skipping expense notification.');
      return { success: false, skipped: true, reason: 'No founder emails registered' };
    }

    // Prepare safe expense payload so large PDF or image proofs don't cause HTTP 413 Payload Too Large
    const safeExpense = {
      id: expense.id,
      amount: expense.amount,
      date: expense.date,
      time: expense.time || '',
      payer: expense.payer,
      spendArea: expense.spendArea || expense.category || 'General',
      category: expense.category || 'General',
      vendor: expense.vendor || '',
      paymentMode: expense.paymentMode || 'UPI',
      utrNumber: expense.utrNumber || '',
      howItHelped: expense.howItHelped || '',
      proofName: expense.proofName || null,
      proofType: expense.proofType || '',
      hasProof: !!expense.proofDataUrl,
      // If proofDataUrl is within safe attachment limits (< 2.5MB), include it so emailHandler can attach to email
      proofDataUrl: (expense.proofDataUrl && expense.proofDataUrl.length < 2.5 * 1024 * 1024)
        ? expense.proofDataUrl
        : null
    };

    // Send notification to founders
    return await this.sendEmail({
      type: 'EXPENSE_LOGGED',
      recipient: finalRecipients.join(', '),
      expense: safeExpense
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

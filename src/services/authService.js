// Role-Based Auth Service for Delizoo OS
// 6-digit OTP Authentication via Gmail SMTP & Role Permissions
import { normalizePayerName, DEFAULT_PARTNERS } from './storage';

const AUTH_STORAGE_KEY = 'delizoo_auth_session';

export const authService = {
  // Request 6-digit OTP to be sent via Gmail SMTP
  async sendOtp(email) {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Auth Send OTP Error]:', err);
      return { success: false, error: err.message };
    }
  },

  // Verify 6-digit OTP and establish session
  async verifyOtp(email, otp) {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.partner) {
        this.saveSession(data.partner);
      }
      return data;
    } catch (err) {
      console.error('[Auth Verify OTP Error]:', err);
      return { success: false, error: err.message };
    }
  },

  // Direct login helper (e.g., for switching/persisting partner session)
  saveSession(partner) {
    const isLead = (partner.name || '').toLowerCase().includes('charan') ||
                   (partner.role || '').toLowerCase().includes('lead') ||
                   (partner.email || '').toLowerCase().includes('ncharantejaa');

    const sessionUser = {
      ...partner,
      isLead
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  // Retrieve currently logged-in partner
  getCurrentUser(partners = DEFAULT_PARTNERS) {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Cross-verify with latest partners array if available
        const match = partners.find(p =>
          (p.email && parsed.email && p.email.toLowerCase() === parsed.email.toLowerCase()) ||
          p.name.toLowerCase() === parsed.name.toLowerCase()
        );
        if (match) {
          const isLead = match.name.toLowerCase().includes('charan') ||
                         match.role.toLowerCase().includes('lead') ||
                         (match.email && match.email.toLowerCase().includes('ncharantejaa'));
          return {
            ...match,
            isLead
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('[Error reading auth session]:', e);
    }
    // Default initial user for seamless first load (Charan Tej as Lead)
    return null;
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Permission Check: Can update this specific task's progress and status
  canUpdateTask(task, user, partners = DEFAULT_PARTNERS) {
    if (!user) return false;
    if (user.isLead) return true; // Lead founder has universal write authority

    if (!task || !task.assignee) return true; // Unassigned tasks can be claimed

    const normAssignee = normalizePayerName(task.assignee, partners).toLowerCase();
    const normUser = normalizePayerName(user.name, partners).toLowerCase();

    return normAssignee === normUser || task.assignee.toLowerCase().includes(user.name.toLowerCase());
  },

  // Permission Check: Can adjust capital pool allocations
  canManageCapital(user) {
    if (!user) return false;
    return !!user.isLead;
  }
};

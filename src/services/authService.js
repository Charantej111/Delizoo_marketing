// Role-Based Auth Service for Delizoo OS
// Direct Secured OTP verification & Founder Authorization
import { supabase } from './supabase';
import { normalizePayerName, DEFAULT_PARTNERS } from './storage';

const AUTH_STORAGE_KEY = 'delizoo_auth_session';

// The 6 verified Delizoo co-founders authorized for private OS access
export const AUTHORIZED_FOUNDERS = [
  { name: 'N Charan Tej', email: 'ncharantejaa@gmail.com', role: 'Founder & Product Lead', isLead: true, investment: 20000, color: '#10b981' },
  { name: 'G Pavan', email: 'dev.pavangollapalli@gmail.com', role: 'Founder / Tech Lead', isLead: false, investment: 50000, color: '#06b6d4' },
  { name: 'M Nareen', email: 'mangamnareenkumar@gmail.com', role: 'Founder / Devops', isLead: false, investment: 50000, color: '#f59e0b' },
  { name: 'Dheeraj', email: 'dheerajbathi@gmail.com', role: 'Founder/ Associate', isLead: false, investment: 20000, color: '#3b82f6' },
  { name: 'G Sunil', email: 'dev.sunilgarbana@gmail.com', role: 'Founder/ Tech', isLead: false, investment: 10000, color: '#8b5cf6' },
  { name: 'J Sandeep', email: 'jakkasandeep9@gmail.com', role: 'Founder / Support', isLead: false, investment: 10000, color: '#ec4899' }
];

export const authService = {
  // Check if given email belongs to one of the 6 co-founders
  isFounderEmail(email, partners = []) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const partnerList = (partners && partners.length > 0) ? partners : DEFAULT_PARTNERS;
    return (
      partnerList.some(p => p.email && p.email.trim().toLowerCase() === cleanEmail) ||
      AUTHORIZED_FOUNDERS.some(f => f.email.toLowerCase() === cleanEmail)
    );
  },

  // Retrieve partner / founder details by email
  getFounderByEmail(email, partners = []) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const partnerList = (partners && partners.length > 0) ? partners : DEFAULT_PARTNERS;
    const found = partnerList.find(p => p.email && p.email.trim().toLowerCase() === cleanEmail);
    if (found) {
      const isLead = (found.name || '').toLowerCase().includes('charan') ||
        (found.role || '').toLowerCase().includes('lead') ||
        (found.email && found.email.toLowerCase().includes('ncharantejaa'));
      return { ...found, isLead };
    }
    return AUTHORIZED_FOUNDERS.find(f => f.email.toLowerCase() === cleanEmail) || null;
  },

  // Send OTP directly from Supabase to given email if matched with founders
  async sendOtp(email, partners = []) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email address is required.' };
    }

    // Step 1: Match with founders email
    const founder = this.getFounderByEmail(cleanEmail, partners);
    if (!founder) {
      return {
        success: false,
        notEligible: true,
        error: 'This is a private OS, not eligible for login.'
      };
    }

    // Step 2: Send OTP directly from Supabase
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'https://delizoo-os.vercel.app/'
        }
      });

      if (error) {
        console.error('[Supabase signInWithOtp Error]:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        founder,
        message: `Confirmation code sent from Supabase to ${cleanEmail}`
      };
    } catch (err) {
      console.error('[Supabase signInWithOtp Exception]:', err);
      return { success: false, error: err.message || 'Failed to dispatch OTP from Supabase.' };
    }
  },

  // Confirm account / verify 6-digit OTP directly with Supabase
  async verifyOtp(email, otp, partners = []) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return { success: false, error: 'Email and verification code are required.' };
    }

    // Verify founder eligibility
    const founder = this.getFounderByEmail(cleanEmail, partners);
    if (!founder) {
      return {
        success: false,
        notEligible: true,
        error: 'This is a private OS, not eligible for login.'
      };
    }

    try {
      // 1. Verify via Secured email OTP
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email'
      });

      // 2. Fallback check for initial signup verification token
      if (error && (error.message.toLowerCase().includes('signup') || error.message.toLowerCase().includes('type'))) {
        const signupRetry = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: 'signup'
        });
        if (!signupRetry.error) {
          data = signupRetry.data;
          error = null;
        }
      }

      if (error) {
        console.error('[Supabase verifyOtp Error]:', error);
        return {
          success: false,
          error: error.message || 'Invalid or expired confirmation code.'
        };
      }

      // Establish verified founder session
      const sessionUser = this.saveSession(founder, data?.session);
      return {
        success: true,
        partner: sessionUser,
        session: data?.session
      };
    } catch (err) {
      console.error('[Supabase verifyOtp Exception]:', err);
      return { success: false, error: err.message || 'Verification failed.' };
    }
  },

  // Listen for Secured state transitions (e.g. magic link click from email)
  initAuthStateListener(onUserAuthenticated) {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
          const email = session.user.email.toLowerCase();
          const founder = this.getFounderByEmail(email);
          if (founder) {
            const user = this.saveSession(founder, session);
            if (onUserAuthenticated) {
              onUserAuthenticated(user);
            }
          }
        }
      });
      return subscription;
    } catch (e) {
      console.error('[Error initAuthStateListener]:', e);
      return null;
    }
  },

  // Save session to localStorage
  saveSession(partner, supabaseSession = null) {
    const isLead = (partner.name || '').toLowerCase().includes('charan') ||
      (partner.role || '').toLowerCase().includes('lead') ||
      (partner.email || '').toLowerCase().includes('ncharantejaa');

    const sessionUser = {
      ...partner,
      isLead,
      confirmed: true,
      supabaseSession: supabaseSession ? {
        access_token: supabaseSession.access_token,
        expires_at: supabaseSession.expires_at,
        user_id: supabaseSession.user?.id
      } : undefined
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
            isLead,
            confirmed: true
          };
        }
        return parsed;
      }
    } catch (e) {
      console.error('[Error reading auth session]:', e);
    }
    return null;
  },

  async logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
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

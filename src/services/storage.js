// Supabase Cloud & Local Device Storage Service for Delizoo Tracker
// 100% Dynamic, 0% Mock Data, Real-time PostgreSQL Sync
import { supabase } from './supabase';

export const DEFAULT_PARTNERS = [
  { id: 'partner-1', name: 'N Charan Tej', role: 'Founder & Lead', email: 'ncharantejaa@gmail.com', investment: 20000, color: '#10b981' },
  { id: 'partner-2', name: 'G Pavan', role: 'Partner / Ops', email: 'dev.pavangollapalli@gmail.com', investment: 50000, color: '#06b6d4' },
  { id: 'partner-3', name: 'G Sunil', role: 'Partner / Growth', email: 'dev.sunilgarbana@gmail.com', investment: 10000, color: '#8b5cf6' },
  { id: 'partner-4', name: 'M Nareen', role: 'Partner / Marketing', email: 'mangamnareenkumar@gmail.com', investment: 50000, color: '#f59e0b' },
  { id: 'partner-5', name: 'J Sandeep', role: 'Partner / Tech', email: 'jakkasandeep9@gmail.com', investment: 10000, color: '#ec4899' },
  { id: 'partner-6', name: 'Dheeraj', role: 'Partner / Strategy', email: 'dheerajbathi@gmail.com', investment: 20000, color: '#3b82f6' }
];

export const DEFAULT_SPEND_AREAS = [
  'Digital Ads & Marketing',
  'Visiting Cards & Printing',
  'Rider Fleet & Delivery Kits',
  'Packaging & Restaurant Ops',
  'Tech & Infrastructure',
  'Fuel & Logistics',
  'Food Sampling & Promotions',
  'Office & Operations'
];

export const SPEND_AREAS = DEFAULT_SPEND_AREAS;
export const POPULAR_CATEGORIES = DEFAULT_SPEND_AREAS.map(area => ({ label: area }));

const STORAGE_KEYS = {
  PROJECTS: 'delizoo_user_projects',
  TASKS: 'delizoo_user_tasks',
  EXPENSES: 'delizoo_user_expenses',
  PARTNERS: 'delizoo_user_partners',
  SPEND_AREAS: 'delizoo_user_spend_areas'
};

/**
 * Normalizes any short / alias names (e.g. "Charan", "Sunil", "Pavan")
 * to the exact canonical partner name ("N Charan Tej", "G Sunil", etc.)
 */
export function normalizePayerName(rawName, partners = DEFAULT_PARTNERS) {
  if (!rawName || typeof rawName !== 'string') return '';
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct Alias Table
  if (
    lower === 'charan' ||
    lower === 'charantej' ||
    lower === 'charan tej' ||
    lower === 'n charan tej' ||
    lower === 'n charan' ||
    lower === 'n. charan tej' ||
    lower === 'n. charan'
  ) {
    return 'N Charan Tej';
  }

  if (
    lower === 'pavan' ||
    lower === 'g pavan' ||
    lower === 'g. pavan' ||
    lower === 'pavan kumar' ||
    lower === 'pavankumar'
  ) {
    return 'G Pavan';
  }

  if (
    lower === 'sunil' ||
    lower === 'g sunil' ||
    lower === 'g. sunil' ||
    lower === 'sunil kumar' ||
    lower === 'sunilkumar'
  ) {
    return 'G Sunil';
  }

  if (
    lower === 'nareen' ||
    lower === 'm nareen' ||
    lower === 'm. nareen' ||
    lower === 'naveen' ||
    lower === 'm naveen' ||
    lower === 'm. naveen'
  ) {
    return 'M Nareen';
  }

  if (
    lower === 'sandeep' ||
    lower === 'j sandeep' ||
    lower === 'j. sandeep' ||
    lower === 'sandeep kumar'
  ) {
    return 'J Sandeep';
  }

  if (
    lower === 'dheeraj' ||
    lower === 'dhiraj' ||
    lower === 'dheeraj bathi' ||
    lower === 'dheeraj b'
  ) {
    return 'Dheeraj';
  }

  // 2. Search against current partner list
  for (const p of partners) {
    const pLower = p.name.toLowerCase();
    if (pLower === lower) return p.name;
    const words = pLower.split(/\s+/).filter(w => w.length > 2);
    if (words.includes(lower)) {
      return p.name;
    }
  }

  return trimmed;
}

export const storageService = {
  // Load local cached records immediately for fast startup
  loadAllData() {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const rawTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || 'null');
      let rawExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      let rawPartners = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTNERS) || 'null');
      let partners = DEFAULT_PARTNERS;

      if (rawPartners && Array.isArray(rawPartners) && rawPartners.length > 0) {
        const seenNames = new Set();
        const cleaned = [];

        rawPartners.forEach(p => {
          if (!p || !p.name) return;
          const trimmedName = p.name.trim();
          const canonicalName = normalizePayerName(p.name, DEFAULT_PARTNERS);
          if (!seenNames.has(canonicalName)) {
            seenNames.add(canonicalName);
            const defaultMatch = DEFAULT_PARTNERS.find(dp => dp.name === canonicalName);
            let parsedInvestment = 50000;
            if (p.investment !== undefined && p.investment !== null && p.investment !== '') {
              const n = Number(p.investment);
              if (!isNaN(n)) parsedInvestment = n;
            } else if (defaultMatch) {
              parsedInvestment = defaultMatch.investment;
            }

            cleaned.push({
              id: p.id || defaultMatch?.id || `partner-${cleaned.length + 1}`,
              name: canonicalName,
              role: p.role || defaultMatch?.role || 'Partner',
              email: p.email || defaultMatch?.email || '',
              investment: parsedInvestment,
              color: p.color || defaultMatch?.color || '#10b981'
            });
          }
        });

        partners = cleaned.length > 0 ? cleaned : DEFAULT_PARTNERS;
      }

      // Load tasks
      let tasks = [];
      if (rawTasks && Array.isArray(rawTasks)) {
        tasks = rawTasks.map(t => {
          let prog = t.progress;
          if (prog === undefined || prog === null) {
            if (t.status === 'Completed' || t.completed) prog = 100;
            else if (Array.isArray(t.checklist) && t.checklist.length > 0) {
              const compCount = Array.isArray(t.completedItems) ? t.completedItems.length : 0;
              prog = Math.round((compCount / t.checklist.length) * 100);
            } else if (t.status === 'In Progress') prog = 50;
            else if (t.status === 'In Review') prog = 80;
            else prog = 0;
          }
          return {
            ...t,
            progress: Math.min(100, Math.max(0, Number(prog) || 0)),
            assignee: t.assignee || ''
          };
        });
      }

      // Normalize expenses
      const expenses = rawExpenses.map(e => ({
        ...e,
        payer: normalizePayerName(e.payer, partners) || e.payer
      }));

      // Load spend areas
      let rawSpendAreas = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPEND_AREAS) || 'null');
      const spendAreasSet = new Set(DEFAULT_SPEND_AREAS);

      if (Array.isArray(rawSpendAreas)) {
        rawSpendAreas.forEach(a => {
          if (typeof a === 'string' && a.trim()) spendAreasSet.add(a.trim());
        });
      }

      rawExpenses.forEach(e => {
        if (e.spendArea?.trim()) spendAreasSet.add(e.spendArea.trim());
        if (e.category?.trim()) spendAreasSet.add(e.category.trim());
      });

      tasks.forEach(t => {
        if (t.spendArea?.trim()) spendAreasSet.add(t.spendArea.trim());
      });

      const spendAreas = Array.from(spendAreasSet);

      return { projects, tasks, expenses, partners, spendAreas };
    } catch (e) {
      console.error('Failed to parse local device storage data:', e);
      return { projects: [], tasks: [], expenses: [], partners: DEFAULT_PARTNERS, spendAreas: DEFAULT_SPEND_AREAS };
    }
  },

  // Full 2-Way Sync with Supabase Database
  async syncWithSupabase(onDataUpdated) {
    try {
      console.log('[Supabase Sync]: Fetching tables from Supabase...');

      const [partnersRes, tasksRes, expensesRes, spendAreasRes] = await Promise.all([
        supabase.from('partners').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('spend_areas').select('*').order('created_at', { ascending: true })
      ]);

      const localData = this.loadAllData();

      const dbPartners = partnersRes.data || [];
      const dbTasks = tasksRes.data || [];
      const dbExpenses = expensesRes.data || [];
      const dbSpendAreas = spendAreasRes.data || [];

      console.log(`[Supabase DB Counts] Partners: ${dbPartners.length}, Tasks: ${dbTasks.length}, Expenses: ${dbExpenses.length}`);

      // If Supabase is completely empty but local storage has existing data, auto-migrate to Supabase!
      const isDbEmpty = dbPartners.length === 0 && dbTasks.length === 0 && dbExpenses.length === 0;

      if (isDbEmpty && (localData.expenses.length > 0 || localData.tasks.length > 0)) {
        console.log('[Supabase Migration]: Pushing existing local records to Supabase...');
        await this.pushLocalDataToSupabase(localData);
        return localData;
      }

      // If Supabase has data, use Supabase as the source of truth
      let finalPartners = localData.partners;
      if (dbPartners.length > 0) {
        finalPartners = dbPartners.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
          email: p.email || '',
          investment: typeof p.investment === 'number' ? p.investment : (Number(p.investment) || 0),
          color: p.color || '#10b981'
        }));
        this.savePartners(finalPartners, false);
      } else {
        // Seed default partners into Supabase
        await this.pushPartnersToSupabase(DEFAULT_PARTNERS);
      }

      let finalTasks = localData.tasks;
      if (dbTasks.length > 0) {
        const dbTasksMapped = dbTasks.map(t => ({
          id: t.id,
          title: t.title,
          spendArea: t.spend_area,
          priority: t.priority,
          assignee: t.assignee,
          dueDate: t.due_date,
          status: t.status,
          progress: Number(t.progress) || 0,
          completed: t.completed,
          checklist: Array.isArray(t.checklist) ? t.checklist : [],
          completedItems: Array.isArray(t.completed_items) ? t.completed_items : [],
          notes: t.notes || ''
        }));

        // Preserve any local existing tasks that haven't synced to DB yet
        const dbTaskIds = new Set(dbTasksMapped.map(t => t.id));
        const localOnlyTasks = localData.tasks.filter(t => !dbTaskIds.has(t.id));
        if (localOnlyTasks.length > 0) {
          console.log(`[Supabase Sync]: Found ${localOnlyTasks.length} existing local tasks. Syncing to DB...`);
          for (const lt of localOnlyTasks) {
            this.saveTaskItem(lt);
          }
        }

        finalTasks = [...dbTasksMapped, ...localOnlyTasks];
        this.saveTasks(finalTasks, false);
      } else if (localData.tasks.length > 0) {
        // If DB has no tasks yet but local has existing tasks, push them to Supabase
        console.log(`[Supabase Sync]: Pushing ${localData.tasks.length} existing local tasks to Supabase...`);
        for (const lt of localData.tasks) {
          this.saveTaskItem(lt);
        }
      }

      let finalExpenses = localData.expenses;
      if (dbExpenses.length > 0) {
        const dbExpensesMapped = dbExpenses.map(e => ({
          id: e.id,
          amount: Number(e.amount) || 0,
          date: e.date,
          time: e.time || '',
          payer: e.payer,
          spendArea: e.spend_area,
          category: e.category,
          vendor: e.vendor || '',
          paymentMode: e.payment_mode || 'UPI',
          utrNumber: e.utr_number || '',
          howItHelped: e.how_it_helped || '',
          proofDataUrl: e.proof_data_url || null,
          proofName: e.proof_name || null
        }));

        // Preserve any local existing expenses that haven't synced to DB yet
        const dbExpIds = new Set(dbExpensesMapped.map(e => e.id));
        const localOnlyExpenses = localData.expenses.filter(e => !dbExpIds.has(e.id));
        if (localOnlyExpenses.length > 0) {
          console.log(`[Supabase Sync]: Found ${localOnlyExpenses.length} existing local expenses. Syncing to DB...`);
          for (const le of localOnlyExpenses) {
            this.saveExpenseItem(le);
          }
        }

        finalExpenses = [...dbExpensesMapped, ...localOnlyExpenses];
        this.saveExpenses(finalExpenses, false);
      } else if (localData.expenses.length > 0) {
        // If DB has no expenses yet but local has existing expenses, push them to Supabase
        console.log(`[Supabase Sync]: Pushing ${localData.expenses.length} existing local expenses to Supabase...`);
        for (const le of localData.expenses) {
          this.saveExpenseItem(le);
        }
      }

      const spendAreasSet = new Set(DEFAULT_SPEND_AREAS);
      dbSpendAreas.forEach(a => { if (a.name) spendAreasSet.add(a.name); });
      const finalSpendAreas = Array.from(spendAreasSet);
      this.saveSpendAreas(finalSpendAreas, false);

      const merged = {
        projects: localData.projects,
        tasks: finalTasks,
        expenses: finalExpenses,
        partners: finalPartners,
        spendAreas: finalSpendAreas
      };

      if (onDataUpdated) {
        onDataUpdated(merged);
      }

      return merged;
    } catch (err) {
      console.error('[Supabase Sync Failed, using local cache]:', err);
      return this.loadAllData();
    }
  },

  // Initial migration helper: pushes local existing user records to Supabase
  async pushLocalDataToSupabase(data) {
    try {
      if (data.partners && data.partners.length > 0) {
        await this.pushPartnersToSupabase(data.partners);
      }
      if (data.spendAreas && data.spendAreas.length > 0) {
        const areasPayload = data.spendAreas.map(name => ({ name }));
        await supabase.from('spend_areas').upsert(areasPayload, { onConflict: 'name' });
      }
      if (data.tasks && data.tasks.length > 0) {
        const tasksPayload = data.tasks.map(t => ({
          id: t.id,
          title: t.title,
          spend_area: t.spendArea || 'General Operations',
          priority: t.priority || 'High',
          assignee: t.assignee || '',
          due_date: t.dueDate || '',
          status: t.status || 'To Do',
          progress: Number(t.progress) || 0,
          completed: !!t.completed,
          checklist: t.checklist || [],
          completed_items: t.completedItems || [],
          notes: t.notes || ''
        }));
        await supabase.from('tasks').upsert(tasksPayload);
      }
      if (data.expenses && data.expenses.length > 0) {
        const expensesPayload = data.expenses.map(e => ({
          id: e.id,
          amount: Number(e.amount) || 0,
          date: e.date,
          time: e.time || '',
          payer: e.payer,
          spend_area: e.spendArea || e.category || 'General',
          category: e.category || 'General',
          vendor: e.vendor || '',
          payment_mode: e.paymentMode || 'UPI',
          utr_number: e.utrNumber || '',
          how_it_helped: e.howItHelped || '',
          proof_data_url: e.proofDataUrl || null,
          proof_name: e.proofName || null
        }));
        await supabase.from('expenses').upsert(expensesPayload);
      }
      console.log('[Supabase Migration]: Pushed all existing data to Supabase successfully!');
    } catch (err) {
      console.error('[Supabase Migration Error]:', err);
    }
  },

  async pushPartnersToSupabase(partners) {
    const payload = partners.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      email: p.email || null,
      investment: typeof p.investment === 'number' ? p.investment : (Number(p.investment) || 0),
      color: p.color || '#10b981'
    }));
    await supabase.from('partners').upsert(payload);
  },

  // Save single expense to local cache and Supabase
  async saveExpenseItem(expense) {
    try {
      const dbExpense = {
        id: expense.id,
        amount: Number(expense.amount) || 0,
        date: expense.date,
        time: expense.time || '',
        payer: expense.payer,
        spend_area: expense.spendArea || expense.category || 'General',
        category: expense.category || 'General',
        vendor: expense.vendor || '',
        payment_mode: expense.paymentMode || 'UPI',
        utr_number: expense.utrNumber || '',
        how_it_helped: expense.howItHelped || '',
        proof_data_url: expense.proofDataUrl || null,
        proof_name: expense.proofName || null
      };
      await supabase.from('expenses').upsert(dbExpense);
    } catch (err) {
      console.error('[Supabase saveExpenseItem Error]:', err);
    }
  },

  // Delete single expense from Supabase
  async deleteExpenseItem(id) {
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (err) {
      console.error('[Supabase deleteExpenseItem Error]:', err);
    }
  },

  // Save single task to local cache and Supabase
  async saveTaskItem(task) {
    try {
      const dbTask = {
        id: task.id,
        title: task.title,
        spend_area: task.spendArea || 'General Operations',
        priority: task.priority || 'High',
        assignee: task.assignee || '',
        due_date: task.dueDate || '',
        status: task.status || 'To Do',
        progress: Number(task.progress) || 0,
        completed: !!task.completed,
        checklist: task.checklist || [],
        completed_items: task.completedItems || [],
        notes: task.notes || ''
      };
      await supabase.from('tasks').upsert(dbTask);
    } catch (err) {
      console.error('[Supabase saveTaskItem Error]:', err);
    }
  },

  // Delete single task from Supabase
  async deleteTaskItem(id) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.error('[Supabase deleteTaskItem Error]:', err);
    }
  },

  saveProjects(projects) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  saveTasks(tasks, pushToDb = true) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    if (pushToDb && Array.isArray(tasks)) {
      const payload = tasks.map(t => ({
        id: t.id,
        title: t.title,
        spend_area: t.spendArea || 'General Operations',
        priority: t.priority || 'High',
        assignee: t.assignee || '',
        due_date: t.dueDate || '',
        status: t.status || 'To Do',
        progress: Number(t.progress) || 0,
        completed: !!t.completed,
        checklist: t.checklist || [],
        completed_items: t.completedItems || [],
        notes: t.notes || ''
      }));
      supabase.from('tasks').upsert(payload).catch(e => console.error('[Supabase Tasks Upsert Error]:', e));
    }
  },

  saveExpenses(expenses, pushToDb = true) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    if (pushToDb && Array.isArray(expenses)) {
      const payload = expenses.map(e => ({
        id: e.id,
        amount: Number(e.amount) || 0,
        date: e.date,
        time: e.time || '',
        payer: e.payer,
        spend_area: e.spendArea || e.category || 'General',
        category: e.category || 'General',
        vendor: e.vendor || '',
        payment_mode: e.paymentMode || 'UPI',
        utr_number: e.utrNumber || '',
        how_it_helped: e.howItHelped || '',
        proof_data_url: e.proofDataUrl || null,
        proof_name: e.proofName || null
      }));
      supabase.from('expenses').upsert(payload).catch(e => console.error('[Supabase Expenses Upsert Error]:', e));
    }
  },

  savePartners(partners, pushToDb = true) {
    localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
    if (pushToDb && Array.isArray(partners)) {
      this.pushPartnersToSupabase(partners).catch(e => console.error('[Supabase Partners Upsert Error]:', e));
    }
  },

  saveSpendAreas(spendAreas, pushToDb = true) {
    localStorage.setItem(STORAGE_KEYS.SPEND_AREAS, JSON.stringify(spendAreas));
    if (pushToDb && Array.isArray(spendAreas)) {
      const payload = spendAreas.map(name => ({ name }));
      supabase.from('spend_areas').upsert(payload, { onConflict: 'name' }).catch(e => console.error('[Supabase Spend Areas Upsert Error]:', e));
    }
  },

  addSpendArea(newArea) {
    if (!newArea || typeof newArea !== 'string') return;
    const trimmed = newArea.trim();
    if (!trimmed) return;
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPEND_AREAS) || '[]');
      const set = new Set(Array.isArray(current) ? current : DEFAULT_SPEND_AREAS);
      set.add(trimmed);
      const updated = Array.from(set);
      this.saveSpendAreas(updated, true);
      return updated;
    } catch (e) {
      console.error('Failed to add spend area:', e);
    }
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.PARTNERS);
    localStorage.removeItem(STORAGE_KEYS.SPEND_AREAS);
  },

  // Subscribe to Supabase Realtime changes
  subscribeToRealtime(onTaskChange, onExpenseChange, onPartnerChange) {
    const channel = supabase
      .channel('delizoo-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        if (onTaskChange) onTaskChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
        if (onExpenseChange) onExpenseChange(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, payload => {
        if (onPartnerChange) onPartnerChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Export User Database to JSON file
  exportBackup(projects, tasks, expenses, partners = DEFAULT_PARTNERS, spendAreas = DEFAULT_SPEND_AREAS) {
    const payload = {
      app: "Delizoo Project & Expense Tracker",
      version: "2.3.0",
      exportedAt: new Date().toISOString(),
      counts: {
        projects: projects.length,
        tasks: tasks.length,
        expenses: expenses.length,
        partners: partners.length,
        spendAreas: spendAreas.length
      },
      data: {
        projects,
        tasks,
        expenses,
        partners,
        spendAreas
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `delizoo_tracker_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import User Database from JSON file
  importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed.data || !Array.isArray(parsed.data.expenses)) {
            throw new Error("Invalid backup file format. Missing data arrays.");
          }
          const rawPartners = parsed.data.partners || DEFAULT_PARTNERS;
          const partners = rawPartners.map(p => ({
            id: p.id || `partner-${Date.now()}`,
            name: normalizePayerName(p.name, DEFAULT_PARTNERS) || p.name,
            role: p.role || 'Partner',
            email: p.email || '',
            investment: typeof p.investment === 'number' ? p.investment : (Number(p.investment) || 0),
            color: p.color || '#10b981'
          }));

          const rawExpenses = parsed.data.expenses || [];
          const rawTasks = parsed.data.tasks || [];
          const rawProjects = parsed.data.projects || [];
          const rawAreas = parsed.data.spendAreas || DEFAULT_SPEND_AREAS;
          const spendAreas = Array.from(new Set([...DEFAULT_SPEND_AREAS, ...rawAreas]));

          this.saveProjects(rawProjects);
          this.saveTasks(rawTasks, true);
          this.saveExpenses(rawExpenses, true);
          this.savePartners(partners, true);
          this.saveSpendAreas(spendAreas, true);

          resolve({ projects: rawProjects, tasks: rawTasks, expenses: rawExpenses, partners, spendAreas });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Unable to read backup file."));
      reader.readAsText(file);
    });
  },

  // Export Expenses to CSV
  exportCsv(expenses) {
    const headers = [
      "Expense ID",
      "Date",
      "Time",
      "Amount (INR)",
      "Who Paid",
      "Spend Area",
      "Vendor / Payee",
      "Payment Mode",
      "UTR / Reference No",
      "Receipt Attached",
      "Impact & Notes"
    ];

    const escape = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = expenses.map(e => {
      return [
        escape(e.id),
        escape(e.date),
        escape(e.time || ''),
        e.amount,
        escape(normalizePayerName(e.payer)),
        escape(e.category || 'General'),
        escape(e.vendor || ''),
        escape(e.paymentMode || 'UPI'),
        escape(e.utrNumber || ''),
        e.proofDataUrl ? 'YES' : 'NO',
        escape(e.howItHelped || '')
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `delizoo_kakinada_ledger_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  processFileUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('No file provided'));

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1200;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(outputType, 0.85);

            resolve({
              dataUrl,
              name: file.name,
              type: outputType,
              size: file.size
            });
          };
          img.onerror = () => reject(new Error('Failed to decode image'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            dataUrl: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
          });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      }
    });
  }
};

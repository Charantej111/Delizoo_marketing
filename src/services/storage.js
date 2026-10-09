// Local Device Database Storage Service for Delizoo Tracker
// 100% Dynamic, 0% Mock Data

export const DEFAULT_PARTNERS = [
  { id: 'partner-1', name: 'N Charan Tej', role: 'Founder & Lead', investment: 50000, color: '#10b981' },
  { id: 'partner-2', name: 'G Pavan', role: 'Partner / Ops', investment: 50000, color: '#06b6d4' },
  { id: 'partner-3', name: 'G Sunil', role: 'Partner / Growth', investment: 50000, color: '#8b5cf6' },
  { id: 'partner-4', name: 'M Nareen', role: 'Partner / Marketing', investment: 50000, color: '#f59e0b' },
  { id: 'partner-5', name: 'J Sandeep', role: 'Partner / Tech', investment: 50000, color: '#ec4899' }
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

  // 2. Search against current partner list
  for (const p of partners) {
    const pLower = p.name.toLowerCase();
    if (pLower === lower) return p.name;
    
    // Check if raw name is a significant word in partner's full name
    const words = pLower.split(/\s+/).filter(w => w.length > 2);
    if (words.includes(lower)) {
      return p.name;
    }
  }

  return trimmed;
}

export const storageService = {
  // Load all user records from local storage with automatic deduplication & normalization
  loadAllData() {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const rawTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || 'null');
      let rawExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      
      // Load and clean partners list (preserve user's exact partner configuration)
      let rawPartners = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTNERS) || 'null');
      let partners = DEFAULT_PARTNERS;

      if (rawPartners && Array.isArray(rawPartners) && rawPartners.length > 0) {
        // Deduplicate and clean partners
        const seenNames = new Set();
        const cleaned = [];

        rawPartners.forEach(p => {
          if (!p || !p.name) return;
          const trimmedName = p.name.trim();

          // If Reserve Partner was previously auto-injected and has no expenses, clean it up
          if (trimmedName.toLowerCase() === 'reserve partner' || trimmedName.toLowerCase() === 'reserve') {
            const hasExpenses = rawExpenses.some(e => e.payer && normalizePayerName(e.payer).toLowerCase() === 'reserve partner');
            if (!hasExpenses) {
              return; // Do not keep auto-injected reserve partner
            }
          }

          const canonicalName = normalizePayerName(p.name, DEFAULT_PARTNERS);
          if (!seenNames.has(canonicalName)) {
            seenNames.add(canonicalName);
            const defaultMatch = DEFAULT_PARTNERS.find(dp => dp.name === canonicalName);
            
            // Accurately parse the investment number (preserve exact amount saved by user)
            let parsedInvestment = 50000;
            if (p.investment !== undefined && p.investment !== null && p.investment !== '') {
              const n = Number(p.investment);
              if (!isNaN(n)) {
                parsedInvestment = n;
              }
            } else if (defaultMatch) {
              parsedInvestment = defaultMatch.investment;
            }

            cleaned.push({
              id: p.id || defaultMatch?.id || `partner-${cleaned.length + 1}`,
              name: canonicalName,
              role: p.role || defaultMatch?.role || 'Partner',
              investment: parsedInvestment,
              color: p.color || defaultMatch?.color || '#10b981'
            });
          }
        });

        // Keep whatever the user saved - NEVER force inject Reserve Partner!
        partners = cleaned.length > 0 ? cleaned : DEFAULT_PARTNERS;
        this.savePartners(partners);
      } else {
        partners = DEFAULT_PARTNERS;
        this.savePartners(partners);
      }

      // Load and normalize tasks (0% mock data - preserve user's exact localStorage records)
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

      // Automatically normalize and update any legacy expense payers in place
      let expensesModified = false;
      const expenses = rawExpenses.map(e => {
        if (e.payer) {
          const normalized = normalizePayerName(e.payer, partners);
          if (normalized !== e.payer) {
            expensesModified = true;
            return { ...e, payer: normalized };
          }
        }
        return e;
      });

      // Load custom spend areas
      let rawSpendAreas = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPEND_AREAS) || 'null');
      const spendAreasSet = new Set(DEFAULT_SPEND_AREAS);

      if (Array.isArray(rawSpendAreas)) {
        rawSpendAreas.forEach(a => {
          if (typeof a === 'string' && a.trim()) spendAreasSet.add(a.trim());
        });
      }

      // Also gather any spend areas present in expenses or tasks
      rawExpenses.forEach(e => {
        if (e.spendArea?.trim()) spendAreasSet.add(e.spendArea.trim());
        if (e.category?.trim()) spendAreasSet.add(e.category.trim());
      });
      tasks.forEach(t => {
        if (t.spendArea?.trim()) spendAreasSet.add(t.spendArea.trim());
      });

      const spendAreas = Array.from(spendAreasSet);
      this.saveSpendAreas(spendAreas);

      return { projects, tasks, expenses, partners, spendAreas };
    } catch (e) {
      console.error('Failed to parse local device storage data:', e);
      return { projects: [], tasks: [], expenses: [], partners: DEFAULT_PARTNERS, spendAreas: DEFAULT_SPEND_AREAS };
    }
  },

  saveProjects(projects) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  savePartners(partners) {
    localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
  },

  saveSpendAreas(spendAreas) {
    localStorage.setItem(STORAGE_KEYS.SPEND_AREAS, JSON.stringify(spendAreas));
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
      this.saveSpendAreas(updated);
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

  // Export User Database to JSON file
  exportBackup(projects, tasks, expenses, partners = DEFAULT_PARTNERS, spendAreas = DEFAULT_SPEND_AREAS) {
    const payload = {
      app: "Delizoo Project & Expense Tracker",
      version: "2.2.0",
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
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed.data || !Array.isArray(parsed.data.projects) || !Array.isArray(parsed.data.expenses)) {
            throw new Error("Invalid backup file format. Missing data arrays.");
          }
          const rawPartners = parsed.data.partners || DEFAULT_PARTNERS;

          // Parse and normalize partners on import
          const partners = rawPartners.map(p => {
            const canonical = normalizePayerName(p.name, DEFAULT_PARTNERS);
            const defaultMatch = DEFAULT_PARTNERS.find(dp => dp.name === canonical);
            const inv = p.investment !== undefined && p.investment !== null && p.investment !== '' ? Number(p.investment) : (defaultMatch?.investment ?? 50000);
            return {
              id: p.id || defaultMatch?.id || `partner-${Date.now()}`,
              name: canonical || p.name,
              role: p.role || defaultMatch?.role || 'Partner',
              investment: isNaN(inv) ? 50000 : inv,
              color: p.color || defaultMatch?.color || '#10b981'
            };
          });

          const rawExpenses = parsed.data.expenses || [];
          const rawTasks = parsed.data.tasks || [];
          const rawProjects = parsed.data.projects || [];

          // Normalize expenses on import
          const expenses = rawExpenses.map(exp => ({
            ...exp,
            amount: Number(exp.amount) || 0,
            payer: normalizePayerName(exp.payer, partners)
          }));

          // Spend areas
          const rawAreas = parsed.data.spendAreas || DEFAULT_SPEND_AREAS;
          const spendAreas = Array.from(new Set([...DEFAULT_SPEND_AREAS, ...rawAreas]));

          this.saveProjects(projects);
          this.saveTasks(tasks);
          this.saveExpenses(expenses);
          this.savePartners(partners);
          this.saveSpendAreas(spendAreas);

          resolve({ projects, tasks, expenses, partners, spendAreas });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Unable to read backup file."));
      reader.readAsText(file);
    });
  },

  // Export Expenses to CSV for Excel & accounting
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

  // Process user file upload with automatic downscaling for storage efficiency
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
        // PDF or document
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

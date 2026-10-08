// Local Device Database Storage Service for Delizoo Tracker
// 100% Dynamic, 0% Mock Data

export const DEFAULT_PARTNERS = [
  { id: 'partner-1', name: 'N Charan Tej', role: 'Founder & Lead', investment: 50000, color: '#10b981' },
  { id: 'partner-2', name: 'G Pavan', role: 'Partner / Ops', investment: 50000, color: '#06b6d4' },
  { id: 'partner-3', name: 'G Sunil', role: 'Partner / Growth', investment: 50000, color: '#8b5cf6' },
  { id: 'partner-4', name: 'M Nareen', role: 'Partner / Marketing', investment: 50000, color: '#f59e0b' },
  { id: 'partner-5', name: 'J Sandeep', role: 'Partner / Tech', investment: 50000, color: '#ec4899' },
  { id: 'partner-6', name: 'Reserve Partner', role: 'Partner / Angel Pool', investment: 50000, color: '#6366f1' }
];

export const SPEND_AREAS = [
  'Digital Ads & Marketing',
  'Visiting Cards & Printing',
  'Rider Fleet & Delivery Kits',
  'Packaging & Restaurant Ops',
  'Tech & Infrastructure',
  'Fuel & Logistics',
  'Food Sampling & Promotions',
  'Office & Operations'
];

export const POPULAR_CATEGORIES = SPEND_AREAS.map(area => ({ label: area }));

const STORAGE_KEYS = {
  PROJECTS: 'delizoo_user_projects',
  TASKS: 'delizoo_user_tasks',
  EXPENSES: 'delizoo_user_expenses',
  PARTNERS: 'delizoo_user_partners'
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
    lower === 'reserve' ||
    lower === 'reserve partner' ||
    lower === 'angel pool' ||
    lower === 'founders pool' ||
    lower === 'partner 6' ||
    lower === 'partner-6'
  ) {
    return 'Reserve Partner';
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
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      let rawExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      
      // Load and clean partners list (preserve user's custom capital allocations)
      let rawPartners = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTNERS) || 'null');
      let partners = DEFAULT_PARTNERS;

      if (rawPartners && Array.isArray(rawPartners) && rawPartners.length > 0) {
        // Deduplicate any old legacy aliases like standalone "Sunil" or "Charan" in partners
        const seenNames = new Set();
        const cleaned = [];

        rawPartners.forEach(p => {
          if (!p || !p.name) return;
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

        // Ensure all 6 default partners exist in the list
        DEFAULT_PARTNERS.forEach(dp => {
          if (!seenNames.has(dp.name)) {
            cleaned.push(dp);
            seenNames.add(dp.name);
          }
        });

        partners = cleaned;
        this.savePartners(partners);
      } else {
        partners = DEFAULT_PARTNERS;
        this.savePartners(partners);
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

      if (expensesModified) {
        this.saveExpenses(expenses);
      }

      return { projects, tasks, expenses, partners };
    } catch (e) {
      console.error('Failed to parse local device storage data:', e);
      return { projects: [], tasks: [], expenses: [], partners: DEFAULT_PARTNERS };
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

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.PARTNERS);
  },

  // Export User Database to JSON file
  exportBackup(projects, tasks, expenses, partners = DEFAULT_PARTNERS) {
    const payload = {
      app: "Delizoo Project & Expense Tracker",
      version: "2.1.0",
      exportedAt: new Date().toISOString(),
      counts: {
        projects: projects.length,
        tasks: tasks.length,
        expenses: expenses.length,
        partners: partners.length
      },
      data: {
        projects,
        tasks,
        expenses,
        partners
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

          // Normalize expenses on import
          const expenses = rawExpenses.map(exp => ({
            ...exp,
            amount: Number(exp.amount) || 0,
            payer: normalizePayerName(exp.payer, partners)
          }));

          this.saveProjects(projects);
          this.saveTasks(tasks);
          this.saveExpenses(expenses);
          this.savePartners(partners);

          resolve({ projects, tasks, expenses, partners });
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

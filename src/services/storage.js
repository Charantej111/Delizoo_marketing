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

export const POPULAR_CATEGORIES = [
  { label: 'Ads & Promotion', icon: '📣', desc: 'Meta, Google, Insta & influencer ads' },
  { label: 'Visiting Cards & Printing', icon: '📇', desc: 'Flyers, menu cards, standees & banners' },
  { label: 'Rider Fleet & Kits', icon: '🛵', desc: 'Delivery bags, shirts & rider ops' },
  { label: 'Packaging & Restaurant Ops', icon: '📦', desc: 'Boxes, cutlery, tapes & restaurant kits' },
  { label: 'Tech & Domain', icon: '💻', desc: 'Hosting, domain, SMS gateway & software' },
  { label: 'Fuel & Travel', icon: '⛽', desc: 'On-ground commute & local logistics' },
  { label: 'Food Sampling', icon: '🍕', desc: 'College campaign & food testing' },
  { label: 'Office & Supplies', icon: '🏢', desc: 'General office & misc utility' }
];

const STORAGE_KEYS = {
  PROJECTS: 'delizoo_user_projects',
  TASKS: 'delizoo_user_tasks',
  EXPENSES: 'delizoo_user_expenses',
  PARTNERS: 'delizoo_user_partners'
};

export const storageService = {
  // Load all user records from local storage
  loadAllData() {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      const savedPartners = localStorage.getItem(STORAGE_KEYS.PARTNERS);
      const partners = savedPartners ? JSON.parse(savedPartners) : DEFAULT_PARTNERS;
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
          const projects = parsed.data.projects || [];
          const tasks = parsed.data.tasks || [];
          const expenses = parsed.data.expenses || [];
          const partners = parsed.data.partners || DEFAULT_PARTNERS;

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
  exportCsv(expenses, projects) {
    const projMap = {};
    projects.forEach(p => { projMap[p.id] = p; });

    const headers = [
      "Expense ID",
      "Date",
      "Time",
      "Project Title",
      "Department",
      "Amount (INR)",
      "Who Gave Amount",
      "Vendor / Payee",
      "Category",
      "Payment Mode",
      "UTR / Reference No",
      "Proof Attached",
      "How It Helped (Impact & ROI)"
    ];

    const escape = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const rows = expenses.map(e => {
      const proj = projMap[e.projectId] || {};
      return [
        escape(e.id),
        escape(e.date),
        escape(e.time || ''),
        escape(proj.title || 'Unassigned / General'),
        escape(proj.department || e.department || 'General'),
        e.amount,
        escape(e.payer),
        escape(e.vendor || ''),
        escape(e.category || ''),
        escape(e.paymentMode || ''),
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
    a.download = `delizoo_expenses_${dateStr}.csv`;
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

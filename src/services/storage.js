// Local Device Database Storage Service for Delizoo Tracker
// 100% Dynamic, 0% Mock Data

const STORAGE_KEYS = {
  PROJECTS: 'delizoo_user_projects',
  TASKS: 'delizoo_user_tasks',
  EXPENSES: 'delizoo_user_expenses'
};

export const storageService = {
  // Load all user records from local storage
  loadAllData() {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      return { projects, tasks, expenses };
    } catch (e) {
      console.error('Failed to parse local device storage data:', e);
      return { projects: [], tasks: [], expenses: [] };
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

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  },

  // Export User Database to JSON file
  exportBackup(projects, tasks, expenses) {
    const payload = {
      app: "Delizoo Project & Expense Tracker",
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      counts: {
        projects: projects.length,
        tasks: tasks.length,
        expenses: expenses.length
      },
      data: {
        projects,
        tasks,
        expenses
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

          this.saveProjects(projects);
          this.saveTasks(tasks);
          this.saveExpenses(expenses);

          resolve({ projects, tasks, expenses });
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

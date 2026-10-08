import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  Printer,
  HardDrive,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { storageService } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

export function ReportsTab({
  projects,
  tasks,
  expenses,
  onClearData,
  onImportComplete
}) {
  const [importStatus, setImportStatus] = useState('');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const fileInputRef = useRef(null);

  // Filter expenses by selected audit period
  const filteredExpenses = useMemo(() => {
    if (periodFilter === 'All') return expenses;
    const today = new Date();
    return expenses.filter(e => {
      const expDate = new Date(e.date);
      if (periodFilter === 'This Month') {
        const thisMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        return e.date && e.date.startsWith(thisMonthPrefix);
      }
      if (periodFilter === '30d') {
        const limit = new Date();
        limit.setDate(limit.getDate() - 30);
        return expDate >= limit;
      }
      if (periodFilter === 'Custom') {
        if (customStartDate && e.date < customStartDate) return false;
        if (customEndDate && e.date > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [expenses, periodFilter, customStartDate, customEndDate]);

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const totalSpent = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Group by project
  const projectAudit = projects.map(p => {
    const pExpenses = filteredExpenses.filter(e => e.projectId === p.id);
    const spent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const variance = (Number(p.budget) || 0) - spent;
    return {
      ...p,
      spent,
      variance,
      count: pExpenses.length,
      proofs: pExpenses.filter(e => !!e.proofDataUrl).length
    };
  });

  // Dynamic funding sources
  const fundingSources = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(e => {
      const payer = e.payer?.trim() || 'Unspecified';
      if (!map[payer]) {
        map[payer] = { amount: 0, count: 0, categories: new Set() };
      }
      map[payer].amount += Number(e.amount) || 0;
      map[payer].count += 1;
      if (e.category?.trim()) map[payer].categories.add(e.category.trim());
    });

    return Object.entries(map).map(([payer, data]) => ({
      payer,
      amount: data.amount,
      count: data.count,
      categories: Array.from(data.categories).join(', ')
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus('Restoring database from backup file...');
    try {
      const result = await storageService.importBackup(file);
      setImportStatus(`Successfully restored ${result.projects.length} projects and ${result.expenses.length} expenses!`);
      if (onImportComplete) onImportComplete(result);
      setTimeout(() => setImportStatus(''), 4000);
    } catch (err) {
      setImportStatus(`Restore failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Audit Reports & Database Management
          </h2>
          <p className="text-xs text-slate-500">
            Export accounting spreadsheets, verify contributor funding trails, and manage offline backups.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
          <button
            onClick={() => storageService.exportCsv(expenses, projects)}
            disabled={expenses.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Database Management Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 no-print space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Local Device Database</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All records and receipt images are stored exclusively on your device.
            </p>
          </div>
          <div className="text-right text-xs font-mono-num font-bold text-slate-800 hidden sm:block">
            {projects.length} Projects • {tasks.length} Tasks • {expenses.length} Expenses
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export Backup JSON */}
          <button
            onClick={() => storageService.exportBackup(projects, tasks, expenses)}
            className="p-3.5 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white text-left transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">Export Backup (JSON)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Downloads a complete snapshot of projects, tasks, and receipt images to a file.
            </p>
          </button>

          {/* Restore Backup JSON */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-3.5 rounded-xl border border-slate-200/70 bg-white/70 hover:bg-white text-left transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Restore Backup (JSON)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Import and restore records from a previously saved JSON backup file.
              </p>
            </button>
          </div>

          {/* Clear Database */}
          <button
            onClick={onClearData}
            className="p-3.5 rounded-xl border border-rose-200/60 bg-rose-50/40 hover:bg-rose-50 text-left transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-rose-700">Clear All Stored Data</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Permanently clears local device storage for this workspace.
            </p>
          </button>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            {importStatus}
          </div>
        )}
      </div>

      {/* Project Audit Statement */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Project Budget vs Real Spend Ledger</h3>
            <p className="text-[11px] text-slate-500">
              Audit statement based on verified expenditures
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            <span className="text-xs font-semibold text-slate-400">Audit Period:</span>
            <CustomSelect
              value={periodFilter}
              onChange={(val) => {
                setPeriodFilter(val);
                if (val !== 'Custom') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              size="sm"
              className="w-40"
              options={[
                { value: 'All', label: 'All Time' },
                { value: 'This Month', label: 'This Month' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'Custom', label: 'Custom Range...' }
              ]}
            />
          </div>
        </div>

        {periodFilter === 'Custom' && (
          <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-200/50 flex flex-wrap items-center gap-3 no-print">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">From:</span>
              <div className="w-40">
                <CustomDatePicker
                  value={customStartDate}
                  onChange={setCustomStartDate}
                  size="sm"
                  placeholder="Start date"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">To:</span>
              <div className="w-40">
                <CustomDatePicker
                  value={customEndDate}
                  onChange={setCustomEndDate}
                  size="sm"
                  placeholder="End date"
                />
              </div>
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Reset range
              </button>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Allocated Budget</th>
                <th className="py-3 px-4">Real Spend</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Receipts Verified</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectAudit.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No projects to display in audit statement.
                  </td>
                </tr>
              ) : (
                projectAudit.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                        {p.department || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-slate-900">
                      ₹{Number(p.budget || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-bold text-emerald-600">
                      ₹{p.spent.toLocaleString('en-IN')}
                    </td>
                    <td className={`py-3.5 px-4 font-mono-num font-bold ${p.variance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      {p.variance >= 0 ? `+₹${p.variance.toLocaleString('en-IN')}` : `-₹${Math.abs(p.variance).toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-slate-500">
                      {p.proofs} of {p.count}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Funding Contributor Accountability */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200/60 bg-slate-50/70">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Funding Contributor Accountability Ledger ("Who Gave Amount")</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Contributor Name / Pool</th>
                <th className="py-3 px-4">Total Amount Funded</th>
                <th className="py-3 px-4">Transaction Count</th>
                <th className="py-3 px-4">Share of Spend</th>
                <th className="py-3 px-4">Categories Supported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fundingSources.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No funding sources recorded yet.
                  </td>
                </tr>
              ) : (
                fundingSources.map(f => {
                  const share = totalSpent > 0 ? Math.round((f.amount / totalSpent) * 100) : 0;
                  return (
                    <tr key={f.payer} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                          {f.payer}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono-num font-black text-sm text-slate-900">
                        ₹{f.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-slate-500">{f.count}</td>
                      <td className="py-3.5 px-4 font-mono-num font-bold text-slate-700">{share}%</td>
                      <td className="py-3.5 px-4 text-slate-500">{f.categories || 'General'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

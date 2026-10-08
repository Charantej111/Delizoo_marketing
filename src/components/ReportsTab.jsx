import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  Printer,
  HardDrive,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  ShieldCheck,
  Coins,
  CheckCircle2
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

  const totalBudget = useMemo(() => {
    return projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  }, [projects]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const netVariance = totalBudget - totalSpent;
  const totalProofsCount = useMemo(() => {
    return filteredExpenses.filter(e => !!e.proofDataUrl).length;
  }, [filteredExpenses]);

  // Group by project
  const projectAudit = useMemo(() => {
    return projects.map(p => {
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
  }, [projects, filteredExpenses]);

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
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            Audit Reports & Database Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Export accounting spreadsheets, verify contributor funding trails, and manage offline backups.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
          <button
            onClick={() => storageService.exportCsv(expenses, projects)}
            disabled={expenses.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
        <div className="glass-panel rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Total Allocated Budget
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono-num text-zinc-900 dark:text-white tracking-tight">
            ₹{totalBudget.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Across {projects.length} recorded projects</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Real Expenditure
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono-num text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₹{totalSpent.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">In selected audit period</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Net Budget Variance
          </span>
          <p className={`text-xl sm:text-2xl font-black font-mono-num tracking-tight ${
            netVariance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {netVariance >= 0 ? `+₹${netVariance.toLocaleString('en-IN')}` : `-₹${Math.abs(netVariance).toLocaleString('en-IN')}`}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {netVariance >= 0 ? 'Surplus / Available balance' : 'Over allocated budget'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Verified Receipts
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono-num text-zinc-900 dark:text-white tracking-tight">
            {totalProofsCount} <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">/ {filteredExpenses.length}</span>
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            {filteredExpenses.length > 0 ? `${Math.round((totalProofsCount / filteredExpenses.length) * 100)}% audit compliance` : 'No expenses recorded'}
          </p>
        </div>
      </div>

      {/* Database Management Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 no-print space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Local Device Database</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
                  Offline IndexedDB / LocalStorage
                </span>
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              All records, payment proofs, and attachments are encrypted and preserved directly inside your browser storage.
            </p>
          </div>
          <div className="text-right text-xs font-mono-num font-bold text-zinc-800 dark:text-zinc-300 hidden sm:block">
            {projects.length} Projects • {tasks.length} Tasks • {expenses.length} Expenses
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export Backup JSON */}
          <button
            onClick={() => storageService.exportBackup(projects, tasks, expenses)}
            className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-left transition-all shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Export Backup (JSON)</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Downloads a complete standalone JSON archive of all projects, tasks, receipts, and images.
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
              className="w-full h-full p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-left transition-all shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Restore Backup (JSON)</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Import and restore records from a previously downloaded JSON backup file.
              </p>
            </button>
          </div>

          {/* Clear Database */}
          <button
            onClick={onClearData}
            className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/60 dark:hover:bg-rose-950/60 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Clear All Stored Data</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Permanently purges local storage on this browser workspace.
            </p>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Project Audit Statement */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/90 dark:bg-zinc-900/90">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Project Budget vs Real Spend Ledger</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Audited balance statement based on recorded expenditures
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Audit Period:</span>
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
              className="w-44"
              options={[
                { value: 'All', label: 'All Time' },
                { value: 'This Month', label: 'This Month' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'Custom', label: 'Custom Date Range...' }
              ]}
            />
          </div>
        </div>

        {periodFilter === 'Custom' && (
          <div className="px-4 py-2.5 bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800 flex flex-wrap items-center gap-3 no-print">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">From:</span>
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
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">To:</span>
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
                className="text-xs text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
              >
                Reset range
              </button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {projectAudit.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-zinc-400 dark:text-zinc-500">
                    No projects found in database. Create a project to start audit tracking.
                  </td>
                </tr>
              ) : (
                projectAudit.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">{p.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700 font-medium">
                        {p.department || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-zinc-900 dark:text-white">
                      ₹{Number(p.budget || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{p.spent.toLocaleString('en-IN')}
                    </td>
                    <td className={`py-3.5 px-4 font-mono-num font-bold ${p.variance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                      {p.variance >= 0 ? `+₹${p.variance.toLocaleString('en-IN')}` : `-₹${Math.abs(p.variance).toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-zinc-500 dark:text-zinc-400">
                      {p.proofs} of {p.count}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'Completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700'
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
        <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90">
          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Funding Contributor Accountability Ledger ("Who Gave Amount")</h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Breakdown of exact capital disbursed by team members and investors
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Contributor Name / Pool</th>
                <th className="py-3 px-4">Total Amount Funded</th>
                <th className="py-3 px-4">Transaction Count</th>
                <th className="py-3 px-4">Share of Spend</th>
                <th className="py-3 px-4">Categories Supported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {fundingSources.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-zinc-400 dark:text-zinc-500">
                    No funding sources recorded yet. Record expenses with "Who gave amount" to view contributor audit.
                  </td>
                </tr>
              ) : (
                fundingSources.map(f => {
                  const share = totalSpent > 0 ? Math.round((f.amount / totalSpent) * 100) : 0;
                  return (
                    <tr key={f.payer} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/80 dark:border-emerald-800/80">
                          {f.payer}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono-num font-black text-sm text-zinc-900 dark:text-white">
                        ₹{f.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-zinc-500 dark:text-zinc-400">{f.count} txns</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(share, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono-num font-bold text-zinc-700 dark:text-zinc-300">{share}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">{f.categories || 'General'}</td>
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

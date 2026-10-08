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
  CheckCircle2,
  Users,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { storageService, DEFAULT_PARTNERS, SPEND_AREAS, DEFAULT_SPEND_AREAS, normalizePayerName } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

export function ReportsTab({
  tasks = [],
  expenses = [],
  partners = DEFAULT_PARTNERS,
  spendAreas = DEFAULT_SPEND_AREAS,
  onOpenPartnerModal,
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

  const totalCommittedCapital = useMemo(() => {
    return partners.reduce((acc, p) => acc + (Number(p.investment) || 0), 0);
  }, [partners]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalProofsCount = useMemo(() => {
    return filteredExpenses.filter(e => !!e.proofDataUrl).length;
  }, [filteredExpenses]);

  // Spend Area Breakdown Table (incorporates all custom and default spend areas)
  const spendAreaBreakdown = useMemo(() => {
    const areaMap = {};
    const allAreasSet = new Set(spendAreas || DEFAULT_SPEND_AREAS);
    filteredExpenses.forEach(e => {
      if (e.spendArea?.trim()) allAreasSet.add(e.spendArea.trim());
      if (e.category?.trim()) allAreasSet.add(e.category.trim());
    });

    allAreasSet.forEach(area => {
      areaMap[area] = { name: area, spent: 0, count: 0, proofs: 0 };
    });

    filteredExpenses.forEach(e => {
      const area = e.spendArea || e.category || 'General Operations';
      if (!areaMap[area]) {
        areaMap[area] = { name: area, spent: 0, count: 0, proofs: 0 };
      }
      areaMap[area].spent += Number(e.amount) || 0;
      areaMap[area].count += 1;
      if (e.proofDataUrl) areaMap[area].proofs += 1;
    });


    return Object.values(areaMap)
      .filter(item => item.spent > 0 || item.count > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [filteredExpenses]);

  // 6 Founders & Partners Capital Ledger Analytics
  const partnerAuditLedger = useMemo(() => {
    return partners.map(p => {
      const pExpenses = filteredExpenses.filter(e => {
        const norm = normalizePayerName(e.payer, partners);
        return norm.toLowerCase() === p.name.trim().toLowerCase();
      });
      const spent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const remaining = (Number(p.investment) || 0) - spent;
      const share = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
      
      const catMap = {};
      pExpenses.forEach(e => {
        const cat = e.spendArea || e.category || 'General';
        catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
      });

      const catSummary = Object.entries(catMap)
        .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`)
        .join(', ');

      return {
        ...p,
        spent,
        remaining,
        share,
        count: pExpenses.length,
        categories: catSummary || 'None'
      };
    });
  }, [partners, filteredExpenses, totalSpent]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus('Restoring database from backup file...');
    try {
      const result = await storageService.importBackup(file);
      setImportStatus(`Successfully restored database with ${result.expenses?.length || 0} expenses and ${result.partners?.length || 0} partner profiles!`);
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
            Financial Audit & Reports
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Export accounting spreadsheets, verify 6-founder capital trails, and manage offline database backups.
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
            onClick={() => storageService.exportCsv(expenses)}
            disabled={expenses.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 no-print">
        <div className="glass-panel rounded-2xl p-4 space-y-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
            <Coins className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
            <span className="truncate">Total Partner Capital Pool</span>
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono-num text-zinc-900 dark:text-white tracking-tight truncate">
            ₹{totalCommittedCapital.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{partners.length} Founding Partners</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Real Expenditure</span>
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono-num text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            ₹{totalSpent.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">In selected audit period</p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate block">
            Net Available Balance
          </span>
          <p className={`text-xl sm:text-2xl font-black font-mono-num tracking-tight truncate ${
            (totalCommittedCapital - totalSpent) >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
          }`}>
            ₹{(totalCommittedCapital - totalSpent).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
            {(totalCommittedCapital - totalSpent) >= 0 ? 'Available capital' : 'Exceeded capital allocation'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 space-y-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Verified Receipts</span>
          </span>
          <p className="text-xl sm:text-2xl font-black font-mono-num text-zinc-900 dark:text-white tracking-tight truncate">
            {totalProofsCount} <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">/ {filteredExpenses.length}</span>
          </p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
            {filteredExpenses.length > 0 ? `${Math.round((totalProofsCount / filteredExpenses.length) * 100)}% audit compliance` : 'No transactions'}
          </p>
        </div>
      </div>

      {/* SECTION: 6 Partners & Investors Capital Audit Ledger */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Founders & Partners Capital Audit Ledger ("Who Paid")</span>
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Audited individual capital pools, disbursements, and category spending breakdown
            </p>
          </div>

          {onOpenPartnerModal && (
            <button
              onClick={onOpenPartnerModal}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer no-print shrink-0"
            >
              <span>Edit Capital Pool</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 min-w-[140px]">Partner</th>
                <th className="py-3 px-4 min-w-[110px]">Role</th>
                <th className="py-3 px-4 min-w-[120px]">Committed Capital</th>
                <th className="py-3 px-4 min-w-[120px]">Total Paid Out</th>
                <th className="py-3 px-4 min-w-[120px]">Available Balance</th>
                <th className="py-3 px-4 min-w-[120px]">Share of Spend</th>
                <th className="py-3 px-4 min-w-[180px]">Spend Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {partnerAuditLedger.map(p => (
                <tr key={p.id || p.name} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold border border-zinc-200/80 dark:border-zinc-700">
                      {p.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                    {p.role}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-zinc-900 dark:text-white font-bold whitespace-nowrap">
                    ₹{p.investment.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num font-black text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    ₹{p.spent.toLocaleString('en-IN')}
                  </td>
                  <td className={`py-3.5 px-4 font-mono-num font-bold whitespace-nowrap ${
                    p.remaining >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {p.remaining >= 0 ? `₹${p.remaining.toLocaleString('en-IN')}` : `-₹${Math.abs(p.remaining).toLocaleString('en-IN')}`}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(p.share, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono-num font-bold text-zinc-700 dark:text-zinc-300">{p.share}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                    {p.categories}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Spend Area Audit Statement */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/90 dark:bg-zinc-900/90">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <span>Spend Area & Channel Audit Breakdown</span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Aggregated expenditures across operational and marketing channels for Delizoo Kakinada
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Period:</span>
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
              align="right"
              className="w-44"
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
          <div className="px-4 py-2.5 bg-zinc-100/70 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800 flex flex-wrap items-center gap-3 no-print">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0">From:</span>
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
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 shrink-0">To:</span>
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
                className="text-xs text-rose-500 hover:text-rose-400 font-semibold cursor-pointer shrink-0"
              >
                Reset range
              </button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 min-w-[180px]">Spend Area / Channel</th>
                <th className="py-3 px-4 min-w-[140px]">Total Amount Spent</th>
                <th className="py-3 px-4 min-w-[110px]">Transactions</th>
                <th className="py-3 px-4 min-w-[130px]">Verified Receipts</th>
                <th className="py-3 px-4 min-w-[140px]">Share of Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {spendAreaBreakdown.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-zinc-400 dark:text-zinc-500">
                    No expenditures found for this period.
                  </td>
                </tr>
              ) : (
                spendAreaBreakdown.map(area => {
                  const share = totalSpent > 0 ? Math.round((area.spent / totalSpent) * 100) : 0;
                  return (
                    <tr key={area.name} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white whitespace-nowrap">{area.name}</td>
                      <td className="py-3.5 px-4 font-mono-num font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                        ₹{area.spent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {area.count} transactions
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {area.proofs} of {area.count} verified
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(share, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono-num font-bold text-zinc-700 dark:text-zinc-300">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Management Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 no-print space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Local Database & Offline Backups
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              All records, partner allocations, and receipt files are saved privately on your device.
            </p>
          </div>
          <div className="text-right text-xs font-mono-num font-bold text-zinc-700 dark:text-zinc-300 hidden sm:block">
            {partners.length} Partners • {tasks.length} Tasks • {expenses.length} Expenses
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export Backup JSON */}
          <button
            onClick={() => storageService.exportBackup([], tasks, expenses, partners)}
            className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-left transition-all shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Export Backup (JSON)</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Downloads a complete offline backup file of partner investments, expenses, and receipt images.
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
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Clear Local Database</span>
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
    </div>
  );
}

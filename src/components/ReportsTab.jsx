import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  Printer,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { storageService, DEFAULT_PARTNERS, DEFAULT_SPEND_AREAS, normalizePayerName } from '../services/storage';
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

  // Spend Area Breakdown Table
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
      const area = e.spendArea || e.category || 'General';
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
  }, [filteredExpenses, spendAreas]);

  // Partner Capital Ledger (Strictly honoring exact individual database allocations)
  const partnerAuditLedger = useMemo(() => {
    return partners.map(p => {
      const pExpenses = filteredExpenses.filter(e => {
        const norm = normalizePayerName(e.payer, partners);
        return norm.toLowerCase() === p.name.trim().toLowerCase();
      });
      const spent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const allocated = Number(p.investment) || 0;
      const remaining = allocated - spent;
      const share = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;
      const utilization = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

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
        allocated,
        spent,
        remaining,
        share,
        utilization,
        count: pExpenses.length,
        categories: catSummary || '—'
      };
    });
  }, [partners, filteredExpenses, totalSpent]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportStatus('Importing...');
      const imported = await storageService.importBackup(file);
      setImportStatus('Backup restored successfully');
      if (onImportComplete) {
        onImportComplete(imported);
      }
      setTimeout(() => setImportStatus(''), 4000);
    } catch (err) {
      alert("Failed to import database: " + err.message);
      setImportStatus('Import failed');
      setTimeout(() => setImportStatus(''), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Print / Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Financial Audit & Reports
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Comprehensive statements and partner capital ledger for Delizoo Kakinada.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => storageService.exportCsv(filteredExpenses)}
            disabled={filteredExpenses.length === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Audit Period Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Statement Period:</span>
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
            options={[
              { value: 'All', label: 'All Time' },
              { value: 'This Month', label: 'This Month' },
              { value: '30d', label: 'Last 30 Days' },
              { value: 'Custom', label: 'Custom Range...' }
            ]}
          />
        </div>

        {periodFilter === 'Custom' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">From</span>
            <div className="w-36">
              <CustomDatePicker
                value={customStartDate}
                onChange={setCustomStartDate}
                size="sm"
                placeholder="Start date"
              />
            </div>
            <span className="text-xs text-zinc-400">To</span>
            <div className="w-36">
              <CustomDatePicker
                value={customEndDate}
                onChange={setCustomEndDate}
                size="sm"
                placeholder="End date"
              />
            </div>
          </div>
        )}

        <div className="text-xs text-zinc-400 font-mono-num">
          {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''} in statement
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Total Committed Budget
          </div>
          <div className="text-2xl font-bold font-mono-num text-zinc-950 dark:text-white">
            ₹{totalCommittedCapital.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Across {partners.length} partners
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Total Disbursed Spend
          </div>
          <div className="text-2xl font-bold font-mono-num text-zinc-950 dark:text-white">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {totalCommittedCapital > 0 ? `${((totalSpent / totalCommittedCapital) * 100).toFixed(1)}% utilized` : '—'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Remaining Pool Reserve
          </div>
          <div className="text-2xl font-bold font-mono-num text-zinc-950 dark:text-white">
            ₹{(totalCommittedCapital - totalSpent).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Liquid balance left
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Verified Receipts
          </div>
          <div className="text-2xl font-bold font-mono-num text-zinc-950 dark:text-white">
            {totalProofsCount} / {filteredExpenses.length}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {filteredExpenses.length > 0 ? `${Math.round((totalProofsCount / filteredExpenses.length) * 100)}% proof compliance` : '—'}
          </div>
        </div>
      </div>

      {/* SECTION: Partner Capital & Spend Ledger Table */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
              Partner Capital & Spend Ledger
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Individual breakdown of allocated capital, disbursed expenditures, and available balance.
            </p>
          </div>
          <button
            onClick={onOpenPartnerModal}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white no-print cursor-pointer"
          >
            Edit Allocations →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 font-mono-num text-right">Allocated Budget</th>
                <th className="py-3 px-4 font-mono-num text-right">Disbursed Spend</th>
                <th className="py-3 px-4 font-mono-num text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-center">Utilization</th>
                <th className="py-3 px-4">Primary Categories Funded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {partnerAuditLedger.map(p => (
                <tr key={p.id || p.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                      {p.name}
                    </div>
                    {p.email && (
                      <div className="text-[11px] text-zinc-400 font-mono-num">
                        {p.email}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs">
                    {p.role}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num font-semibold text-zinc-950 dark:text-white text-right text-xs">
                    ₹{p.allocated.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num text-zinc-800 dark:text-zinc-200 text-right text-xs">
                    ₹{p.spent.toLocaleString('en-IN')}
                    {p.count > 0 && (
                      <span className="text-[10px] text-zinc-400 block font-normal">
                        ({p.count} bills)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono-num font-semibold text-right text-xs">
                    <span className={p.remaining >= 0 ? 'text-zinc-950 dark:text-white' : 'text-rose-600 dark:text-rose-400'}>
                      ₹{p.remaining.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono-num text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {p.utilization}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 text-xs truncate max-w-xs">
                    {p.categories}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Spend Area Statement Table */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
            Operational Channel Breakdown
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Aggregated expenditures across marketing, fleet, printing, and operations channels.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Spend Area / Channel</th>
                <th className="py-3 px-4 font-mono-num text-right">Disbursed Amount</th>
                <th className="py-3 px-4 font-mono-num text-right">Share of Total</th>
                <th className="py-3 px-4 text-center">Transactions</th>
                <th className="py-3 px-4 text-center">Receipts Attached</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {spendAreaBreakdown.map((row) => {
                const sharePct = totalSpent > 0 ? ((row.spent / totalSpent) * 100).toFixed(1) : '0';
                return (
                  <tr key={row.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-white">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num font-semibold text-zinc-950 dark:text-white text-right">
                      ₹{row.spent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-zinc-500 dark:text-zinc-400 text-right">
                      {sharePct}%
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-center text-zinc-600 dark:text-zinc-300">
                      {row.count}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-center text-zinc-600 dark:text-zinc-300">
                      {row.proofs} / {row.count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Backup & Data Management (No-print) */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 no-print">
        <div>
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
            Data Backup & Maintenance
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Export a full JSON backup of your records, restore from a file, or reset device cache.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={() => storageService.exportBackup([], tasks, expenses, partners, spendAreas)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup (.json)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>

          {onClearData && (
            <button
              onClick={onClearData}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local Cache</span>
            </button>
          )}

          {importStatus && (
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium ml-2">
              {importStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useMemo } from 'react';
import {
  FolderKanban,
  Receipt,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  Eye,
  ArrowRight,
  Wallet,
  Activity,
  Users,
  PieChart,
  Coins,
  ShieldCheck,
  Tag,
  ArrowUpRight
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { DEFAULT_PARTNERS, POPULAR_CATEGORIES } from '../services/storage';

export function OverviewTab({
  projects,
  tasks,
  expenses,
  partners = DEFAULT_PARTNERS,
  onOpenExpenseModal,
  onOpenProjectModal,
  onOpenPartnerModal,
  onSelectPayerForExpenses,
  onViewProof,
  onViewImpact,
  setActiveTab
}) {
  // Dynamic aggregations
  const totalBudget = useMemo(() => {
    return projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  }, [projects]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalCommittedCapital = useMemo(() => {
    return partners.reduce((acc, p) => acc + (Number(p.investment) || 0), 0);
  }, [partners]);

  const remainingCapitalPool = totalCommittedCapital - totalSpent;
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;
  const capitalUtilization = totalCommittedCapital > 0 ? Math.min(Math.round((totalSpent / totalCommittedCapital) * 100), 100) : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed').length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 1. Partner Investment and Spend Tracking
  const partnerAnalytics = useMemo(() => {
    return partners.map(p => {
      const pExpenses = expenses.filter(e => e.payer?.trim().toLowerCase() === p.name.trim().toLowerCase());
      const spent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const remaining = (Number(p.investment) || 0) - spent;
      const pctSpent = p.investment > 0 ? Math.min(Math.round((spent / p.investment) * 100), 100) : 0;

      // Group by category for this partner
      const catMap = {};
      pExpenses.forEach(e => {
        const cat = e.category?.trim() || 'General';
        catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
      });
      const topCategories = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      return {
        ...p,
        spent,
        remaining,
        pctSpent,
        txnCount: pExpenses.length,
        topCategories
      };
    });
  }, [partners, expenses]);

  // 2. Spend Category Breakdown (Ads, Cards, Fleet, Ops, etc.)
  const categoryStats = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const cat = e.category?.trim() || 'General';
      if (!map[cat]) map[cat] = { amount: 0, count: 0 };
      map[cat].amount += Number(e.amount) || 0;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([cat, d]) => ({
        category: cat,
        amount: d.amount,
        count: d.count,
        pct: totalSpent > 0 ? Math.round((d.amount / totalSpent) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalSpent]);

  // 3. Department Breakdown
  const deptStats = useMemo(() => {
    const stats = {};
    projects.forEach(p => {
      const dept = p.department || 'General';
      if (!stats[dept]) stats[dept] = { budget: 0, spent: 0, count: 0 };
      stats[dept].budget += Number(p.budget) || 0;
      stats[dept].count += 1;
    });

    expenses.forEach(e => {
      const proj = projects.find(p => p.id === e.projectId);
      const dept = proj ? proj.department : (e.department || 'General');
      if (!stats[dept]) stats[dept] = { budget: 0, spent: 0, count: 0 };
      stats[dept].spent += Number(e.amount) || 0;
    });

    return stats;
  }, [projects, expenses]);

  // Recent 5 expenses
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')))
      .slice(0, 5);
  }, [expenses]);

  const hasAnyData = projects.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Welcome Glass Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Operations & Capital Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200/80 dark:border-emerald-800/80">
              LIVE TRACKER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Real-time capital tracking across 6 partners, ads vs print cards, and verified spend proofs for Delizoo Kakinada.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={onOpenPartnerModal}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Manage Capital</span>
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            + Record Expense
          </button>
        </div>
      </div>

      {/* 4 Frosted Glass Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Committed Capital */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Partner Capital</span>
              <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-zinc-900 dark:text-white">
              ₹{totalCommittedCapital.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{partners.length} Investors / Partners</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Committed Pool</span>
          </div>
        </div>

        {/* Real Spend */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Real Spend (Disbursed)</span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600 dark:text-emerald-400">
              ₹{totalSpent.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{totalCommittedCapital > 0 ? `${capitalUtilization}% capital utilized` : 'No pool'}</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{expenses.length} bills</span>
          </div>
        </div>

        {/* Remaining Capital Balance */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Remaining Capital Pool</span>
              <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono-num ${remainingCapitalPool >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              ₹{remainingCapitalPool.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{remainingCapitalPool >= 0 ? 'Available balance' : 'Capital exceeded'}</span>
            <span className={`font-semibold ${remainingCapitalPool >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {totalCommittedCapital > 0 ? `${100 - capitalUtilization}% left` : '—'}
            </span>
          </div>
        </div>

        {/* Initiatives & Milestones */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Campaign Milestones</span>
              <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-zinc-900 dark:text-white">
              {taskProgress}%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{completedTasks} of {totalTasks} finished</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{projects.length} campaigns</span>
          </div>
        </div>
      </div>

      {/* SECTION: 6 Partners & Investment Capital Pool */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Investors & Partners Capital Pool</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200/80 dark:border-emerald-800">
                6 Founders Pool
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Individual capital investment commitments, real-time disbursements, and remaining balances.
            </p>
          </div>

          <button
            onClick={onOpenPartnerModal}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Edit Capital Allocations</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        {/* 6 Partner Investment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {partnerAnalytics.map((p, idx) => (
            <div
              key={p.id || p.name}
              className="p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs hover:shadow-sm space-y-3"
            >
              {/* Partner Name & Role */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-2xs"
                    style={{ backgroundColor: p.color || '#10b981' }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">{p.role}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  p.remaining >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-800'
                }`}>
                  {p.remaining >= 0 ? 'Active' : 'Exceeded'}
                </span>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block">Committed Pool</span>
                  <span className="text-sm font-black font-mono-num text-zinc-900 dark:text-white">
                    ₹{p.investment.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 block">Spent / Paid</span>
                  <span className="text-sm font-black font-mono-num text-emerald-600 dark:text-emerald-400">
                    ₹{p.spent.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Capital Remaining & Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Remaining Balance:</span>
                  <span className={`font-mono-num font-black ${
                    p.remaining >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    ₹{p.remaining.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      p.remaining < 0 ? 'bg-rose-500' : p.pctSpent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(p.pctSpent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono-num">
                  <span>{p.pctSpent}% utilized</span>
                  <span>{p.txnCount} bills paid</span>
                </div>
              </div>

              {/* Top Categories Funded */}
              {p.topCategories.length > 0 ? (
                <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]">
                    <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{p.topCategories.map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`).join(', ')}</span>
                  </div>
                  {onSelectPayerForExpenses && (
                    <button
                      onClick={() => onSelectPayerForExpenses(p.name)}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                    >
                      View Bills →
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                  No expenditures recorded by {p.name} yet.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spend by Category & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Spend Category Breakdown (Ads, Print, Cards, Tech, etc.) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Spend by Category (Ads, Cards, Fleet, Ops)</span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Distribution across marketing and operational channels</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {categoryStats.length} Types
            </span>
          </div>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">
              No expenses recorded yet. Click "+ Record Expense" to see category distribution.
            </p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(c => (
                <div key={c.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{c.category}</span>
                    <div className="font-mono-num space-x-1.5">
                      <span className="font-bold text-zinc-900 dark:text-white">₹{c.amount.toLocaleString('en-IN')}</span>
                      <span className="text-zinc-400 dark:text-zinc-500">({c.pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spend by Department */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Spend by Department</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Live comparison against allocated project budgets</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {Object.keys(deptStats).length} Depts
            </span>
          </div>

          {Object.keys(deptStats).length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">No department activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(deptStats).map(([dept, stat]) => {
                const pct = stat.budget > 0 ? Math.min(Math.round((stat.spent / stat.budget) * 100), 100) : 0;
                return (
                  <div key={dept} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{dept}</span>
                      <div className="font-mono-num space-x-1.5">
                        <span className="font-bold text-zinc-900 dark:text-white">₹{stat.spent.toLocaleString('en-IN')}</span>
                        <span className="text-zinc-400 dark:text-zinc-500">/ ₹{stat.budget.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenditures Feed */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Expenditures & Verified Proofs</h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Latest transactions with payment receipts and ROI impact statements</p>
          </div>
          {expenses.length > 0 && (
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-bold text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>See all ({expenses.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentExpenses.length === 0 ? (
          <p className="text-xs text-zinc-400 py-8 text-center">
            No expenditures recorded yet. Click "+ Record Expense" to log your first payment.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentExpenses.map((exp) => {
              const proj = projects.find(p => p.id === exp.projectId);
              return (
                <div
                  key={exp.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-mono-num text-xs font-bold shrink-0 mt-0.5">
                      ₹
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                          {exp.vendor || 'Direct Payee'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 font-bold">
                          {exp.category || 'Expense'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 font-medium">
                          {proj ? proj.department : (exp.department || 'General')}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num">{exp.date}</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Paid by: {exp.payer}</span>
                        {' • '}
                        <span className="text-zinc-500 dark:text-zinc-400">{proj ? proj.title : 'General Initiative'}</span>
                      </p>
                      {exp.howItHelped && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-1 line-clamp-1 max-w-xl">
                          “{exp.howItHelped}”
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black font-mono-num text-zinc-900 dark:text-white">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-mono-num text-zinc-400 dark:text-zinc-500">
                        {exp.paymentMode || 'UPI'}
                      </div>
                    </div>

                    {exp.proofDataUrl && (
                      <button
                        onClick={() => onViewProof(exp)}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title="Inspect Proof"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                        <span>Proof</span>
                      </button>
                    )}

                    {exp.howItHelped && (
                      <button
                        onClick={() => onViewImpact(exp)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
                        title="View Impact"
                      >
                        Impact
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

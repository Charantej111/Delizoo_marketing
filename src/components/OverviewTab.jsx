import React from 'react';
import {
  FolderKanban,
  Receipt,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  Eye,
  ArrowRight,
  Wallet,
  Activity
} from 'lucide-react';
import { EmptyState } from './EmptyState';

export function OverviewTab({
  projects,
  tasks,
  expenses,
  onOpenExpenseModal,
  onOpenProjectModal,
  onViewProof,
  onViewImpact,
  setActiveTab
}) {
  // Dynamic aggregations
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const totalSpent = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed').length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Department Breakdown
  const deptStats = {};
  projects.forEach(p => {
    const dept = p.department || 'General';
    if (!deptStats[dept]) deptStats[dept] = { budget: 0, spent: 0, count: 0 };
    deptStats[dept].budget += Number(p.budget) || 0;
    deptStats[dept].count += 1;
  });

  expenses.forEach(e => {
    const proj = projects.find(p => p.id === e.projectId);
    const dept = proj ? proj.department : (e.department || 'General');
    if (!deptStats[dept]) deptStats[dept] = { budget: 0, spent: 0, count: 0 };
    deptStats[dept].spent += Number(e.amount) || 0;
  });

  // Funding contributors ("Who gave the amount")
  const payerStats = {};
  expenses.forEach(e => {
    const payer = e.payer?.trim() || 'Unspecified';
    if (!payerStats[payer]) payerStats[payer] = { amount: 0, count: 0 };
    payerStats[payer].amount += Number(e.amount) || 0;
    payerStats[payer].count += 1;
  });

  const sortedPayers = Object.entries(payerStats).sort((a, b) => b[1].amount - a[1].amount);

  // Recent 5 expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')))
    .slice(0, 5);

  const hasAnyData = projects.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Welcome Glass Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Operations & Budget Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-200/80 dark:border-emerald-800/80">
              LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Real-time project tracking, cash flow accountability, and verified proofs for Delizoo Kakinada.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setActiveTab('expenses')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 text-xs font-bold transition-all shadow-2xs"
          >
            Full Ledger
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            + Record Expense
          </button>
        </div>
      </div>

      {/* 4 Frosted Glass Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Budget */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Allocated Budget</span>
              <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <FolderKanban className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-zinc-900 dark:text-white">
              ₹{totalBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{projects.length} Initiatives</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{projects.length > 0 ? 'Active' : 'Empty'}</span>
          </div>
        </div>

        {/* Real Spend */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Real Spend</span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600 dark:text-emerald-400">
              ₹{totalSpent.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{totalBudget > 0 ? `${budgetUtilization}% utilized` : 'No budget'}</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{expenses.length} bills</span>
          </div>
        </div>

        {/* Remaining Surplus */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Remaining Balance</span>
              <span className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono-num ${remainingBudget >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              ₹{remainingBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{remainingBudget >= 0 ? 'Surplus funds' : 'Over budget'}</span>
            <span className={`font-semibold ${remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {totalBudget > 0 ? `${100 - budgetUtilization}% left` : '—'}
            </span>
          </div>
        </div>

        {/* Task Velocity */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Milestones Done</span>
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
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalTasks - completedTasks} open</span>
          </div>
        </div>
      </div>

      {!hasAnyData ? (
        <EmptyState
          type="projects"
          title="Clean Workspace Ready"
          description="Track your team's initiatives, rider kit procurements, student flyer distribution, and verified payment proofs."
          actionText="Create First Project"
          onAction={onOpenProjectModal}
        />
      ) : (
        <>
          {/* Department Breakdown & Funding Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Department Breakdown */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Spend by Department</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Live comparison against allocated budget</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {Object.keys(deptStats).length} Depts
                </span>
              </div>

              {Object.keys(deptStats).length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">No department activity yet.</p>
              ) : (
                <div className="space-y-4">
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
                              pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-zinc-600 dark:bg-zinc-400' : 'bg-emerald-500'
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

            {/* Funding Sources ("Who gave the amount") */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Funding Sources (Who Paid)</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Real-time ledger of who funded each expenditure</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80">
                  {sortedPayers.length} Sources
                </span>
              </div>

              {sortedPayers.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">
                  No payers recorded yet. Add an expense to see contributor analytics.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sortedPayers.map(([payer, data]) => {
                    const share = totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0;
                    return (
                      <div
                        key={payer}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/70 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-xs font-extrabold text-zinc-700 dark:text-zinc-200">
                            {payer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">{payer}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{data.count} payment{data.count > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-mono-num font-extrabold text-zinc-900 dark:text-white">
                            ₹{data.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{share}% of total</p>
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
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Expenditures & Proofs</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Latest transactions with proof verification and ROI impact notes</p>
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
        </>
      )}
    </div>
  );
}

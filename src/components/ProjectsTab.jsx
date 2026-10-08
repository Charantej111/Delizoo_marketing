import React, { useState, useMemo } from 'react';
import {
  Plus,
  Receipt,
  User,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { CustomSelect } from './ui/CustomSelect';

export function ProjectsTab({
  projects,
  tasks,
  expenses,
  onOpenProjectModal,
  onEditProject,
  onDeleteProject,
  onSelectProjectForExpenses,
  searchQuery
}) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Dynamically extract departments
  const departments = useMemo(() => {
    const set = new Set();
    projects.forEach(p => { if (p.department) set.add(p.department); });
    return ['All', ...Array.from(set)];
  }, [projects]);

  const statuses = ['All', 'Planning', 'In Progress', 'Completed', 'On Hold'];

  // Calculate live project metrics
  const projectMetrics = useMemo(() => {
    const metrics = {};
    projects.forEach(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pExpenses = expenses.filter(e => e.projectId === p.id);
      const totalSpent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const completedTasks = pTasks.filter(t => t.completed || t.status === 'Completed').length;
      
      metrics[p.id] = {
        totalSpent,
        expenseCount: pExpenses.length,
        taskCount: pTasks.length,
        completedTasks,
        budgetBurnPct: p.budget > 0 ? Math.min(Math.round((totalSpent / p.budget) * 100), 100) : 0,
        taskProgressPct: pTasks.length > 0 ? Math.round((completedTasks / pTasks.length) * 100) : (p.progress || 0)
      };
    });
    return metrics;
  }, [projects, tasks, expenses]);

  // Dynamic filter
  const filteredProjects = projects.filter(p => {
    if (selectedDept !== 'All' && p.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchLead = (p.lead || '').toLowerCase().includes(q);
      const matchDept = (p.department || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLead && !matchDept) return false;
    }
    return true;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const ma = projectMetrics[a.id] || { totalSpent: 0, taskProgressPct: 0 };
    const mb = projectMetrics[b.id] || { totalSpent: 0, taskProgressPct: 0 };
    if (sortBy === 'budget-desc') return (Number(b.budget) || 0) - (Number(a.budget) || 0);
    if (sortBy === 'budget-asc') return (Number(a.budget) || 0) - (Number(b.budget) || 0);
    if (sortBy === 'spent-desc') return mb.totalSpent - ma.totalSpent;
    if (sortBy === 'progress-desc') return mb.taskProgressPct - ma.taskProgressPct;
    if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header and Filter Control Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              Project Initiatives
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {projects.length === 0
                ? 'Create campaigns and projects to monitor spending and milestones.'
                : `Tracking ${sortedProjects.length} of ${projects.length} initiatives.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Switcher */}
            {projects.length > 1 && (
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                size="sm"
                className="w-38"
                options={[
                  { value: 'default', label: 'Default Order' },
                  { value: 'budget-desc', label: 'Budget (Highest)' },
                  { value: 'budget-asc', label: 'Budget (Lowest)' },
                  { value: 'spent-desc', label: 'Spend (Highest)' },
                  { value: 'progress-desc', label: 'Progress (Highest)' },
                  { value: 'title-asc', label: 'Title (A-Z)' }
                ]}
              />
            )}

            {/* View Switcher */}
            <div className="flex items-center bg-zinc-100/90 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Table
              </button>
            </div>

            <button
              onClick={onOpenProjectModal}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3 border-t border-zinc-200/50 dark:border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mr-1">Dept:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDept === dept
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                      : 'bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-1 hidden sm:block" />

            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mr-1 hidden sm:inline">Status:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {statuses.map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs'
                      : 'bg-white/70 dark:bg-zinc-800/70 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          type="projects"
          title="No projects created yet"
          description="Projects organize your marketing campaigns, restaurant merchant onboarding, app releases, and operational expenses."
          actionText="Create First Project"
          onAction={onOpenProjectModal}
        />
      ) : sortedProjects.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-12">
          No projects match the selected filter criteria.
        </p>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedProjects.map(proj => {
            const m = projectMetrics[proj.id] || { totalSpent: 0, expenseCount: 0, taskCount: 0, completedTasks: 0, budgetBurnPct: 0, taskProgressPct: 0 };
            const isOverBudget = proj.budget > 0 && m.totalSpent > proj.budget;

            return (
              <div
                key={proj.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold border border-zinc-200/60 dark:border-zinc-700">
                      {proj.department || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.priority === 'Urgent'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : proj.priority === 'High'
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {proj.priority || 'Normal'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === 'Completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : proj.status === 'In Progress'
                          ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {proj.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1 mb-1">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>

                  {/* Lead & Timeline */}
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-4 pb-3 border-b border-zinc-200/50 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">{proj.lead || 'Unassigned'}</span>
                    </div>
                    <div className="font-mono-num text-zinc-400 dark:text-zinc-500 text-[11px]">
                      {proj.endDate ? `Due: ${proj.endDate}` : 'Ongoing'}
                    </div>
                  </div>

                  {/* Budget Progress Gauge */}
                  <div className="space-y-1.5 mb-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Budget Spent</span>
                      <span className={`font-mono-num font-bold ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>
                        ₹{m.totalSpent.toLocaleString('en-IN')} / ₹{Number(proj.budget || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-500' : m.budgetBurnPct > 75 ? 'bg-zinc-600 dark:bg-zinc-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${m.budgetBurnPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks Progress Gauge */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Milestones Done</span>
                      <span className="font-mono-num font-bold text-zinc-800 dark:text-zinc-200">
                        {m.completedTasks} / {m.taskCount} ({m.taskProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${m.taskProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectProjectForExpenses(proj.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                    <span>Ledger ({m.expenseCount})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditProject(proj)}
                      className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/80 border-b border-zinc-200/70 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Actual Spend</th>
                  <th className="py-3 px-4">Milestones</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sortedProjects.map(proj => {
                  const m = projectMetrics[proj.id] || { totalSpent: 0, expenseCount: 0, taskCount: 0, completedTasks: 0 };
                  return (
                    <tr key={proj.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">{proj.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-medium border border-zinc-200/60 dark:border-zinc-700">
                          {proj.department || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          proj.status === 'Completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : proj.status === 'In Progress'
                            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                        }`}>
                          {proj.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 font-medium">{proj.lead || '—'}</td>
                      <td className="py-3.5 px-4 font-mono-num text-zinc-900 dark:text-white">
                        ₹{Number(proj.budget || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{m.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-zinc-500 dark:text-zinc-400">
                        {m.completedTasks} / {m.taskCount}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => onSelectProjectForExpenses(proj.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Expenses ({m.expenseCount})
                        </button>
                        <button
                          onClick={() => onEditProject(proj)}
                          className="p-1 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

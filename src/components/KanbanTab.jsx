import React, { useState, useMemo } from 'react';
import { Plus, User, Trash2, Edit2, CheckSquare, Users, CheckCircle2, Sliders, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { CustomSelect } from './ui/CustomSelect';
import { SPEND_AREAS, DEFAULT_SPEND_AREAS, DEFAULT_PARTNERS, normalizePayerName } from '../services/storage';

export function getAssigneeDetails(assigneeName, partners = DEFAULT_PARTNERS) {
  if (!assigneeName || !assigneeName.trim() || assigneeName.trim().toLowerCase() === 'unassigned') {
    return { name: 'Unassigned', initials: 'UN', color: '#94a3b8', role: 'No Assignee' };
  }
  const norm = normalizePayerName(assigneeName, partners);
  const match = partners.find(p => p.name.toLowerCase() === norm.toLowerCase() || p.name.toLowerCase() === assigneeName.trim().toLowerCase());
  if (match) {
    const parts = match.name.trim().split(/\s+/);
    let initials = '';
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
      initials = match.name.slice(0, 2).toUpperCase();
    }
    return {
      name: match.name,
      initials,
      color: match.color || '#10b981',
      role: match.role || 'Partner'
    };
  }

  const parts = assigneeName.trim().split(/\s+/);
  let initials = '';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else {
    initials = assigneeName.trim().slice(0, 2).toUpperCase();
  }
  return {
    name: assigneeName.trim(),
    initials,
    color: '#6366f1',
    role: 'Assignee'
  };
}

export function KanbanTab({
  tasks = [],
  partners = DEFAULT_PARTNERS,
  spendAreas = DEFAULT_SPEND_AREAS,
  onSaveTask,
  onEditTask,
  onDeleteTask,
  onOpenTaskModal,
  searchQuery
}) {
  const [filterSpendArea, setFilterSpendArea] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');

  const columns = [
    { id: 'To Do', label: 'To Do / Backlog', color: 'bg-zinc-400 dark:bg-zinc-500' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-zinc-700 dark:bg-zinc-300' },
    { id: 'In Review', label: 'In Review', color: 'bg-zinc-500 dark:bg-zinc-400' },
    { id: 'Completed', label: 'Completed', color: 'bg-emerald-500' }
  ];

  // Dynamically compute all operational streams
  const allStreams = useMemo(() => {
    const set = new Set(spendAreas || DEFAULT_SPEND_AREAS);
    tasks.forEach(t => {
      if (t.spendArea?.trim()) set.add(t.spendArea.trim());
    });
    return Array.from(set);
  }, [spendAreas, tasks]);

  // Dynamically compute all unique assignees present
  const allAssignees = useMemo(() => {
    const list = [...partners.map(p => p.name)];
    tasks.forEach(t => {
      if (t.assignee && t.assignee.trim()) {
        const info = getAssigneeDetails(t.assignee, partners);
        if (!list.includes(info.name)) {
          list.push(info.name);
        }
      }
    });
    return list;
  }, [partners, tasks]);

  // Assignee Workload & Overall Task Progress Breakdown Stats
  const teamWorkloadStats = useMemo(() => {
    const map = {};
    partners.forEach(p => {
      map[p.name] = { partner: p, total: 0, completed: 0, sumProgress: 0 };
    });

    tasks.forEach(t => {
      const info = getAssigneeDetails(t.assignee, partners);
      const key = info.name;
      if (!map[key]) {
        map[key] = {
          partner: { name: key, role: info.role, color: info.color },
          total: 0,
          completed: 0,
          sumProgress: 0
        };
      }
      let prog = t.progress;
      if (prog === undefined || prog === null) {
        prog = t.status === 'Completed' ? 100 : 0;
      }
      map[key].total += 1;
      if (t.status === 'Completed' || Number(prog) === 100) {
        map[key].completed += 1;
      }
      map[key].sumProgress += Number(prog) || 0;
    });

    return Object.values(map).map(item => {
      const avgProgress = item.total > 0 ? Math.round(item.sumProgress / item.total) : 0;
      return {
        ...item,
        avgProgress
      };
    });
  }, [tasks, partners]);

  // Dynamic Filtering logic
  const filteredTasks = tasks.filter(t => {
    if (filterSpendArea !== 'All') {
      const area = t.spendArea || '';
      if (area.toLowerCase() !== filterSpendArea.toLowerCase()) return false;
    }
    if (filterAssignee !== 'All') {
      const info = getAssigneeDetails(t.assignee, partners);
      if (info.name.toLowerCase() !== filterAssignee.toLowerCase()) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
      const matchArea = (t.spendArea || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchArea) return false;
    }
    return true;
  });

  const handleStatusChange = (task, newStatus) => {
    let newProgress = task.progress;
    if (newStatus === 'Completed') {
      newProgress = 100;
    } else if (newStatus === 'To Do' && task.progress === 100) {
      newProgress = 0;
    } else if (newStatus === 'In Progress' && (task.progress === 0 || task.progress === 100)) {
      newProgress = 50;
    } else if (newStatus === 'In Review' && (task.progress === 0 || task.progress === 100)) {
      newProgress = 80;
    }

    const updated = {
      ...task,
      status: newStatus,
      progress: newProgress,
      completed: newStatus === 'Completed' || newProgress === 100
    };
    onSaveTask(updated);
  };

  const handleQuickProgressBump = (task, delta) => {
    const curr = Number(task.progress) || 0;
    const next = Math.min(100, Math.max(0, curr + delta));
    let nextStatus = task.status;
    if (next === 100) {
      nextStatus = 'Completed';
    } else if (next === 0 && task.status === 'Completed') {
      nextStatus = 'To Do';
    } else if (next > 0 && next < 100 && (task.status === 'To Do' || task.status === 'Completed')) {
      nextStatus = 'In Progress';
    }

    const updated = {
      ...task,
      progress: next,
      status: nextStatus,
      completed: nextStatus === 'Completed' || next === 100
    };
    onSaveTask(updated);
  };

  const handleToggleChecklist = (task, itemIndex) => {
    const currentCompleted = task.completedItems || [];
    const updatedCompleted = currentCompleted.includes(itemIndex)
      ? currentCompleted.filter(i => i !== itemIndex)
      : [...currentCompleted, itemIndex];

    const totalChecklist = (task.checklist || []).length;
    let computedProg = task.progress;
    let computedStatus = task.status;

    if (totalChecklist > 0) {
      computedProg = Math.round((updatedCompleted.length / totalChecklist) * 100);
      if (computedProg === 100) {
        computedStatus = 'Completed';
      } else if (computedProg < 100 && computedStatus === 'Completed') {
        computedStatus = 'In Progress';
      }
    }

    const updated = {
      ...task,
      completedItems: updatedCompleted,
      progress: computedProg,
      status: computedStatus,
      completed: computedStatus === 'Completed' || computedProg === 100
    };
    onSaveTask(updated);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header and Filter Controls */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-40">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Milestones & Task Progress</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-mono-num font-bold">
              {tasks.length} Total Tasks
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Assign tasks to team partners, monitor progress percentages, and track operational milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Stream Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Stream:</span>
            <CustomSelect
              value={filterSpendArea}
              onChange={setFilterSpendArea}
              size="sm"
              align="left"
              className="w-48 sm:w-56"
              options={[
                { value: 'All', label: 'All Streams' },
                ...allStreams.map(a => ({ value: a, label: a }))
              ]}
            />
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Assigned To:</span>
            <CustomSelect
              value={filterAssignee}
              onChange={setFilterAssignee}
              size="sm"
              align="left"
              className="w-48 sm:w-56"
              options={[
                { value: 'All', label: 'All Assignees' },
                ...allAssignees.map(name => {
                  const info = getAssigneeDetails(name, partners);
                  return {
                    value: name,
                    label: name,
                    sublabel: info.role
                  };
                })
              ]}
            />
          </div>

          <button
            onClick={onOpenTaskModal}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create & Assign Task</span>
          </button>
        </div>
      </div>

      {/* Team Workload & Task Progress Breakdown Widget */}
      {teamWorkloadStats.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Team Workload & Assignee Task Progress
              </h3>
            </div>
            {filterAssignee !== 'All' && (
              <button
                onClick={() => setFilterAssignee('All')}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Clear Assignee Filter (Showing: {filterAssignee})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {teamWorkloadStats.map(({ partner, total, completed, avgProgress }) => {
              const isSelected = filterAssignee.toLowerCase() === partner.name.toLowerCase();
              const info = getAssigneeDetails(partner.name, partners);

              return (
                <div
                  key={partner.name}
                  onClick={() => setFilterAssignee(isSelected ? 'All' : partner.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white border-zinc-900 dark:border-emerald-500 shadow-md scale-[1.02]'
                      : 'bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200/70 dark:border-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate leading-tight">{partner.name}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}>
                        {info.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className={`font-semibold ${isSelected ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {completed}/{total} Completed
                    </span>
                    <span className="font-mono-num font-bold">{avgProgress}%</span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-zinc-700' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${avgProgress}%`,
                        backgroundColor: info.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          type="tasks"
          title="No tasks on the board"
          description="Plan and organize tasks across marketing campaigns, flyer distribution runs, and rider kits."
          actionText="Create & Assign First Task"
          onAction={onOpenTaskModal}
        />
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => (t.status || 'To Do') === col.id);

            return (
              <div
                key={col.id}
                className="glass-panel rounded-2xl p-3.5 sm:p-4 space-y-3 min-h-[440px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold font-mono-num border border-zinc-200/70 dark:border-zinc-700">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-400 dark:text-zinc-500">
                      Empty column
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const completedItems = task.completedItems || [];
                      const totalItems = (task.checklist || []).length;
                      const area = task.spendArea || 'General Operations';
                      const assigneeInfo = getAssigneeDetails(task.assignee, partners);

                      let taskProg = Number(task.progress);
                      if (isNaN(taskProg) || task.progress === undefined) {
                        taskProg = task.status === 'Completed' ? 100 : (totalItems > 0 ? Math.round((completedItems.length / totalItems) * 100) : 0);
                      }

                      return (
                        <div
                          key={task.id}
                          className="bg-white/80 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all space-y-3 relative z-0 hover:z-20 focus-within:z-30"
                        >
                          {/* Tags & Priority */}
                          <div className="flex items-center justify-between gap-1.5 min-w-0">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 truncate min-w-0 flex-1">
                              {area}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                              task.priority === 'Urgent'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : task.priority === 'High'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700'
                            }`}>
                              {task.priority || 'Normal'}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug break-words">
                            {task.title}
                          </h4>

                          {/* Task Progress Bar & Percentage */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-zinc-500 dark:text-zinc-400">Task Progress</span>
                              <div className="flex items-center gap-1 font-mono-num">
                                <span className={
                                  taskProg === 100
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : taskProg >= 50
                                    ? 'text-cyan-600 dark:text-cyan-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }>
                                  {taskProg}%
                                </span>

                                {/* Quick Bump Controls */}
                                <div className="flex items-center gap-0.5 ml-1">
                                  <button
                                    onClick={() => handleQuickProgressBump(task, -25)}
                                    title="-25% progress"
                                    className="px-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <button
                                    onClick={() => handleQuickProgressBump(task, 25)}
                                    title="+25% progress"
                                    className="px-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  taskProg === 100
                                    ? 'bg-emerald-500'
                                    : taskProg >= 50
                                    ? 'bg-cyan-500'
                                    : taskProg > 0
                                    ? 'bg-amber-500'
                                    : 'bg-zinc-300 dark:bg-zinc-700'
                                }`}
                                style={{ width: `${taskProg}%` }}
                              />
                            </div>
                          </div>

                          {/* Sub-task Checklists */}
                          {totalItems > 0 && (
                            <div className="space-y-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-700/70">
                              <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 flex justify-between">
                                <span>Checklist:</span>
                                <span className="font-mono-num">{completedItems.length}/{totalItems}</span>
                              </div>
                              {task.checklist.map((item, idx) => {
                                const isChecked = completedItems.includes(idx);
                                return (
                                   <div
                                     key={idx}
                                     onClick={() => handleToggleChecklist(task, idx)}
                                     className="flex items-start gap-1.5 text-[11px] cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white min-w-0"
                                   >
                                     <input
                                       type="checkbox"
                                       checked={isChecked}
                                       onChange={() => {}}
                                       className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                     />
                                     <span className={`break-words min-w-0 flex-1 ${isChecked ? 'line-through text-zinc-300 dark:text-zinc-600' : ''}`}>
                                       {item}
                                     </span>
                                   </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Assignee Badge & Due Date */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-700/70 text-zinc-500 dark:text-zinc-400 gap-2">
                            {/* Assignee Pill */}
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: assigneeInfo.color }}
                              >
                                {assigneeInfo.initials}
                              </div>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate" title={assigneeInfo.role}>
                                {assigneeInfo.name}
                              </span>
                            </div>

                            {task.dueDate && (
                              <span className="font-mono-num text-zinc-400 dark:text-zinc-500 shrink-0 text-[10px]">
                                {task.dueDate}
                              </span>
                            )}
                          </div>

                          {/* Move Column Selector, Edit & Delete */}
                          <div className="flex items-center justify-between pt-1 gap-1.5">
                            <CustomSelect
                              value={task.status || 'To Do'}
                              onChange={(newStatus) => handleStatusChange(task, newStatus)}
                              size="sm"
                              className="flex-1"
                              options={columns.map(c => ({
                                value: c.id,
                                label: `Move: ${c.label}`
                              }))}
                            />
                            {onEditTask && (
                              <button
                                onClick={() => onEditTask(task)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0 cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Plus, User, Trash2, Edit2, CheckSquare, Search, Sliders, Lock } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { CustomSelect } from './ui/CustomSelect';
import { DEFAULT_SPEND_AREAS, DEFAULT_PARTNERS, normalizePayerName } from '../services/storage';
import { authService } from '../services/authService';

function getAssigneeDetails(assigneeName, partners = DEFAULT_PARTNERS) {
  if (!assigneeName || !assigneeName.trim() || assigneeName.trim().toLowerCase() === 'unassigned') {
    return { name: 'Unassigned', initials: 'UN', role: 'No Assignee' };
  }
  const norm = normalizePayerName(assigneeName, partners);
  const match = partners.find(p => p.name.toLowerCase() === norm.toLowerCase() || p.name.toLowerCase() === assigneeName.trim().toLowerCase());
  if (match) {
    const parts = match.name.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : match.name.slice(0, 2).toUpperCase();
    return {
      name: match.name,
      initials,
      role: match.role || 'Partner'
    };
  }

  const parts = assigneeName.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : assigneeName.trim().slice(0, 2).toUpperCase();
  return {
    name: assigneeName.trim(),
    initials,
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
  searchQuery = '',
  currentUser
}) {
  const [filterSpendArea, setFilterSpendArea] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  React.useEffect(() => {
    if (searchQuery !== undefined) setLocalSearch(searchQuery);
  }, [searchQuery]);

  const columns = [
    { id: 'To Do', label: 'To Do' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'In Review', label: 'In Review' },
    { id: 'Completed', label: 'Completed' }
  ];

  // Dynamically compute streams
  const allStreams = useMemo(() => {
    const set = new Set(spendAreas || DEFAULT_SPEND_AREAS);
    tasks.forEach(t => {
      if (t.spendArea?.trim()) set.add(t.spendArea.trim());
    });
    return ['All', ...Array.from(set)];
  }, [spendAreas, tasks]);

  // Unique assignees
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
    return ['All', ...list];
  }, [partners, tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterSpendArea !== 'All') {
        const area = t.spendArea || '';
        if (area.toLowerCase() !== filterSpendArea.toLowerCase()) return false;
      }
      if (filterAssignee !== 'All') {
        const info = getAssigneeDetails(t.assignee, partners);
        if (info.name.toLowerCase() !== filterAssignee.toLowerCase()) return false;
      }
      if (localSearch) {
        const q = localSearch.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
        const matchArea = (t.spendArea || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAssignee && !matchArea) return false;
      }
      return true;
    });
  }, [tasks, filterSpendArea, filterAssignee, localSearch, partners]);

  const handleStatusChange = (task, newStatus) => {
    let newProgress = task.progress;
    if (newStatus === 'Completed') {
      newProgress = 100;
    } else if (newStatus === 'To Do' && task.progress === 100) {
      newProgress = 0;
    }
    onSaveTask({
      ...task,
      status: newStatus,
      progress: newProgress,
      completed: newStatus === 'Completed'
    });
  };

  const handleProgressChange = (task, e) => {
    const val = Number(e.target.value);
    let newStatus = task.status;
    if (val === 100) {
      newStatus = 'Completed';
    } else if (val > 0 && task.status === 'To Do') {
      newStatus = 'In Progress';
    } else if (val === 0 && task.status === 'Completed') {
      newStatus = 'In Progress';
    }
    onSaveTask({
      ...task,
      progress: val,
      status: newStatus,
      completed: val === 100
    });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Tasks & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Universal milestone tracker. Assigned partners and Lead founder can update progress.
          </p>
        </div>

        <button
          onClick={onOpenTaskModal}
          className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search task title, assignee, stream..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
            />
          </div>

          <CustomSelect
            value={filterSpendArea}
            onChange={(val) => setFilterSpendArea(val)}
            options={allStreams.map(s => ({ value: s, label: s === 'All' ? 'All Operational Streams' : s }))}
            size="sm"
          />

          <CustomSelect
            value={filterAssignee}
            onChange={(val) => setFilterAssignee(val)}
            options={allAssignees.map(a => ({ value: a, label: a === 'All' ? 'All Assignees' : a }))}
            size="sm"
          />
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className="rounded-xl bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col min-h-120"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                    {col.label}
                  </h2>
                  <span className="text-[11px] font-mono-num text-zinc-400">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={onOpenTaskModal}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
                  title="Add Task to this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Cards */}
              <div className="p-2.5 space-y-2.5 flex-1">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => {
                    const assignee = getAssigneeDetails(task.assignee, partners);
                    const progressVal = Number(task.progress) || (task.status === 'Completed' ? 100 : 0);
                    const canEdit = !currentUser || authService.canUpdateTask(task, currentUser, partners);

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                      >
                        {/* Task Title & Action */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-xs text-zinc-950 dark:text-white leading-snug">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {canEdit ? (
                              <>
                                <button
                                  onClick={() => onEditTask(task)}
                                  className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteTask(task.id)}
                                  className="p-1 rounded text-zinc-400 hover:text-rose-600 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <span
                                className="p-1 text-zinc-300 dark:text-zinc-600 cursor-default"
                                title={`Assigned to ${assignee.name}. Only ${assignee.name} or Lead can edit.`}
                              >
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stream / Spend Area */}
                        {task.spendArea && (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {task.spendArea}
                          </div>
                        )}

                        {/* Progress Bar & Slider */}
                        <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                          <div className="flex items-center justify-between text-[10px] font-mono-num text-zinc-500 dark:text-zinc-400">
                            <span>Progress</span>
                            <span className="font-semibold">{progressVal}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progressVal}
                            disabled={!canEdit}
                            onChange={(e) => handleProgressChange(task, e)}
                            className={`w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none accent-zinc-900 dark:accent-white ${
                              canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                            }`}
                            title={canEdit ? 'Update progress' : `Only ${assignee.name} or Lead can update progress`}
                          />
                        </div>

                        {/* Card Footer: Assignee & Move Status */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                              {assignee.initials}
                            </div>
                            <span className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                              {assignee.name}
                            </span>
                          </div>

                          {/* Quick Status Dropdown */}
                          <select
                            value={task.status}
                            disabled={!canEdit}
                            onChange={(e) => handleStatusChange(task, e.target.value)}
                            className={`text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300 outline-none ${
                              canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                            }`}
                            title={canEdit ? 'Change status' : `Only ${assignee.name} or Lead can change status`}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Completed">Completed</option>
                          </select>
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
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { ProjectsTab } from './components/ProjectsTab';
import { KanbanTab } from './components/KanbanTab';
import { ExpensesTab } from './components/ExpensesTab';
import { ReportsTab } from './components/ReportsTab';
import {
  ExpenseModal,
  ProjectModal,
  TaskModal,
  ProofModal,
  ImpactModal
} from './components/Modals';
import { storageService } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectIdForExpenses, setSelectedProjectIdForExpenses] = useState('All');

  // Dark / Light Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('delizoo_theme_preference');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('delizoo_theme_preference', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [proofModalData, setProofModalData] = useState(null); // { expense, project }
  const [impactModalData, setImpactModalData] = useState(null); // { expense, project }

  // Load from local storage
  useEffect(() => {
    const data = storageService.loadAllData();
    setProjects(data.projects || []);
    setTasks(data.tasks || []);
    setExpenses(data.expenses || []);
    setIsLoaded(true);
  }, []);

  // Keyboard shortcut Ctrl+K to search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('header input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamically derived unique payers list from user expenses
  const existingPayers = useMemo(() => {
    const set = new Set();
    expenses.forEach(e => {
      if (e.payer?.trim()) set.add(e.payer.trim());
    });
    return Array.from(set);
  }, [expenses]);

  // Save Handlers
  const handleSaveExpense = useCallback((expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === expense.id);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = expense;
      } else {
        updated = [expense, ...prev];
      }
      storageService.saveExpenses(updated);
      return updated;
    });
  }, []);

  const handleDeleteExpense = useCallback((id) => {
    if (confirm('Delete this expenditure record?')) {
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        storageService.saveExpenses(updated);
        return updated;
      });
    }
  }, []);

  const handleSaveProject = useCallback((project) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === project.id);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = project;
      } else {
        updated = [...prev, project];
      }
      storageService.saveProjects(updated);
      return updated;
    });
  }, []);

  const handleDeleteProject = useCallback((id) => {
    if (confirm('Delete this project? (Associated tasks and expenses will remain in the database)')) {
      setProjects(prev => {
        const updated = prev.filter(p => p.id !== id);
        storageService.saveProjects(updated);
        return updated;
      });
    }
  }, []);

  const handleSaveTask = useCallback((task) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      let updated;
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = task;
      } else {
        updated = [...prev, task];
      }
      storageService.saveTasks(updated);
      return updated;
    });
  }, []);

  const handleDeleteTask = useCallback((id) => {
    if (confirm('Delete this task?')) {
      setTasks(prev => {
        const updated = prev.filter(t => t.id !== id);
        storageService.saveTasks(updated);
        return updated;
      });
    }
  }, []);

  const handleClearData = useCallback(() => {
    if (confirm('Are you sure you want to permanently clear all stored projects, tasks, and expenditures on this device?')) {
      storageService.clearAllData();
      setProjects([]);
      setTasks([]);
      setExpenses([]);
    }
  }, []);

  const handleImportComplete = useCallback((imported) => {
    setProjects(imported.projects || []);
    setTasks(imported.tasks || []);
    setExpenses(imported.expenses || []);
  }, []);

  const handleSelectProjectForExpenses = useCallback((projectId) => {
    setSelectedProjectIdForExpenses(projectId);
    setActiveTab('expenses');
  }, []);

  const handleViewProof = useCallback((expense) => {
    const proj = projects.find(p => p.id === expense.projectId);
    setProofModalData({ expense, project: proj });
  }, [projects]);

  const handleViewImpact = useCallback((expense) => {
    const proj = projects.find(p => p.id === expense.projectId);
    setImpactModalData({ expense, project: proj });
  }, [projects]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-3 border-zinc-900 dark:border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-zinc-900 dark:selection:bg-emerald-500 selection:text-white dark:selection:text-zinc-950 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
        onOpenProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        expenseCount={expenses.length}
        projectCount={projects.length}
        taskCount={tasks.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            projects={projects}
            tasks={tasks}
            expenses={expenses}
            onOpenExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
            onOpenProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
            onViewProof={handleViewProof}
            onViewImpact={handleViewImpact}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            tasks={tasks}
            expenses={expenses}
            onOpenProjectModal={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
            onEditProject={(p) => { setProjectToEdit(p); setIsProjectModalOpen(true); }}
            onDeleteProject={handleDeleteProject}
            onSelectProjectForExpenses={handleSelectProjectForExpenses}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanTab
            tasks={tasks}
            projects={projects}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onOpenTaskModal={() => setIsTaskModalOpen(true)}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            projects={projects}
            onOpenExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
            onEditExpense={(e) => { setExpenseToEdit(e); setIsExpenseModalOpen(true); }}
            onDeleteExpense={handleDeleteExpense}
            onViewProof={handleViewProof}
            onViewImpact={handleViewImpact}
            selectedProjectId={selectedProjectIdForExpenses}
            setSelectedProjectId={setSelectedProjectIdForExpenses}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            projects={projects}
            tasks={tasks}
            expenses={expenses}
            onClearData={handleClearData}
            onImportComplete={handleImportComplete}
          />
        )}
      </main>

      {/* Glassmorphism Footer */}
      <footer className="glass-header py-4 mt-auto no-print border-t border-zinc-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-extrabold text-zinc-900 dark:text-white">DELIZOO EATS</span>
            <span>•</span>
            <span>Food Delivery Operations (Kakinada)</span>
            <span>•</span>
            <a
              href="https://delizoo.in"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:underline font-semibold"
            >
              delizoo.in
            </a>
          </div>
          <div className="flex items-center gap-2 font-mono-num text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local Device Storage (100% Private)</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        projects={projects}
        existingPayers={existingPayers}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        projects={projects}
      />

      <ProofModal
        isOpen={!!proofModalData}
        onClose={() => setProofModalData(null)}
        expense={proofModalData?.expense}
        project={proofModalData?.project}
      />

      <ImpactModal
        isOpen={!!impactModalData}
        onClose={() => setImpactModalData(null)}
        expense={impactModalData?.expense}
        project={impactModalData?.project}
      />
    </div>
  );
}

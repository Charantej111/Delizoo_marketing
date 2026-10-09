import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { KanbanTab } from './components/KanbanTab';
import { ExpensesTab } from './components/ExpensesTab';
import { ReportsTab } from './components/ReportsTab';
import {
  ExpenseModal,
  TaskModal,
  ProofModal,
  ImpactModal,
  PartnerModal
} from './components/Modals';
import { storageService, DEFAULT_PARTNERS } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [partners, setPartners] = useState(DEFAULT_PARTNERS);
  const [spendAreas, setSpendAreas] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpendAreaForExpenses, setSelectedSpendAreaForExpenses] = useState('All');
  const [selectedPayerForExpenses, setSelectedPayerForExpenses] = useState('All');

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
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('delizoo_theme_preference', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const [proofModalData, setProofModalData] = useState(null); // { expense }
  const [impactModalData, setImpactModalData] = useState(null); // { expense }

  // Load from local storage
  useEffect(() => {
    const data = storageService.loadAllData();
    setTasks(data.tasks || []);
    setExpenses(data.expenses || []);
    setPartners(data.partners || DEFAULT_PARTNERS);
    setSpendAreas(data.spendAreas || []);
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

    if (expense.spendArea) {
      handleAddSpendArea(expense.spendArea);
    }
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

    if (task.spendArea) {
      handleAddSpendArea(task.spendArea);
    }
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

  const handleSavePartners = useCallback((newPartners) => {
    setPartners(newPartners);
    storageService.savePartners(newPartners);
  }, []);

  const handleAddSpendArea = useCallback((newArea) => {
    if (!newArea || typeof newArea !== 'string') return;
    const trimmed = newArea.trim();
    if (!trimmed) return;
    setSpendAreas(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      storageService.saveSpendAreas(updated);
      return updated;
    });
  }, []);

  const handleClearData = useCallback(() => {
    if (confirm('Are you sure you want to permanently clear all stored tasks and expenditures on this device?')) {
      storageService.clearAllData();
      setTasks([]);
      setExpenses([]);
      setPartners(DEFAULT_PARTNERS);
      const data = storageService.loadAllData();
      setSpendAreas(data.spendAreas || []);
    }
  }, []);

  const handleImportComplete = useCallback((imported) => {
    setTasks(imported.tasks || []);
    setExpenses(imported.expenses || []);
    setPartners(imported.partners || DEFAULT_PARTNERS);
    setSpendAreas(imported.spendAreas || []);
  }, []);

  const handleSelectPayerForExpenses = useCallback((payerName) => {
    setSelectedPayerForExpenses(payerName);
    setActiveTab('expenses');
  }, []);

  const handleSelectSpendAreaForExpenses = useCallback((spendArea) => {
    setSelectedSpendAreaForExpenses(spendArea);
    setActiveTab('expenses');
  }, []);

  const handleViewProof = useCallback((expense) => {
    setProofModalData({ expense });
  }, []);

  const handleViewImpact = useCallback((expense) => {
    setImpactModalData({ expense });
  }, []);

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
        onOpenPartnerModal={() => setIsPartnerModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        expenseCount={expenses.length}
        taskCount={tasks.length}
        partnerCount={partners.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            tasks={tasks}
            expenses={expenses}
            partners={partners}
            spendAreas={spendAreas}
            onOpenExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
            onOpenPartnerModal={() => setIsPartnerModalOpen(true)}
            onSelectPayerForExpenses={handleSelectPayerForExpenses}
            onSelectSpendAreaForExpenses={handleSelectSpendAreaForExpenses}
            onViewProof={handleViewProof}
            onViewImpact={handleViewImpact}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            expenses={expenses}
            partners={partners}
            spendAreas={spendAreas}
            onOpenExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
            onEditExpense={(e) => { setExpenseToEdit(e); setIsExpenseModalOpen(true); }}
            onDeleteExpense={handleDeleteExpense}
            onViewProof={handleViewProof}
            onViewImpact={handleViewImpact}
            selectedSpendArea={selectedSpendAreaForExpenses}
            setSelectedSpendArea={setSelectedSpendAreaForExpenses}
            selectedPayer={selectedPayerForExpenses}
            setSelectedPayer={setSelectedPayerForExpenses}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanTab
            tasks={tasks}
            partners={partners}
            spendAreas={spendAreas}
            onSaveTask={handleSaveTask}
            onEditTask={(t) => { setTaskToEdit(t); setIsTaskModalOpen(true); }}
            onDeleteTask={handleDeleteTask}
            onOpenTaskModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            tasks={tasks}
            expenses={expenses}
            partners={partners}
            spendAreas={spendAreas}
            onOpenPartnerModal={() => setIsPartnerModalOpen(true)}
            onClearData={handleClearData}
            onImportComplete={handleImportComplete}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="glass-header py-4 mt-auto no-print border-t border-zinc-200/60 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-extrabold text-zinc-900 dark:text-white">DELIZOO</span>
            <span>•</span>
            <span>Kakinada Launch Operations</span>
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
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Private Local Storage</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        partners={partners}
        expenses={expenses}
        spendAreas={spendAreas}
        onAddSpendArea={handleAddSpendArea}
        onOpenPartnerModal={() => { setIsExpenseModalOpen(false); setIsPartnerModalOpen(true); }}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        partners={partners}
        spendAreas={spendAreas}
        onAddSpendArea={handleAddSpendArea}
      />

      <PartnerModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        partners={partners}
        onSavePartners={handleSavePartners}
      />

      <ProofModal
        isOpen={!!proofModalData}
        onClose={() => setProofModalData(null)}
        expense={proofModalData?.expense}
      />

      <ImpactModal
        isOpen={!!impactModalData}
        onClose={() => setImpactModalData(null)}
        expense={impactModalData?.expense}
      />
    </div>
  );
}


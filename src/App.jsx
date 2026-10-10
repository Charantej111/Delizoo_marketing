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
import { LoginModal } from './components/LoginModal';
import { storageService, DEFAULT_PARTNERS } from './services/storage';
import { emailService } from './services/emailService';
import { authService } from './services/authService';
import { FullScreenAuth } from './components/FullScreenAuth';
import { ProductTourModal } from './components/ProductTourModal';

// SPA Route to Tab mappings for seamless Vercel hosting & deep linking
const ROUTE_MAP = {
  '/': 'overview',
  '/overview': 'overview',
  '/expenses': 'expenses',
  '/tasks': 'kanban',
  '/kanban': 'kanban',
  '/reports': 'reports',
  '/audit': 'reports',
  '/signup': 'login',
  '/login': 'login',
  '/signin': 'login',
  '/guide': 'guide',
  '/tour': 'guide'
};

const TAB_PAGE_TITLES = {
  overview: 'Delizoo OS - Executive Dashboard & Operations',
  expenses: 'Delizoo OS - Capital Ledger & Expenses',
  kanban: 'Delizoo OS - Task Execution & Kanban',
  reports: 'Delizoo OS - Audit Reports & Summary',
  signup: 'Delizoo OS - Founder Sign-In',
  login: 'Delizoo OS - Founder Sign-In',
  guide: 'Delizoo OS - Interactive Guide & Tour'
};

function getTabFromPath(pathname = '/') {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const user = authService.getCurrentUser();
  if (!user) {
    return 'login';
  }
  if (clean === '/' || clean === '/login' || clean === '/signin' || clean === '/signup') {
    return 'overview';
  }
  return ROUTE_MAP[clean] || 'overview';
}

function getPathFromTab(tabId) {
  switch (tabId) {
    case 'expenses': return '/expenses';
    case 'kanban': return '/tasks';
    case 'reports': return '/reports';
    case 'signup': return '/signup';
    case 'login': return '/login';
    case 'overview':
    default:
      return '/overview';
  }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'overview';
  });
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [partners, setPartners] = useState(DEFAULT_PARTNERS);
  const [spendAreas, setSpendAreas] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpendAreaForExpenses, setSelectedSpendAreaForExpenses] = useState('All');
  const [selectedPayerForExpenses, setSelectedPayerForExpenses] = useState('All');

  // URL-synchronized tab navigation
  const setActiveTab = useCallback((tabId, options = {}) => {
    const { replace = false, query = {} } = options;
    setActiveTabState(tabId);
    if (typeof window !== 'undefined') {
      const basePath = getPathFromTab(tabId);
      let fullPath = basePath;

      const urlParams = new URLSearchParams();
      if (query.payer && query.payer !== 'All') urlParams.set('payer', query.payer);
      if (query.category && query.category !== 'All') urlParams.set('category', query.category);
      if (query.q) urlParams.set('q', query.q);
      const qs = urlParams.toString();
      if (qs) fullPath += `?${qs}`;

      const currentFullPath = window.location.pathname + window.location.search;
      if (currentFullPath !== fullPath) {
        if (replace) {
          window.history.replaceState({ tab: tabId }, '', fullPath);
        } else {
          window.history.pushState({ tab: tabId }, '', fullPath);
        }
      }
      if (TAB_PAGE_TITLES[tabId]) {
        document.title = TAB_PAGE_TITLES[tabId];
      }
    }
  }, []);

  // Handle browser Back / Forward history navigation and URL search parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Parse initial URL parameters on load
    const params = new URLSearchParams(window.location.search);
    const initialPayer = params.get('payer');
    const initialCategory = params.get('category');
    const initialQuery = params.get('q');
    if (initialPayer) setSelectedPayerForExpenses(initialPayer);
    if (initialCategory) setSelectedSpendAreaForExpenses(initialCategory);
    if (initialQuery) setSearchQuery(initialQuery);

    const initialTab = getTabFromPath(window.location.pathname);
    if (TAB_PAGE_TITLES[initialTab]) {
      document.title = TAB_PAGE_TITLES[initialTab];
    }

    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setActiveTabState(tab);
      const currentParams = new URLSearchParams(window.location.search);
      setSelectedPayerForExpenses(currentParams.get('payer') || 'All');
      setSelectedSpendAreaForExpenses(currentParams.get('category') || 'All');
      if (currentParams.has('q')) {
        setSearchQuery(currentParams.get('q'));
      }
      if (TAB_PAGE_TITLES[tab]) {
        document.title = TAB_PAGE_TITLES[tab];
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Role-Based Auth State
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Tour / Guide State
  const [isTourOpen, setIsTourOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const user = authService.getCurrentUser();
      if (!user) return false;
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      return path.includes('guide') || path.includes('tour') || params.get('tour') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (partners && partners.length > 0) {
      const refreshed = authService.getCurrentUser(partners);
      if (refreshed) {
        setCurrentUser(refreshed);
      }
    }
  }, [partners]);

  // Secured state change listener (e.g. for direct magic link / confirmation redirects)
  useEffect(() => {
    const subscription = authService.initAuthStateListener((user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoginModalOpen(false);
      }
    });
    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = useCallback((partner) => {
    const session = authService.saveSession(partner);
    setCurrentUser(session);
  }, []);

  const handleLogout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
    setActiveTab('login');
  }, [setActiveTab]);

  const handleOpenPartnerModal = useCallback(() => {
    if (currentUser && !currentUser.isLead) {
      alert(`Access Restricted: Only the Lead Founder (${DEFAULT_PARTNERS[0]?.name || 'N Charan Tej'}) can adjust capital pool allocations.`);
      return;
    }
    setIsPartnerModalOpen(true);
  }, [currentUser]);

  // Load from local storage immediately, then 2-way sync with Supabase Cloud
  useEffect(() => {
    // 1. Instant local load
    const data = storageService.loadAllData();
    setTasks(data.tasks || []);
    setExpenses(data.expenses || []);
    setPartners(data.partners || DEFAULT_PARTNERS);
    setSpendAreas(data.spendAreas || []);
    setIsLoaded(true);

    // 2. Fetch live records from Supabase  & auto-push any existing local records
    storageService.syncWithSupabase((synced) => {
      if (synced) {
        if (synced.tasks) setTasks(synced.tasks);
        if (synced.expenses) setExpenses(synced.expenses);
        if (synced.partners && synced.partners.length > 0) setPartners(synced.partners);
        if (synced.spendAreas && synced.spendAreas.length > 0) setSpendAreas(synced.spendAreas);
      }
    });

    // 3. Realtime Supabase listener across team members
    const unsubscribe = storageService.subscribeToRealtime(
      () => {
        storageService.syncWithSupabase(synced => {
          if (synced?.tasks) setTasks(synced.tasks);
        });
      },
      () => {
        storageService.syncWithSupabase(synced => {
          if (synced?.expenses) setExpenses(synced.expenses);
        });
      },
      () => {
        storageService.syncWithSupabase(synced => {
          if (synced?.partners) setPartners(synced.partners);
        });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
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

  // Save Handlers with Supabase cloud persistence & Gmail notifications
  const handleSaveExpense = useCallback((expense) => {
    const isNew = !expenses.some(e => e.id === expense.id);

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

    // Push item to Supabase  database
    storageService.saveExpenseItem(expense);

    // Send email alert to founders via Gmail SMTP when expense is recorded
    if (isNew) {
      emailService.sendExpenseLoggedAlert(expense, partners)
        .then(result => {
          if (result && result.success) {
            console.log('[Email Alert Sent]: Expense notification sent to founders.', result);
          } else {
            console.warn('[Email Alert Notice]:', result);
          }
        })
        .catch(err => {
          console.error('[Email Alert Error]:', err);
        });
    }

    if (expense.spendArea) {
      handleAddSpendArea(expense.spendArea);
    }
  }, [expenses, partners]);

  const handleDeleteExpense = useCallback((id) => {
    if (confirm('Delete this expenditure record?')) {
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        storageService.saveExpenses(updated);
        return updated;
      });
      // Delete from Supabase
      storageService.deleteExpenseItem(id);
    }
  }, []);

  const handleSaveTask = useCallback((task) => {
    const existing = tasks.find(t => t.id === task.id);
    const isNewOrReassigned = (!existing && task.assignee) || (existing && task.assignee && existing.assignee !== task.assignee);

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

    // Push item to Supabase  database
    storageService.saveTaskItem(task);

    // Send email alert to assigned partner via Gmail SMTP if new or reassigned
    if (isNewOrReassigned) {
      emailService.sendTaskAssignedAlert(task, partners);
    }

    if (task.spendArea) {
      handleAddSpendArea(task.spendArea);
    }
  }, [tasks, partners]);

  const handleDeleteTask = useCallback((id) => {
    if (confirm('Delete this task?')) {
      setTasks(prev => {
        const updated = prev.filter(t => t.id !== id);
        storageService.saveTasks(updated);
        return updated;
      });
      // Delete from Supabase
      storageService.deleteTaskItem(id);
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
    setActiveTab('expenses', { query: { payer: payerName } });
  }, [setActiveTab]);

  const handleSelectSpendAreaForExpenses = useCallback((spendArea) => {
    setSelectedSpendAreaForExpenses(spendArea);
    setActiveTab('expenses', { query: { category: spendArea } });
  }, [setActiveTab]);

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

  // Private Founder OS: Guard all routes behind authentication
  if (!currentUser || activeTab === 'signup' || activeTab === 'login' || isLoginModalOpen) {
    return (
      <FullScreenAuth
        initialMode="signin"
        onLoginSuccess={(partner) => {
          handleLoginSuccess(partner);
          setActiveTab('overview');
          setIsLoginModalOpen(false);
        }}
        onBackToApp={currentUser ? () => {
          setActiveTab('overview');
          setIsLoginModalOpen(false);
        } : null}
        currentUser={currentUser}
        partners={partners}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-zinc-900 dark:selection:bg-emerald-500 selection:text-white dark:selection:text-zinc-950 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExpenseModal={() => { setExpenseToEdit(null); setIsExpenseModalOpen(true); }}
        onOpenTaskModal={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
        onOpenPartnerModal={handleOpenPartnerModal}
        onOpenTour={() => setIsTourOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        expenseCount={expenses.length}
        taskCount={tasks.length}
        partnerCount={partners.length}
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onOpenLoginModal={() => { setActiveTab('login'); setIsLoginModalOpen(true); }}
        onLogout={handleLogout}
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
            onOpenPartnerModal={handleOpenPartnerModal}
            onOpenTour={() => setIsTourOpen(true)}
            onSelectPayerForExpenses={handleSelectPayerForExpenses}
            onSelectSpendAreaForExpenses={handleSelectSpendAreaForExpenses}
            onViewProof={handleViewProof}
            onViewImpact={handleViewImpact}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
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
            currentUser={currentUser}
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
            currentUser={currentUser}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            tasks={tasks}
            expenses={expenses}
            partners={partners}
            spendAreas={spendAreas}
            onOpenPartnerModal={handleOpenPartnerModal}
            onClearData={handleClearData}
            onImportComplete={handleImportComplete}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-5 mt-auto no-print border-t border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <img src="/logo.png" alt="Delizoo Logo" className="w-4 h-4 object-contain" />
            <span className="font-semibold text-zinc-900 dark:text-white">Delizoo OS</span>
            <span>•</span>
            <span>Kakinada Operations</span>
            <span>•</span>
            <a
              href="https://delizoo.in"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:underline"
            >
              delizoo.in
            </a>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono-num">
            Supabase  • Cloud & Local Cache Synced
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
        onOpenPartnerModal={() => { setIsExpenseModalOpen(false); handleOpenPartnerModal(); }}
        currentUser={currentUser}
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        partners={partners}
      />

      <ProductTourModal
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          if (activeTab === 'guide') setActiveTab('overview');
        }}
        onExploreLedger={() => {
          setIsTourOpen(false);
          setActiveTab('expenses');
        }}
        onExploreKanban={() => {
          setIsTourOpen(false);
          setActiveTab('kanban');
        }}
      />
    </div>
  );
}


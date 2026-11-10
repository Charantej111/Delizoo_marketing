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
  PartnerModal,
  ExpenseStatusPopup,
  DeleteConfirmationModal
} from './components/Modals';
import { LoginModal } from './components/LoginModal';
import { storageService, DEFAULT_PARTNERS } from './services/storage';
import { emailService } from './services/emailService';
import { authService } from './services/authService';
import { FullScreenAuth } from './components/FullScreenAuth';
import { ProductTourModal } from './components/ProductTourModal';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  if (clean === '/' || clean === '/overview') {
    return 'overview';
  }
  if (clean === '/expenses') {
    return 'expenses';
  }
  if (clean === '/tasks' || clean === '/kanban') {
    return 'kanban';
  }
  if (clean === '/reports' || clean === '/audit') {
    return 'reports';
  }
  if (clean === '/tour' || clean === '/guide') {
    return 'guide';
  }
  if (clean === '/login' || clean === '/signin' || clean === '/signup') {
    return 'login';
  }
  return ROUTE_MAP[clean] || 'overview';
}

function getPathFromTab(tabId) {
  switch (tabId) {
    case 'expenses': return '/expenses';
    case 'kanban': return '/tasks';
    case 'reports': return '/reports';
    case 'guide': return '/tour';
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

    // Sync filter states cleanly
    setSelectedPayerForExpenses(query.payer || 'All');
    setSelectedSpendAreaForExpenses(query.category || 'All');
    if (query.q !== undefined) {
      setSearchQuery(query.q);
    }

    if (tabId === 'guide') {
      setIsTourOpen(true);
    }

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
  const [expenseStatusPopup, setExpenseStatusPopup] = useState(null); // { isOpen, status, isEdit, expense, error, cloudSynced, emailDispatched }
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

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
        setCurrentUser(prev => {
          if (
            prev &&
            prev.id === refreshed.id &&
            prev.name === refreshed.name &&
            prev.email === refreshed.email &&
            prev.isLead === refreshed.isLead
          ) {
            return prev;
          }
          return refreshed;
        });
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
    // 1. Instant local load with guaranteed completion
    try {
      const data = storageService.loadAllData();
      if (data) {
        setTasks(data.tasks || []);
        setExpenses(data.expenses || []);
        setPartners(data.partners || DEFAULT_PARTNERS);
        setSpendAreas(data.spendAreas || []);
      }
    } catch (err) {
      console.error('[Error loading local data]:', err);
    } finally {
      setIsLoaded(true);
    }

    // 2. Fetch live records from Supabase  & auto-push any existing local records
    storageService.syncWithSupabase((synced) => {
      if (synced) {
        if (synced.tasks) setTasks(synced.tasks);
        if (synced.expenses) setExpenses(synced.expenses);
        if (synced.partners && synced.partners.length > 0) setPartners(synced.partners);
        if (synced.spendAreas && synced.spendAreas.length > 0) setSpendAreas(synced.spendAreas);
      }
    });

    // 3. Realtime Supabase listener across team members (Mobile <-> Desktop)
    const unsubscribe = storageService.subscribeToRealtime(
      (payload) => {
        if (payload?.eventType === 'DELETE' && payload.old?.id) {
          const delId = String(payload.old.id).trim();
          setTasks(prev => prev.filter(t => String(t.id).trim() !== delId));
        }
        storageService.syncWithSupabase(synced => {
          if (synced?.tasks) setTasks(synced.tasks);
        });
      },
      (payload) => {
        if (payload?.eventType === 'DELETE' && payload.old?.id) {
          const delId = String(payload.old.id).trim();
          setExpenses(prev => prev.filter(e => String(e.id).trim() !== delId));
        }
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

    // 4. Auto-resync when switching back to this tab / window (e.g. after editing on Mobile)
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        storageService.syncWithSupabase(synced => {
          if (synced) {
            if (synced.tasks) setTasks(synced.tasks);
            if (synced.expenses) setExpenses(synced.expenses);
            if (synced.partners && synced.partners.length > 0) setPartners(synced.partners);
            if (synced.spendAreas && synced.spendAreas.length > 0) setSpendAreas(synced.spendAreas);
          }
        });
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
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

  // Spend Area Helper
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

  // Save Handlers with Supabase cloud persistence, Gmail notifications & Info Popup feedback
  const handleSaveExpense = useCallback(async (expense) => {
    const isNew = !expenses.some(e => e.id === expense.id);

    try {
      const idx = expenses.findIndex(e => e.id === expense.id);
      let updated;
      if (idx >= 0) {
        updated = [...expenses];
        updated[idx] = expense;
      } else {
        updated = [expense, ...expenses];
      }

      // 1. Commit to Local Storage immediately
      storageService.saveExpenses(updated);
      setExpenses(updated);

      if (expense.spendArea) {
        handleAddSpendArea(expense.spendArea);
      }

      // 2. Synchronize item with Supabase cloud database
      const cloudRes = await storageService.saveExpenseItem(expense);

      // 3. Send email alert to founders via Gmail SMTP when expense is recorded
      let emailDispatched = false;
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
        emailDispatched = true;
      }

      // 4. Trigger Info Popup for Success
      const isCloudSuccess = cloudRes ? cloudRes.success !== false : true;
      setExpenseStatusPopup({
        isOpen: true,
        status: 'success',
        isEdit: !isNew,
        expense,
        cloudSynced: isCloudSuccess,
        cloudError: cloudRes?.error,
        emailDispatched
      });

      return { success: true, expense };
    } catch (err) {
      console.error('[handleSaveExpense Error]:', err);
      // Trigger Info Popup for Failure
      setExpenseStatusPopup({
        isOpen: true,
        status: 'failed',
        isEdit: !isNew,
        expense,
        error: err.message || 'Failed to commit expenditure to ledger.'
      });
      return { success: false, error: err.message };
    }
  }, [expenses, partners, handleAddSpendArea]);

  const handleDeleteExpense = useCallback((expenseOrId) => {
    let target = null;
    if (typeof expenseOrId === 'object' && expenseOrId !== null) {
      target = expenseOrId;
    } else {
      target = expenses.find(e => String(e.id).trim() === String(expenseOrId).trim());
    }
    if (!target) {
      console.warn('[handleDeleteExpense]: Target expense not found for', expenseOrId);
      return;
    }
    setExpenseToDelete(target);
    setIsDeleteModalOpen(true);
  }, [expenses]);

  const handleConfirmDelete = useCallback(async (expense) => {
    if (!expense || !expense.id) return;
    setIsDeletingExpense(true);

    try {
      const targetId = String(expense.id).trim();

      // 1. Optimistically remove from frontend state and local cache
      setExpenses(prev => {
        const updated = prev.filter(e => String(e.id).trim() !== targetId);
        storageService.saveExpenses(updated, false);
        return updated;
      });

      // 2. Perform database and persistent local cache deletion
      const deleteRes = await storageService.deleteExpenseItem(targetId);

      setIsDeletingExpense(false);
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);

      if (deleteRes && deleteRes.success === false) {
        console.error('[Delete Failed]:', deleteRes.error);
        setExpenseStatusPopup({
          isOpen: true,
          status: 'failed',
          expense,
          error: deleteRes.error || 'Failed to delete expenditure from Supabase database.'
        });
      } else {
        // 3. Show notification popup that expenditure was deleted successfully
        setExpenseStatusPopup({
          isOpen: true,
          status: 'deleted',
          expense,
          cloudSynced: true
        });
      }
    } catch (err) {
      console.error('[handleConfirmDelete Error]:', err);
      setIsDeletingExpense(false);
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      setExpenseStatusPopup({
        isOpen: true,
        status: 'failed',
        expense,
        error: err.message || 'An error occurred while deleting the expenditure.'
      });
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
  }, [tasks, partners, handleAddSpendArea]);

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
          if (activeTab === 'login' || activeTab === 'signup') {
            setActiveTab('overview');
          } else {
            setActiveTab(activeTab);
          }
          setIsLoginModalOpen(false);
        }}
        onBackToApp={currentUser ? () => {
          if (activeTab === 'login' || activeTab === 'signup') {
            setActiveTab('overview');
          }
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
        onOpenTour={() => { setActiveTab('guide'); setIsTourOpen(true); }}
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
        <ErrorBoundary onReset={() => setActiveTab('overview')}>
          {(activeTab === 'overview' || activeTab === 'guide') && (
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
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="py-5 mt-auto no-print border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/30 dark:bg-zinc-950/30 text-xs text-zinc-500 dark:text-zinc-400">
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
              className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:underline"
            >
              delizoo.in
            </a>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono-num flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Cloud Sync Active</span>
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

      {/* Info Popup for Recorded or Failed Expense Feedback */}
      <ExpenseStatusPopup
        isOpen={!!expenseStatusPopup?.isOpen}
        onClose={() => setExpenseStatusPopup(null)}
        status={expenseStatusPopup?.status || 'success'}
        isEdit={expenseStatusPopup?.isEdit || false}
        expense={expenseStatusPopup?.expense}
        cloudSynced={expenseStatusPopup?.cloudSynced ?? true}
        cloudError={expenseStatusPopup?.cloudError}
        emailDispatched={expenseStatusPopup?.emailDispatched || false}
        error={expenseStatusPopup?.error}
        partners={partners}
        expenses={expenses}
        onRecordAnother={() => {
          setExpenseStatusPopup(null);
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onViewInLedger={(exp) => {
          setExpenseStatusPopup(null);
          setActiveTab('expenses');
        }}
        onRetry={(failedExpense) => {
          setExpenseStatusPopup(null);
          setExpenseToEdit(failedExpense);
          setIsExpenseModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal with Detailed Verification */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletingExpense) {
            setIsDeleteModalOpen(false);
            setExpenseToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        expense={expenseToDelete}
        isDeleting={isDeletingExpense}
        partners={partners}
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


import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt,
  CheckSquare,
  Compass,
  Building2,
  Users,
  Check,
  Mail,
  FileSpreadsheet,
  Layers,
  ChevronRight
} from 'lucide-react';

export function ProductTourModal({ isOpen, onClose, onExploreLedger, onExploreKanban }) {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'purpose',
      badge: 'Platform Purpose',
      badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
      title: 'Welcome to Delizoo OS',
      subtitle: 'The Executive Command Center for Kakinada Launch Operations',
      description: 'Delizoo OS is a private, real-time operating system engineered exclusively for the 6 co-founders of Delizoo. It centralizes all pre-launch financial governance, capital allocation, vendor disbursements, and marketing execution in one unified system.',
      visual: (
        <div className="p-4 rounded-xl bg-zinc-900 text-white border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Delizoo Logo" className="w-5 h-5 rounded object-contain" />
              <span className="text-xs font-bold tracking-tight">Delizoo OS</span>
            </div>
            <span className="text-[10px] font-mono-num text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live  Synced
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono-num">
            <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <div className="text-[10px] text-zinc-400">Total Pool</div>
              <div className="text-xs font-bold text-white mt-0.5">₹1,60,000</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <div className="text-[10px] text-zinc-400">Co-Founders</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">6 Partners</div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <div className="text-[10px] text-zinc-400">Market</div>
              <div className="text-xs font-bold text-blue-400 mt-0.5">Kakinada</div>
            </div>
          </div>
        </div>
      ),
      highlights: [
        '100% Real Supabase Cloud Data — Zero fake or mock figures',
        'Private OS Gatekeeper: Only the 6 authorized co-founders can sign in',
        'Multi-device synchronization across mobile and desktop devices'
      ]
    },
    {
      id: 'capital',
      badge: 'Financial Governance',
      badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      title: 'Capital Pool & Founder Allocations',
      subtitle: 'Committed Capital Governance Across 6 Partners',
      description: 'The platform tracks the committed capital pool of ₹1,60,000. Every time an expense is logged, the individual partner’s disbursed amount and remaining balance adjust dynamically.',
      visual: (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-white pb-1 border-b border-zinc-200 dark:border-zinc-700">
            <span>Founder</span>
            <span>Allocated Capital</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono-num text-zinc-600 dark:text-zinc-300">
            <div className="flex justify-between p-1.5 rounded bg-white dark:bg-zinc-800">
              <span>G Pavan</span>
              <strong className="text-zinc-900 dark:text-white">₹50,000</strong>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-white dark:bg-zinc-800">
              <span>M Nareen</span>
              <strong className="text-zinc-900 dark:text-white">₹50,000</strong>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-white dark:bg-zinc-800">
              <span>N Charan Tej (Lead)</span>
              <strong className="text-zinc-900 dark:text-white">₹20,000</strong>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-white dark:bg-zinc-800">
              <span>Dheeraj</span>
              <strong className="text-zinc-900 dark:text-white">₹20,000</strong>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-white dark:bg-zinc-800">
              <span>G Sunil</span>
              <strong className="text-zinc-900 dark:text-white">₹10,000</strong>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-white dark:bg-zinc-800">
              <span>J Sandeep</span>
              <strong className="text-zinc-900 dark:text-white">₹10,000</strong>
            </div>
          </div>
        </div>
      ),
      highlights: [
        'Personal burn rate and liquid balance tracked automatically',
        'Lead Founder (Charan) holds exclusive authority to adjust capital allocations',
        'Complete transparency: all 6 partners see real-time pool utilization'
      ]
    },
    {
      id: 'ledger',
      badge: 'Zero-Leakage Ledger',
      badgeColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
      title: 'Disbursement Ledger & Payment Proofs',
      subtitle: 'UTR Audit Trail & Automated Email Alerts',
      description: 'Record expenditures with payee, vendor, operational stream, and UTR transaction numbers. Attach digital payment proofs (receipt images or payment links) to eliminate unaccounted cash burn.',
      visual: (
        <div className="p-3.5 rounded-xl bg-zinc-900 text-white border border-zinc-800 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Record Expense Modal</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
              Instant Gmail Alert
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-xs">₹3,450 • Flyers & Print</span>
              <span className="text-[10px] text-zinc-400 font-mono-num">UTR: 4291882910</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Payer: <strong className="text-zinc-200">G Sunil</strong> • Vendor: <strong className="text-zinc-200">Kakinada Print Hub</strong>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-0.5">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Automated alert delivered to all 6 co-founders on disbursement</span>
          </div>
        </div>
      ),
      highlights: [
        'Click "View Proof" on any expense to inspect the payment screenshot',
        'Automatic transactional email sent to all 6 founders when expenses are recorded',
        'Filter by founder or category (/expenses?payer=Sunil) for audit reviews'
      ]
    },
    {
      id: 'kanban',
      badge: 'Execution Engine',
      badgeColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
      title: 'Operational Task Kanban',
      subtitle: 'Organized Execution Across Marketing & Setup Streams',
      description: 'Coordinate tasks across operational streams: Digital Marketing, Flyers & Canvassing, Store Setup, and Logistics. Drag cards through Backlog, In Progress, Review, and Done.',
      visual: (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
          <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold text-center">
            <div className="p-1.5 rounded bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200">
              Backlog
            </div>
            <div className="p-1.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              In Progress
            </div>
            <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
              Review
            </div>
            <div className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Done
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
            <div className="font-semibold text-zinc-900 dark:text-white">Store Canopy & Standee Installation</div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1">
              <span>Assignee: <strong>G Pavan</strong></span>
              <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">Urgent</span>
            </div>
          </div>
        </div>
      ),
      highlights: [
        'Automated Assignment Alerts: Assigned founders receive email alerts with deadlines',
        'Role-Based Progress: Partners update their own operational deliverables',
        'Real-time board synchronization across devices'
      ]
    },
    {
      id: 'playbook',
      badge: 'Founder Daily Playbook',
      badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
      title: 'How to Use: Daily Founder Workflow',
      subtitle: 'Best Practices for the Delizoo Sprint',
      description: 'Follow this rhythm to maintain 100% financial accuracy and operational velocity as we approach the Kakinada market launch:',
      visual: (
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </div>
            <div>
              <strong className="text-zinc-950 dark:text-white block">Morning Check-In</strong>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Open the <strong>Tasks</strong> tab to inspect your assigned deliverables and deadlines.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </div>
            <div>
              <strong className="text-zinc-950 dark:text-white block">Immediate Disbursement Logging</strong>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Whenever paying a vendor, record the expense immediately with UTR and receipt screenshot.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
            <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              3
            </div>
            <div>
              <strong className="text-zinc-950 dark:text-white block">Audit & Account Switching</strong>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Click your profile in the top-right to view your personal burn or switch founder accounts.</span>
            </div>
          </div>
        </div>
      ),
      highlights: [
        'Accessible anytime: Click "OS Guide" in the top navigation bar',
        'Deep-linking supported: Bookmark /expenses or /tasks for direct 1-click access',
        'Full CSV & JSON exports available in Reports tab for offline audits'
      ]
    }
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep(prev => prev - 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, steps.length, onClose]);

  const stepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 dark:bg-black/85 backdrop-blur-sm animate-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80">
              <Compass className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white leading-tight">
                  Delizoo OS Interactive Guide
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${stepData.badgeColor}`}>
                  {stepData.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num mt-0.5">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Guide (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">

          {/* Step Headline */}
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              {stepData.title}
            </h2>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
              {stepData.subtitle}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-2">
              {stepData.description}
            </p>
          </div>

          {/* Interactive Visual Preview Box */}
          <div className="rounded-xl overflow-hidden">
            {stepData.visual}
          </div>

          {/* Highlight Points */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Core Principles & Rules
            </span>
            <div className="space-y-1.5">
              {stepData.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">

          {/* Step Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${currentStep === idx
                    ? 'w-6 bg-zinc-900 dark:bg-white'
                    : 'w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
                  }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Previous / Next Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finish Guide & Start</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

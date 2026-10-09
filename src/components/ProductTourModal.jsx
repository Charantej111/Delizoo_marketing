import React, { useState, useEffect } from 'react';
import { Sun, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export function ProductTourModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'purpose',
      tabLabel: '01 Overview',
      stepNumber: '01',
      leftHeadline: 'One shared space for all 6 founders.',
      leftSubtext: 'Delizoo Kakinada Launch Operations',
      title: 'What is Delizoo OS?',
      subtitle: 'A private dashboard to manage launch money and work together.',
      content: (
        <div className="space-y-3.5 text-sm text-zinc-600 leading-relaxed">
          <p>
            Delizoo OS keeps all 6 co-founders aligned on one screen during our Kakinada launch.
          </p>

          <div className="space-y-2">
            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block text-xs mb-0.5">Track Capital & Spends</span>
              <p className="text-xs text-zinc-500 leading-normal">
                Log every rupee spent with UTR numbers and receipt proofs. No missing UPI screenshots.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block text-xs mb-0.5">Stay on Track</span>
              <p className="text-xs text-zinc-500 leading-normal">
                Manage launch deliverables on the Kanban board and assign tasks with due dates.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block text-xs mb-0.5">Private to Founders</span>
              <p className="text-xs text-zinc-500 leading-normal">
                Only the 6 registered founder emails can sign in with OTP verification.
              </p>
            </div>
          </div>
        </div>
      ),
      buttonLabel: 'Next: Capital Pool'
    },
    {
      id: 'capital',
      tabLabel: '02 Capital Pool',
      stepNumber: '02',
      leftHeadline: '₹1,60,000 pool tracked live.',
      leftSubtext: 'Committed Founder Capital',
      title: 'The Capital Pool',
      subtitle: 'How founder contributions and balances work.',
      content: (
        <div className="space-y-3.5 text-sm text-zinc-600 leading-relaxed">
          <p>
            Our launch budget is an aggregate pool of <strong className="text-zinc-950 font-semibold">₹1,60,000</strong> committed across the 6 partners:
          </p>

          <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="font-medium text-zinc-800">G Pavan & M Nareen</span>
              <span className="font-semibold text-zinc-950">₹50,000 each</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="font-medium text-zinc-800">N Charan Tej & Dheeraj Bathi</span>
              <span className="font-semibold text-zinc-950">₹20,000 each</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-medium text-zinc-800">G Sunil & J Sandeep</span>
              <span className="font-semibold text-zinc-950">₹10,000 each</span>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Whenever anyone logs an expense, their personal spent amount increases and remaining balance updates automatically.
          </p>
        </div>
      ),
      buttonLabel: 'Next: Recording Expenses'
    },
    {
      id: 'ledger',
      tabLabel: '03 Expenses',
      stepNumber: '03',
      leftHeadline: 'Log spending with proof in 30 seconds.',
      leftSubtext: 'UTR Reference • Instant Email Alerts',
      title: 'How to Log an Expense',
      subtitle: 'Keep our ledger balanced whenever you spend on Delizoo.',
      content: (
        <div className="space-y-3.5 text-sm text-zinc-600 leading-relaxed">
          <p>
            Paid a printer, canopy installer, or marketing ad? Add it in three simple steps:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block mb-0.5">1. Click "+ Record Expense"</span>
              <p className="text-zinc-500">Found in the top bar. Fill in the amount, who paid, and vendor name.</p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block mb-0.5">2. Attach Payment Proof</span>
              <p className="text-zinc-500">Paste the UTR number or link your screenshot receipt for audit proof.</p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block mb-0.5">3. Automatic Email Alerts</span>
              <p className="text-zinc-500">All 6 co-founders instantly receive an email alert with the spend details.</p>
            </div>
          </div>
        </div>
      ),
      buttonLabel: 'Next: Daily Tasks'
    },
    {
      id: 'playbook',
      tabLabel: '04 Tasks',
      stepNumber: '04',
      leftHeadline: 'Coordinate work. Launch on time.',
      leftSubtext: 'Kanban Board • Daily Sync',
      title: 'Managing Launch Tasks',
      subtitle: 'How the team collaborates every day.',
      content: (
        <div className="space-y-3.5 text-sm text-zinc-600 leading-relaxed">
          <p>
            Use the <strong className="text-zinc-950 font-semibold">Tasks</strong> tab to divide and track launch deliverables:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block mb-0.5">Kanban Board</span>
              <p className="text-zinc-500">Move cards across Backlog → In Progress → Review → Done.</p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block mb-0.5">Task Assignment & Alerts</span>
              <p className="text-zinc-500">Assign a deliverable to any founder; they receive an email reminder immediately.</p>
            </div>

            <div className="p-3 rounded-xl border border-gray-100 bg-zinc-50/70">
              <span className="font-semibold text-zinc-900 block mb-0.5">Switch Profiles Easily</span>
              <p className="text-zinc-500">Click your avatar in the top-right to view your personal burn or switch profiles.</p>
            </div>
          </div>
        </div>
      ),
      buttonLabel: 'Enter Delizoo OS'
    }
  ];

  // Keyboard navigation (Arrow keys + Escape)
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

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xs select-none animate-in">
      
      {/* Centered Split Card Container matching signin page exactly */}
      <div className="w-full relative max-w-5xl max-h-[92vh] flex flex-col md:flex-row shadow-2xl rounded-2xl sm:rounded-3xl border border-zinc-800 bg-white overflow-hidden">
        
        {/* Left Artistic Dark Panel (Desktop only) */}
        <div className="hidden md:flex bg-black text-white p-8 md:p-12 md:w-1/2 relative overflow-hidden flex-col justify-between min-h-[520px] lg:min-h-[580px] shrink-0">
          {/* Top Gradient Overlay */}
          <div className="w-full h-full z-2 absolute inset-0 bg-gradient-to-t from-transparent via-black/40 to-black pointer-events-none"></div>
          
          {/* Fluted Vertical Glass Pillars */}
          <div className="flex absolute inset-0 z-2 overflow-hidden backdrop-blur-2xl pointer-events-none">
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
            <div className="h-[45rem] z-2 w-[4.5rem] bg-gradient-to-r from-[#ffffff00] via-[#000000] via-[69%] to-[#ffffff30] opacity-30 overflow-hidden"></div>
          </div>

          {/* Luminous Glowing Orbs at Bottom */}
          <div className="w-[16rem] h-[16rem] bg-orange-500 absolute z-1 rounded-full -bottom-10 -left-10 blur-xl opacity-90"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-8 blur-xl opacity-70"></div>
          <div className="w-[8rem] h-[5rem] bg-white absolute z-1 rounded-full bottom-0 left-20 blur-xl opacity-70"></div>

          {/* Top Logo & Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Delizoo Logo" className="w-7 h-7 rounded-lg object-contain" />
              <span className="text-sm font-bold tracking-tight text-white">Delizoo OS</span>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/20">
              Guide • {step.stepNumber} of 04
            </span>
          </div>

          {/* Hero Headline */}
          <div className="relative z-10 my-auto py-10">
            <h1 className="text-2xl md:text-3xl font-medium leading-tight tracking-tight text-white max-w-sm transition-all duration-300">
              {step.leftHeadline}
            </h1>
            <p className="text-xs text-zinc-400 mt-3 font-mono">
              {step.leftSubtext}
            </p>
          </div>

          {/* Bottom Founder Tag */}
          <div className="relative z-10 text-xs text-zinc-400 font-mono-num flex items-center justify-between">
            <span>Kakinada Launch Operations</span>
            <span className="text-zinc-500">Private OS</span>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="p-5 sm:p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-between bg-white text-zinc-900 z-10 relative overflow-y-auto max-h-[92vh] md:max-h-none">
          
          {/* Top Sunburst, Brand & Close Button */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="text-orange-500">
                <Sun className="h-8 w-8 text-orange-500" />
              </div>
              <div className="md:hidden">
                <span className="text-xs font-bold text-zinc-900 block leading-tight">Delizoo OS</span>
                <span className="text-[10px] text-zinc-400 font-mono">Guide • {step.stepNumber} of 04</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Close Guide (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Clean Segmented Tab Bar */}
          <div className="flex items-center gap-1 border-b border-gray-100 pb-2.5 my-3 overflow-x-auto scrollbar-none">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  currentStep === idx
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {s.tabLabel}
              </button>
            ))}
          </div>

          {/* Slide Main Content */}
          <div className="my-auto py-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-medium mb-1 tracking-tight text-zinc-950">
              {step.title}
            </h2>
            <p className="text-left text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">
              {step.subtitle}
            </p>

            <div className="animate-in fade-in duration-200">
              {step.content}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between mt-3 sm:mt-4 gap-2">
            
            {/* Step Dots Indicator */}
            <div className="flex items-center gap-1.5 shrink-0">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-5 sm:w-6 bg-orange-500'
                      : 'w-2 bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={`Jump to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg border border-gray-300 text-xs font-medium text-zinc-700 hover:bg-gray-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-medium py-2 px-3.5 sm:py-2.5 sm:px-5 rounded-lg text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{step.buttonLabel}</span>
                {currentStep < steps.length - 1 ? (
                  <ArrowRight className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

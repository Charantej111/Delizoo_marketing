import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Custom Glassmorphism Date Picker Calendar
 * Supports seamless Dark and Light themes with fluid month navigation.
 */
export function CustomDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  required = false,
  className = '',
  triggerClassName = '',
  size = 'md', // 'sm' | 'md'
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial view year and month from value or today
  const getInitialYearMonth = () => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const [viewDate, setViewDate] = useState(getInitialYearMonth());

  // Keep viewDate updated when value changes from outside
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewDate({ year: y, month: m - 1 });
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleYearChange = (e) => {
    const yr = Number(e.target.value);
    setViewDate(prev => ({ ...prev, year: yr }));
  };

  const handleSelectDay = (day) => {
    const mm = String(viewDate.month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateString = `${viewDate.year}-${mm}-${dd}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    setViewDate({ year: yyyy, month: today.getMonth() });
    onChange(dateString);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const firstDayIndex = new Date(viewDate.year, viewDate.month, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewDate.year, viewDate.month, 0).getDate();

  // Today representation
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  // Format value for display
  const formatDisplay = (val) => {
    if (!val) return null;
    try {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
      return val;
    } catch {
      return val;
    }
  };

  const isSmall = size === 'sm';

  // Year options: past 5 years to future 5 years
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-all outline-none rounded-xl font-medium ${
          isSmall
            ? 'px-2.5 py-1.5 text-xs'
            : 'px-3 py-2 text-xs sm:text-sm'
        } ${
          isOpen
            ? 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-emerald-500 shadow-sm ring-2 ring-zinc-900/10 dark:ring-emerald-500/20'
            : 'glass-input hover:bg-white/90 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className={`font-mono-num truncate ${value ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500'}`}>
            {formatDisplay(value) || placeholder}
          </span>
        </div>

        {value && !required && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all cursor-pointer"
            title="Clear date"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-72 rounded-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-3.5 select-none animate-in fade-in-0 zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header Month / Year Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900 dark:text-white">
              <span>{MONTH_NAMES[viewDate.month]}</span>
              <select
                value={viewDate.year}
                onChange={handleYearChange}
                className="bg-transparent font-bold text-zinc-900 dark:text-white cursor-pointer outline-none hover:text-zinc-600 dark:hover:text-zinc-300 dark:bg-zinc-900"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y} className="dark:bg-zinc-900 dark:text-white">{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center my-2">
            {DAYS_SHORT.map((d, idx) => (
              <span
                key={d}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Trailing days from previous month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const prevMonthDay = daysInPrevMonth - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-7 flex items-center justify-center text-[11px] font-mono-num text-zinc-300 dark:text-zinc-600 pointer-events-none"
                >
                  {prevMonthDay}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mm = String(viewDate.month + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const currentCellDate = `${viewDate.year}-${mm}-${dd}`;
              const isSelected = value === currentCellDate;
              const isToday = todayStr === currentCellDate;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-[11px] font-mono-num transition-all relative ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-black shadow-2xs scale-105'
                      : isToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300/80 dark:border-emerald-700/60 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Controls */}
          <div className="pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2 py-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold transition-all flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Today</span>
            </button>

            {value && !required && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

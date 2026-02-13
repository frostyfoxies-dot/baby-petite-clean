'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import { Input, InputProps } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/**
 * Date input component props
 */
export interface DateInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /**
   * Date value
   */
  value?: Date | string | null;
  /**
   * Callback when date value changes
   */
  onChange?: (date: Date | null) => void;
  /**
   * Date format for display
   * @default "MM/DD/YYYY"
   */
  format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  /**
   * Minimum date
   */
  minDate?: Date | string;
  /**
   * Maximum date
   */
  maxDate?: Date | string;
  /**
   * Whether to show calendar picker
   * @default true
   */
  showCalendar?: boolean;
  /**
   * Whether to show calendar icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Input size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Placeholder text
   * @default "Select date"
   */
  placeholder?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Date picker input
 * 
 * @example
 * ```tsx
 * <DateInput
 *   value={date}
 *   onChange={setDate}
 *   minDate={new Date()}
 *   format="DD/MM/YYYY"
 * />
 * ```
 */
export function DateInput({
  value,
  onChange,
  format = 'MM/DD/YYYY',
  minDate,
  maxDate,
  showCalendar = true,
  showIcon = true,
  size = 'md',
  placeholder = 'Select date',
  className,
  ...props
}: DateInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Parse date value
  const parsedValue = React.useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
  }, [value]);

  // Parse min/max dates
  const parsedMinDate = React.useMemo(() => {
    if (!minDate) return null;
    if (minDate instanceof Date) return minDate;
    return new Date(minDate);
  }, [minDate]);

  const parsedMaxDate = React.useMemo(() => {
    if (!maxDate) return null;
    if (maxDate instanceof Date) return maxDate;
    return new Date(maxDate);
  }, [maxDate]);

  // Format date for display
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
      default:
        return `${month}/${day}/${year}`;
    }
  };

  // Update input value when date changes
  React.useEffect(() => {
    if (parsedValue) {
      setInputValue(formatDate(parsedValue));
    } else {
      setInputValue('');
    }
  }, [parsedValue, format]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Try to parse the input
    const parsed = parseInput(e.target.value, format);
    if (parsed) {
      onChange?.(parsed);
    }
  };

  // Parse input string to date
  const parseInput = (input: string, fmt: string): Date | null => {
    const parts = input.split(/[\/\-]/);
    if (parts.length !== 3) return null;

    let day: number, month: number, year: number;

    switch (fmt) {
      case 'DD/MM/YYYY':
        [day, month, year] = parts.map(Number);
        break;
      case 'YYYY-MM-DD':
        [year, month, day] = parts.map(Number);
        break;
      case 'MM/DD/YYYY':
      default:
        [month, day, year] = parts.map(Number);
        break;
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;

    return date;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    onChange?.(date);
    setIsOpen(false);
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get calendar days
  const getCalendarDays = (): (Date | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month, getDaysInMonth(year, month));
    const startDay = firstDay.getDay();
    const endDay = lastDay.getDay();

    const days: (Date | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Empty cells after last day
    const remainingCells = 42 - days.length; // 6 rows x 7 days
    for (let i = 0; i < remainingCells; i++) {
      days.push(null);
    }

    return days;
  };

  // Navigate month
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (parsedMinDate && date < parsedMinDate) return true;
    if (parsedMaxDate && date > parsedMaxDate) return true;
    return false;
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    if (!parsedValue) return false;
    return (
      date.getDate() === parsedValue.getDate() &&
      date.getMonth() === parsedValue.getMonth() &&
      date.getFullYear() === parsedValue.getFullYear()
    );
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11',
    lg: 'h-13 text-lg',
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {showIcon && (
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          onClick={() => showCalendar && setIsOpen(true)}
          readOnly={showCalendar}
          className={cn(
            showIcon && 'pl-10',
            showCalendar && 'cursor-pointer',
            sizeClasses[size]
          )}
          {...props}
        />
      </div>

      {/* Calendar dialog */}
      {showCalendar && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="p-0 w-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  ←
                </Button>
                <div className="text-sm font-semibold">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  →
                </Button>
              </div>

              {/* Week days */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-500 text-center py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="w-8 h-8" />;
                  }

                  const disabled = isDateDisabled(date);
                  const selected = isDateSelected(date);
                  const today = isToday(date);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !disabled && handleDateSelect(date)}
                      disabled={disabled}
                      className={cn(
                        'w-8 h-8 text-sm rounded-md transition-colors',
                        'hover:bg-gray-100',
                        'focus:outline-none focus:ring-2 focus:ring-yellow',
                        selected && 'bg-yellow text-white hover:bg-yellow-dark',
                        today && !selected && 'font-semibold',
                        disabled && 'text-gray-300 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

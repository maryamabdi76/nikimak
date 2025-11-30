'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import React, { forwardRef, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Icon } from '@iconify/react';
import { formatDateTimeForDisplay } from '@/lib/displayUtils';

export const DatePicker = forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
  }
>(({ value, onChange, onBlur }, ref) => {
  // Parse date value - handle both YYYY-MM-DD and ISO strings
  const parseDateValue = (val: string): Date | null => {
    if (!val) return null;

    // If it's YYYY-MM-DD format, parse it in local timezone
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [year, month, day] = val.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Otherwise, try parsing as ISO string
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const [date, setDate] = useState<Date | null>(
    value ? parseDateValue(value) : null
  );
  const [open, setOpen] = useState(false);

  // Update date state when value prop changes
  useEffect(() => {
    if (value) {
      const newDate = parseDateValue(value);
      if (newDate) {
        setTimeout(() => {
          setDate(newDate);
        }, 0);
      }
    } else {
      setTimeout(() => {
        setDate(null);
      }, 0);
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Format date to YYYY-MM-DD in local timezone (not UTC)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = () => {
    if (date && onChange) {
      // Format in local timezone to avoid timezone shift issues
      const localDateString = formatDateLocal(date);
      onChange(localDateString);
    }
    setOpen(false);
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            data-empty={!date}
            className="w-full border-slate-700/50 bg-slate-900/50 text-slate-200 hover:bg-slate-800/70 hover:border-slate-600/50 dark:bg-slate-900/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70"
            onBlur={onBlur}
          >
            <Icon
              icon="fluent:calendar-24-regular"
              className="text-slate-400"
            />
            {date ? (
              formatDateTimeForDisplay(date.toISOString(), 'fa-IR', {
                includeTime: false,
              })
            ) : (
              <span className="text-slate-400">Select date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
          <div className="flex flex-col">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={date || undefined}
              onSelect={handleDateSelect}
            />
            <div className="flex justify-end gap-2 border-t p-3">
              <Button size="sm" onClick={handleSubmit} disabled={!date}>
                Submit
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

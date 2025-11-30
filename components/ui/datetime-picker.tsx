'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Icon } from '@iconify/react';
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDateTimeForDisplay } from '@/lib/displayUtils';

// Reusable datetime picker component that works with React Hook Form
export const DateTimePicker = React.forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    minuteInterval?: number; // 15, 30, 60, etc.
    minTime?: string; // "07:00"
    maxTime?: string; // "18:00"
    defaultTime?: string; // "07:00"
    disabledTimes?: string[]; // ["12:00", "13:00"]
    disablePastDates?: boolean; // Disable dates before today
  }
>(
  (
    {
      value,
      onChange,
      onBlur,
      minuteInterval = 15,
      minTime = '07:00',
      maxTime = '18:00',
      defaultTime = '07:00',
      disabledTimes = [],
      disablePastDates = false,
    },
    ref
  ) => {
    const [date, setDate] = React.useState<Date | null>(
      value ? new Date(value) : null
    );
    const [open, setOpen] = React.useState(false);

    // Update date state when value prop changes
    React.useEffect(() => {
      if (value) {
        const newDate = new Date(value);
        if (!isNaN(newDate.getTime())) {
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

    // Generate appointment time slots based on props
    const generateTimeSlots = (): Array<{
      value: string;
      display: string;
      disabled: boolean;
    }> => {
      const slots: Array<{
        value: string;
        display: string;
        disabled: boolean;
      }> = [];

      // Parse min and max times
      const [minHour, minMinute] = minTime.split(':').map(Number);
      const [maxHour, maxMinute] = maxTime.split(':').map(Number);

      // Check if selected date is today
      const isToday = date
        ? (() => {
            const today = new Date();
            const selectedDate = new Date(date);
            return today.toDateString() === selectedDate.toDateString();
          })()
        : false;

      // Get current time if today is selected
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      for (let hour = minHour; hour <= maxHour; hour++) {
        const startMinute = hour === minHour ? minMinute : 0;
        const endMinute = hour === maxHour ? maxMinute : 59;

        for (
          let minute = startMinute;
          minute <= endMinute;
          minute += minuteInterval
        ) {
          if (minute >= 60) break;

          const timeString = `${hour.toString().padStart(2, '0')}:${minute
            .toString()
            .padStart(2, '0')}`;
          const isDisabledByTime = disabledTimes.includes(timeString);

          // Disable past times if today is selected and disablePastDates is true
          const isPastTime =
            disablePastDates &&
            isToday &&
            (hour < currentHour ||
              (hour === currentHour && minute < currentMinute));

          const isDisabled = isDisabledByTime || isPastTime;

          slots.push({
            value: timeString,
            display: timeString,
            disabled: isDisabled,
          });
        }
      }
      return slots;
    };

    const timeSlots = generateTimeSlots();

    // Function to check if a date should be disabled
    const isDateDisabled = (date: Date): boolean => {
      if (!disablePastDates) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0); // Set to start of the date to check

      return checkDate < today;
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        const newDate = new Date(selectedDate);

        // If there's already a selected time, preserve it
        if (date) {
          newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
        } else {
          // Only set to default time if no time was previously selected
          const [hours, minutes] = defaultTime.split(':').map(Number);
          newDate.setHours(hours, minutes, 0, 0);
        }

        setDate(newDate);
        onChange?.(newDate.toISOString());
      }
    };

    const handleTimeSlotSelect = (timeValue: string) => {
      if (date) {
        const [hours, minutes] = timeValue.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        setDate(newDate);
        onChange?.(newDate.toISOString());
      }
    };

    const handleSubmit = () => {
      if (date && onChange) {
        onChange(date.toISOString());
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
              className="w-full"
              onBlur={onBlur}
            >
              <Icon icon="fluent:calendar-24-regular" />
              {date ? (
                formatDateTimeForDisplay(date.toISOString(), 'fa-IR')
              ) : (
                <span>Select date and time</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="flex flex-col">
              <div className="flex divide-x">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={date || undefined}
                  onSelect={handleDateSelect}
                  disabled={disablePastDates ? isDateDisabled : undefined}
                />
                {/* Appointment Time Slots */}
                <div className="flex flex-col">
                  {/* <div className="bg-muted/50 text-muted-foreground px-3 py-2 text-center text-xs font-medium">
                    {t("select-time")}
                  </div> */}
                  <ScrollArea className="h-72 w-28">
                    <div className="space-y-1 p-3">
                      {timeSlots.map((slot) => {
                        const isSelected =
                          date &&
                          date.getHours() ===
                            parseInt(slot.value.split(':')[0]) &&
                          date.getMinutes() ===
                            parseInt(slot.value.split(':')[1]);

                        return (
                          <Button
                            key={slot.value}
                            size="sm"
                            variant={isSelected ? 'default' : 'ghost'}
                            disabled={slot.disabled}
                            className={cn(
                              'w-full justify-center text-sm transition-all duration-200',
                              isSelected
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : slot.disabled
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-muted'
                            )}
                            onClick={() =>
                              !slot.disabled && handleTimeSlotSelect(slot.value)
                            }
                          >
                            {slot.display}
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Action Buttons */}

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
  }
);

DateTimePicker.displayName = 'DateTimePicker';

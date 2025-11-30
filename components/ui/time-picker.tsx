'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/displayUtils';

// Modern time picker component with enhanced UX
export const TimePicker = React.forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    minuteInterval?: number; // 15, 30, 60, etc.
    disablePastTimes?: boolean; // Disable times before current time
  }
>(
  (
    { value, onChange, onBlur, minuteInterval = 15, disablePastTimes = false },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    // Helper function to parse time value
    const parseTimeValue = (timeValue: string): Date | null => {
      if (!timeValue) return null;

      try {
        const isoDate = new Date(timeValue);
        if (!isNaN(isoDate.getTime())) {
          return isoDate;
        }

        const timeMatch = timeValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

          if (
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59 &&
            seconds >= 0 &&
            seconds <= 59
          ) {
            const today = new Date();
            today.setHours(hours, minutes, seconds, 0);
            return today;
          }
        }

        return null;
      } catch {
        return null;
      }
    };

    const [time, setTime] = React.useState<Date | null>(() =>
      parseTimeValue(value || '')
    );

    // Update time state when value prop changes
    React.useEffect(() => {
      const parsedTime = parseTimeValue(value || '');
      setTime(parsedTime);
    }, [value]);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from(
      { length: 60 / minuteInterval },
      (_, i) => i * minuteInterval
    );

    // Function to check if a time should be disabled (if it's in the past)
    const isTimeDisabled = (hour: number, minute: number): boolean => {
      if (!disablePastTimes) return false;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Convert 12-hour format to 24-hour format for comparison
      const time24Hour = hour === 12 ? 0 : hour;
      const actualHour = time24Hour + (time && time.getHours() >= 12 ? 12 : 0);

      // If the time is before current time, disable it
      return (
        actualHour < currentHour ||
        (actualHour === currentHour && minute < currentMinute)
      );
    };

    const handleTimeChange = (
      type: 'hour' | 'minute' | 'ampm',
      value: string
    ) => {
      const currentTime = time || new Date();
      const newTime = new Date(currentTime);

      if (type === 'hour') {
        newTime.setHours(
          (parseInt(value) % 12) + (newTime.getHours() >= 12 ? 12 : 0)
        );
      } else if (type === 'minute') {
        newTime.setMinutes(parseInt(value));
      } else if (type === 'ampm') {
        const currentHours = newTime.getHours();
        newTime.setHours(
          value === 'PM' ? currentHours + 12 : currentHours - 12
        );
      }

      setTime(newTime);
    };

    const handleSubmit = () => {
      if (time && onChange) {
        const timeString = `${time
          .getHours()
          .toString()
          .padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        onChange(timeString);
      }
      setOpen(false);
    };

    const formatTimeDisplay = (date: Date) => {
      return formatDate(date, 'fa-IR', {
        hour: 'numeric',
        minute: '2-digit',
      });
    };

    return (
      <div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              data-empty={!time}
              className="w-full"
              onBlur={onBlur}
            >
              <Icon icon="fluent:clock-24-regular" className="mr-2 h-4 w-4" />
              {time ? formatTimeDisplay(time) : <span>Select time</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="flex flex-col">
              {/* Time Selection Grid */}
              <div className="flex divide-x">
                {/* Hours */}
                <div className="flex flex-col">
                  <div className="bg-muted/50 text-muted-foreground px-1 py-2 text-center text-xs font-medium">
                    Hour
                  </div>
                  <ScrollArea className="h-48 w-14">
                    <div className="space-y-1 p-2">
                      {hours.map((hour) => {
                        const isDisabled = isTimeDisabled(
                          hour,
                          time?.getMinutes() || 0
                        );
                        return (
                          <Button
                            key={hour}
                            size="sm"
                            variant={
                              time && time.getHours() % 12 === hour % 12
                                ? 'default'
                                : 'ghost'
                            }
                            disabled={isDisabled}
                            className={cn(
                              'w-full justify-center text-sm transition-all duration-200',
                              time && time.getHours() % 12 === hour % 12
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : isDisabled
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => {
                              if (!isDisabled) {
                                handleTimeChange('hour', hour.toString());
                              }
                            }}
                          >
                            {hour}
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Minutes */}
                <div className="flex flex-col">
                  <div className="bg-muted/50 text-muted-foreground px-1 py-2 text-center text-xs font-medium">
                    Minute
                  </div>
                  <ScrollArea className="h-48 w-14">
                    <div className="space-y-1 p-2">
                      {minutes.map((minute) => {
                        const isDisabled = isTimeDisabled(
                          time?.getHours() || 0,
                          minute
                        );
                        return (
                          <Button
                            key={minute}
                            size="sm"
                            variant={
                              time && time.getMinutes() === minute
                                ? 'default'
                                : 'ghost'
                            }
                            disabled={isDisabled}
                            className={cn(
                              'w-full justify-center text-sm transition-all duration-200',
                              time && time.getMinutes() === minute
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : isDisabled
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => {
                              if (!isDisabled) {
                                handleTimeChange('minute', minute.toString());
                              }
                            }}
                          >
                            {minute.toString().padStart(2, '0')}
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* AM/PM */}
                <div className="flex flex-col">
                  <div className="bg-muted/50 text-muted-foreground px-1 py-2 text-center text-xs font-medium">
                    AM/PM
                  </div>
                  <div className="h-48 w-14 space-y-1 p-2">
                    {['AM', 'PM'].map((ampm) => (
                      <Button
                        key={ampm}
                        size="sm"
                        variant={
                          time &&
                          ((ampm === 'AM' && time.getHours() < 12) ||
                            (ampm === 'PM' && time.getHours() >= 12))
                            ? 'default'
                            : 'ghost'
                        }
                        className={cn(
                          'w-full justify-center text-sm font-medium transition-all duration-200',
                          time &&
                            ((ampm === 'AM' && time.getHours() < 12) ||
                              (ampm === 'PM' && time.getHours() >= 12))
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => {
                          handleTimeChange('ampm', ampm);
                        }}
                      >
                        {ampm}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t p-3">
                <Button size="sm" onClick={handleSubmit} disabled={!time}>
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

TimePicker.displayName = 'TimePicker';

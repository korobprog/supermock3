'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, startOfWeek, isBefore, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
    value?: string;
    onChange: (value: string) => void;
    minDateTime?: string;
    error?: string;
}

export default function DateTimePicker({ value, onChange, minDateTime, error }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedHour, setSelectedHour] = useState<number>(value ? new Date(value).getHours() : new Date().getHours());
    const [selectedMinute, setSelectedMinute] = useState<number>(value ? new Date(value).getMinutes() : 0);

    const minDate = minDateTime ? new Date(minDateTime) : new Date();
    const minHour = minDate.getHours();
    const minMinute = minDate.getMinutes();

    useEffect(() => {
        if (value) {
            const date = new Date(value);
            setSelectedDate(date);
            setSelectedHour(date.getHours());
            setSelectedMinute(date.getMinutes());
        }
    }, [value]);

    const handleDateSelect = (date: Date) => {
        const isPast = isBefore(date, new Date());
        const isTodaySelected = isToday(date);
        
        if (isPast && !isTodaySelected) return;
        
        setSelectedDate(date);
        
        // Если выбрана сегодняшняя дата, устанавливаем минимальное время
        if (isTodaySelected && minDateTime) {
            const min = new Date(minDateTime);
            const roundedMinute = Math.ceil(min.getMinutes() / 15) * 15;
            if (roundedMinute >= 60) {
                setSelectedHour((min.getHours() + 1) % 24);
                setSelectedMinute(0);
            } else {
                setSelectedHour(min.getHours());
                setSelectedMinute(roundedMinute);
            }
        } else {
            // Для будущих дат устанавливаем время на 00:00
            setSelectedHour(0);
            setSelectedMinute(0);
        }
    };

    const handleConfirm = () => {
        if (!selectedDate) return;

        const dateTime = new Date(selectedDate);
        dateTime.setHours(selectedHour);
        dateTime.setMinutes(selectedMinute);
        dateTime.setSeconds(0);
        dateTime.setMilliseconds(0);

        // Форматируем для datetime-local
        const year = dateTime.getFullYear();
        const month = String(dateTime.getMonth() + 1).padStart(2, '0');
        const day = String(dateTime.getDate()).padStart(2, '0');
        const hours = String(dateTime.getHours()).padStart(2, '0');
        const mins = String(dateTime.getMinutes()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}T${hours}:${mins}`;

        onChange(formatted);
        setIsOpen(false);
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = startOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: addDays(calendarEnd, 6) });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const isDateDisabled = (date: Date) => {
        return isBefore(date, new Date()) && !isToday(date);
    };

    const isTimeDisabled = (hour: number, minute: number) => {
        if (!selectedDate) return false;
        const isTodaySelected = isToday(selectedDate);
        if (!isTodaySelected) return false;
        
        if (hour < minHour) return true;
        if (hour === minHour && minute < minMinute) return true;
        return false;
    };

    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (!isTimeDisabled(hour, minute)) {
                timeSlots.push({ hour, minute });
            }
        }
    }

    const displayValue = value ? format(new Date(value), 'PPpp') : '';

    return (
        <div className="space-y-2">
            <div className="relative">
                <Input
                    readOnly
                    value={displayValue}
                    onClick={() => setIsOpen(true)}
                    placeholder="Select date and time"
                    className={cn("pr-10 cursor-pointer", error && "border-destructive")}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Date & Time</DialogTitle>
                        <DialogDescription>
                            Choose a future date and time for your interview (15-minute intervals)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Calendar */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={prevMonth}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <h3 className="font-semibold">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={nextMonth}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                                        {day}
                                    </div>
                                ))}
                                {days.map((day) => {
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isDisabled = isDateDisabled(day);
                                    const isCurrentDay = isToday(day);

                                    return (
                                        <button
                                            key={day.toString()}
                                            type="button"
                                            onClick={() => handleDateSelect(day)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "aspect-square p-2 text-sm rounded-md transition-colors",
                                                isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                                                isSelected && "bg-primary text-primary-foreground",
                                                !isSelected && !isDisabled && "hover:bg-accent",
                                                isDisabled && "opacity-50 cursor-not-allowed",
                                                isCurrentDay && !isSelected && "ring-2 ring-primary"
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Selection */}
                        {selectedDate && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="w-4 h-4" />
                                    Select Time (15-minute intervals)
                                </div>
                                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                    {timeSlots.map(({ hour, minute }) => {
                                        const isSelected = selectedHour === hour && selectedMinute === minute;
                                        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                                        
                                        return (
                                            <button
                                                key={`${hour}-${minute}`}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedHour(hour);
                                                    setSelectedMinute(minute);
                                                }}
                                                className={cn(
                                                    "px-3 py-2 text-sm rounded-md border transition-colors",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "hover:bg-accent border-border"
                                                )}
                                            >
                                                {timeStr}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={!selectedDate}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}


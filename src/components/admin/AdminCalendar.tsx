"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, CalendarDays, Clock,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  color: string;
  description?: string;
}

const EVENT_COLORS = [
  { label: "Цэнхэр",    value: "bg-blue-500",    text: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/30" },
  { label: "Ногоон",    value: "bg-emerald-500",  text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  { label: "Улаан",     value: "bg-red-500",      text: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/30" },
  { label: "Шар",       value: "bg-amber-500",    text: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/30" },
  { label: "Нил ягаан", value: "bg-purple-500",   text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/30" },
];

const MONTH_NAMES_MN = ["1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
                         "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар"];
const DAY_NAMES_MN = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Багш нарын уулзалт",      date: formatToday(0),  time: "10:00", color: "bg-blue-500" },
  { id: "2", title: "Системийн шинэчлэл",       date: formatToday(3),  time: "14:00", color: "bg-amber-500" },
  { id: "3", title: "Шинэ курс нэвтрүүлэх",    date: formatToday(7),  time: "09:00", color: "bg-emerald-500" },
  { id: "4", title: "Сарын тайлан",             date: formatToday(14), time: "16:00", color: "bg-purple-500" },
  { id: "5", title: "Техник засвар",             date: formatToday(-2), time: "22:00", color: "bg-red-500" },
];

function formatToday(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Make Monday = 0
}

export function AdminCalendar() {
  const { t } = useLanguage();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>(SAMPLE_EVENTS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "", color: "bg-blue-500", description: "" });
  const [view, setView] = useState<"month" | "list">("month");

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = today.toISOString().slice(0, 10);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function getDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getEventsForDate(dateStr: string): CalendarEvent[] {
    return events.filter((e) => e.date === dateStr);
  }

  const addEvent = useCallback(() => {
    if (!newEvent.title.trim() || !selectedDate) return;
    setEvents((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newEvent.title.trim(), date: selectedDate, time: newEvent.time, color: newEvent.color, description: newEvent.description },
    ]);
    setNewEvent({ title: "", time: "", color: "bg-blue-500", description: "" });
    setShowAddForm(false);
  }, [newEvent, selectedDate]);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main calendar */}
      <div className="lg:col-span-2 bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-muted dark:hover:bg-slate-700 flex items-center justify-center text-muted-foreground dark:text-muted-foreground/60 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base font-bold text-foreground dark:text-slate-100 min-w-[140px] text-center">
              {MONTH_NAMES_MN[month]} {year}
            </h2>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-muted dark:hover:bg-slate-700 flex items-center justify-center text-muted-foreground dark:text-muted-foreground/60 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              className="px-3 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted/50 dark:hover:bg-slate-700 text-foreground dark:text-slate-200 transition-colors"
            >
              {t("calendar.today")}
            </button>
            <div className="flex border border-border dark:border-border rounded-lg overflow-hidden">
              {(["month", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn("px-3 py-1.5 text-xs font-medium transition-colors", view === v
                    ? "bg-violet-600 dark:bg-muted text-white dark:text-foreground"
                    : "text-muted-foreground dark:text-muted-foreground/60 hover:bg-muted/50 dark:hover:bg-slate-700")}
                >
                  {v === "month" ? t("calendar.month") : "Жагсаалт"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {view === "month" ? (
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES_MN.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground/80 dark:text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = getDateStr(day);
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedDate(dateStr); setShowAddForm(false); }}
                    className={cn(
                      "relative min-h-[70px] p-1.5 rounded-xl border transition-all text-left",
                      isSelected
                        ? "border-border dark:border-border bg-muted/50 dark:bg-slate-700"
                        : "border-transparent hover:border-border dark:hover:border-border hover:bg-muted/50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isToday
                        ? "bg-violet-600 dark:bg-white text-white dark:text-foreground"
                        : "text-foreground dark:text-slate-200"
                    )}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} className={cn("text-[10px] px-1 py-0.5 rounded truncate text-white font-medium", ev.color)}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground/80 px-1">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {upcomingEvents.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground/80">{t("calendar.noEvents")}</div>
            ) : upcomingEvents.map((ev) => {
              const colorDef = EVENT_COLORS.find((c) => c.value === ev.color) ?? EVENT_COLORS[0];
              return (
                <div key={ev.id} className={cn("flex items-center gap-3 p-3 rounded-xl", colorDef.bg)}>
                  <div className={cn("w-1 h-10 rounded-full shrink-0", ev.color)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", colorDef.text)}>{ev.title}</p>
                    <p className="text-xs text-muted-foreground/80">{ev.date}{ev.time && ` · ${ev.time}`}</p>
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Selected date panel */}
        {selectedDate ? (
          <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground dark:text-slate-100">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("mn-MN", { month: "long", day: "numeric" })}
                </h3>
                <p className="text-xs text-muted-foreground/80">{selectedEvents.length} үйл явдал</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 dark:bg-muted text-white dark:text-foreground rounded-lg text-xs font-medium hover:bg-violet-500 dark:hover:bg-white transition-colors"
              >
                <Plus size={12} /> {t("calendar.addEvent")}
              </button>
            </div>

            {showAddForm && (
              <div className="space-y-3 mb-4 p-3 bg-muted/50 dark:bg-slate-700/50 rounded-xl border border-border dark:border-border">
                <input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addEvent()}
                  placeholder={t("calendar.eventTitle")}
                  className="w-full px-2.5 py-2 text-xs border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  autoFocus
                />
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent((p) => ({ ...p, time: e.target.value }))}
                  className="w-full px-2.5 py-2 text-xs border border-border dark:border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-slate-100 focus:outline-none"
                />
                <div className="flex gap-1.5">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setNewEvent((p) => ({ ...p, color: c.value }))}
                      className={cn("w-6 h-6 rounded-full transition-all", c.value, newEvent.color === c.value && "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500")}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addEvent} className="flex-1 py-1.5 bg-violet-600 dark:bg-muted text-white dark:text-foreground rounded-lg text-xs font-medium hover:bg-violet-500 transition-colors">
                    {t("common.save")}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="flex-1 py-1.5 border border-border dark:border-border text-muted-foreground dark:text-muted-foreground/60 rounded-lg text-xs hover:bg-muted/50 dark:hover:bg-slate-700 transition-colors">
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 py-4 text-center">{t("calendar.noEvents")}</p>
              ) : selectedEvents.map((ev) => {
                const colorDef = EVENT_COLORS.find((c) => c.value === ev.color) ?? EVENT_COLORS[0];
                return (
                  <div key={ev.id} className={cn("flex items-center gap-2 p-2.5 rounded-lg", colorDef.bg)}>
                    <div className={cn("w-1 h-8 rounded-full shrink-0", ev.color)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium", colorDef.text)}>{ev.title}</p>
                      {ev.time && (
                        <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                          <Clock size={9} /> {ev.time}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-8 text-center">
            <CalendarDays size={32} className="mx-auto text-muted-foreground/60 dark:text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground/80">Огноо сонгоно уу</p>
          </div>
        )}

        {/* Upcoming events */}
        <div className="bg-white dark:bg-[#1e1b4b] rounded-xl border border-border dark:border-border p-4">
          <h3 className="text-sm font-semibold text-foreground dark:text-slate-100 mb-3">Ойрын үйл явдлууд</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground/80 py-2 text-center">{t("calendar.noEvents")}</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((ev) => {
                return (
                  <div key={ev.id} className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedDate(ev.date)}>
                    <div className={cn("w-2 h-2 rounded-full shrink-0", ev.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground/80">{ev.date}{ev.time && ` · ${ev.time}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

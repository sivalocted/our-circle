import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  Plane,
  Cake,
  Flame,
  Award,
  Pencil,
} from 'lucide-react';
import {
  calendarStore,
  type FamilyEvent,
  type EventCategory,
} from '../../services/calendarStore';
import { authStore } from '../../services/authStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';
import confetti from 'canvas-confetti';
import { getISTDateString } from '../../services/contentEngine/istTime';

interface FamilyCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyCalendarModal: React.FC<FamilyCalendarModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<FamilyEvent[]>(() => calendarStore.getEvents());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(`${getISTDateString()}T00:00:00.000Z`));
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Add Event Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('gathering');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const isAdmin = authStore.isAdmin();
  const canManageEvent = (event: FamilyEvent) =>
    !authStore.getCurrentUser() || isAdmin || event.createdBy === authStore.getCurrentUser()?.userId;

  useEffect(() => {
    const unsub = calendarStore.subscribe((evs) => setEvents(evs));
    if (isOpen && calendarStore.getPersistenceMode() === 'shared circle') {
      setIsLoading(true);
      setLoadError(null);
      void calendarStore.load()
        .catch(() => setLoadError('Shared events could not be loaded. Confirm the database migration and family access.'))
        .finally(() => setIsLoading(false));
    }
    return unsub;
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Calendar matrix calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [year, month, daysInMonth, firstDayIndex]);

  const todayStr = getISTDateString();

  const handlePrevMonth = () => {
    soundEngine.tick();
    setCurrentDate(new Date(Date.UTC(year, month - 1, 1)));
  };

  const handleNextMonth = () => {
    soundEngine.tick();
    setCurrentDate(new Date(Date.UTC(year, month + 1, 1)));
  };

  const handleToday = () => {
    soundEngine.tick();
    setCurrentDate(new Date(`${getISTDateString()}T00:00:00.000Z`));
  };

  const formatDayString = (day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  const getEventsForDay = (day: number) => {
    const dayStr = formatDayString(day);
    return events.filter((e) => {
      const matchDate = e.date === dayStr;
      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchDate && matchCat;
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    try {
      const input = {
        title: newTitle,
        date: newDate,
        category: newCategory,
        location: newLocation,
        description: newDescription,
      };
      if (editingId) {
        const updated = await calendarStore.updateEvent(editingId, input);
        if (!updated) throw new Error('This event could not be changed. You may not have permission to edit it.');
      } else {
        await calendarStore.addEvent(input);
      }
      soundEngine.chime();
      confetti({ particleCount: 24, spread: 48, origin: { y: 0.6 } });
      const savedIn = calendarStore.getPersistenceMode() === 'shared circle' ? 'shared calendar' : 'this browser';
      toastManager.showToast(editingId ? 'Calendar event updated.' : `Calendar event saved to ${savedIn}.`);
      setEditingId(null);
      setIsAdding(false);
    } catch (error) {
      toastManager.showToast(error instanceof Error ? error.message : 'The calendar event could not be saved.');
      return;
    }

    setNewTitle('');
    setNewDate('');
    setNewLocation('');
    setNewDescription('');
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      const removed = await calendarStore.deleteEvent(id);
      if (!removed) throw new Error('This event could not be deleted. You may not have permission.');
      soundEngine.boing();
      toastManager.showToast(`Removed "${title}" from the calendar.`);
    } catch (error) {
      toastManager.showToast(error instanceof Error ? error.message : 'The event could not be deleted.');
    }
  };

  const handleEdit = (event: FamilyEvent) => {
    setEditingId(event.id);
    setNewTitle(event.title);
    setNewDate(event.date);
    setNewCategory(event.category);
    setNewLocation(event.location ?? '');
    setNewDescription(event.description ?? '');
    setIsAdding(true);
  };

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'birthday':
        return <Cake className="w-3.5 h-3.5 text-amber-300" />;
      case 'trip':
        return <Plane className="w-3.5 h-3.5 text-emerald-400" />;
      case 'gathering':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'milestone':
        return <Award className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  if (!isOpen) return null;

  const filteredUpcoming = events
    .filter((e) => e.date >= todayStr && (selectedCategory === 'all' || e.category === selectedCategory))
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#181512] to-[#0D0B0A] border border-[#DFBE8A]/30 shadow-2xl shadow-black/95 overflow-hidden text-white"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-white/10 bg-white/5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DFBE8A] to-[#B3874B] text-black flex items-center justify-center shadow-lg">
              <CalendarIcon className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-serif font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
                Family Calendar
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Asia/Kolkata
                </span>
              </h2>
              <p className="text-xs font-mono text-stone-400">
                {calendarStore.getPersistenceMode() === 'shared circle' ? 'Shared calendar · Asia/Kolkata dates' : 'Saved in this browser · Asia/Kolkata dates'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                soundEngine.tick();
                if (isAdding) {
                  setIsAdding(false);
                  setEditingId(null);
                  setNewTitle('');
                  setNewDate('');
                  setNewLocation('');
                  setNewDescription('');
                } else {
                  setEditingId(null);
                  setIsAdding(true);
                }
              }}
              className="px-2 sm:px-3 py-2 rounded-xl font-mono text-[10px] sm:text-xs font-bold bg-[#DFBE8A] text-black hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>{isAdding ? 'Close Form' : 'Add Event'}</span>
            </button>

            <button
              onClick={() => {
                soundEngine.tick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Calendar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loadError && <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-200">{loadError}<button type="button" onClick={() => void calendarStore.load().then(() => setLoadError(null)).catch(() => {})} className="ml-2 underline">Retry</button></div>}
          {isLoading && <p role="status" className="text-xs text-stone-400">Loading shared events…</p>}
          {/* Add Event Form Accordion */}
          <AnimatePresence>
            {isAdding && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={(event) => void handleAddSubmit(event)}
                className="rounded-2xl bg-white/5 border border-amber-500/30 p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    {editingId ? 'Edit Calendar Event' : 'Create Calendar Event'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="text-xs font-mono text-stone-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-mono text-stone-400">Event Title *</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Diwali Reunion, Trip to Gokarna..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-[#DFBE8A]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-stone-400">Date *</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-[#DFBE8A]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-stone-400">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-[#DFBE8A]"
                    >
                      <option value="gathering">Gathering / Reunion 🔥</option>
                      <option value="trip">Cousin Trip 🌴</option>
                      <option value="birthday">Birthday 🎂</option>
                      <option value="milestone">Family Milestone 🌟</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-stone-400">Location (Optional)</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Hyderabad, Goa, Family Home..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-[#DFBE8A]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-stone-400">Description (Optional)</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief note or plans..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono outline-none focus:border-[#DFBE8A]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-mono text-xs font-bold bg-[#DFBE8A] text-black hover:brightness-110 cursor-pointer shadow-md"
                  >
                    {editingId ? 'Save Changes' : 'Save Event'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Month Controls & Category Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-serif text-lg font-bold text-white min-w-36 text-center">
                {monthNames[month]} {year}
              </span>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-2 py-1 rounded-md text-[11px] font-mono bg-white/10 hover:bg-white/20 text-stone-300 cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs font-mono">
              {(['all', 'birthday', 'trip', 'gathering', 'milestone'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundEngine.tick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer capitalize ${
                    selectedCategory === cat
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                      : 'bg-white/5 text-stone-400 hover:text-white border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid & Detail Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Month Days Grid */}
            <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-stone-400 uppercase tracking-wider mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {daysArray.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty_${idx}`} className="h-14 sm:h-16 rounded-xl bg-transparent" />;
                  }

                  const dayStr = formatDayString(day);
                  const isToday = dayStr === todayStr;
                  const isSelected = selectedDateStr === dayStr;
                  const dayEvents = getEventsForDay(day);

                  return (
                    <button
                      type="button"
                      key={`day_${day}`}
                      aria-label={`${dayStr}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        soundEngine.tick();
                        setSelectedDateStr(isSelected ? null : dayStr);
                      }}
                      className={`h-14 w-full text-left sm:h-16 rounded-xl p-1.5 flex flex-col justify-between border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#DFBE8A] bg-amber-400/15'
                          : isToday
                          ? 'border-amber-400/50 bg-amber-400/10'
                          : dayEvents.length > 0
                          ? 'border-white/20 bg-white/5 hover:border-white/40'
                          : 'border-white/5 bg-black/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={isToday ? 'font-bold text-amber-400' : 'text-stone-300'}>
                          {day}
                        </span>
                        {isToday && (
                          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>

                      {/* Event indicators */}
                      <div className="flex flex-wrap gap-1">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            title={e.title}
                            className={`w-2 h-2 rounded-full ${
                              e.category === 'birthday'
                                ? 'bg-amber-400'
                                : e.category === 'trip'
                                ? 'bg-emerald-400'
                                : e.category === 'gathering'
                                ? 'bg-rose-400'
                                : 'bg-purple-400'
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Upcoming / Selected Day List */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-mono text-stone-300 uppercase tracking-wider font-bold">
                  {selectedDateStr ? `Events on ${selectedDateStr}` : 'Upcoming Circle Dates'}
                </span>
                {selectedDateStr && (
                  <button
                    onClick={() => setSelectedDateStr(null)}
                    className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                {(selectedDateStr
                  ? events.filter((e) => e.date === selectedDateStr)
                  : filteredUpcoming
                ).length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-stone-500">
                    No scheduled events for this selection.
                  </div>
                ) : (
                  (selectedDateStr
                    ? events.filter((e) => e.date === selectedDateStr)
                    : filteredUpcoming
                  ).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 relative group hover:border-[#DFBE8A]/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-white">
                          {getCategoryIcon(evt.category)}
                          <span>{evt.title}</span>
                        </div>

                        {canManageEvent(evt) && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(evt)}
                              className="rounded-md p-1 text-stone-400 hover:text-white"
                              title="Edit event"
                              aria-label={`Edit ${evt.title}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => void handleDelete(evt.id, evt.title)}
                              className="rounded-md p-1 text-stone-400 hover:text-rose-400"
                              title="Delete event"
                              aria-label={`Delete ${evt.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#DFBE8A]" />
                          <span>{evt.date}</span>
                        </div>

                        {evt.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>

                      {evt.description && (
                        <p className="text-[11px] font-mono text-stone-300">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

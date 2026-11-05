import { authStore } from './authStore';
import { getISTDateString } from './contentEngine/istTime';
import { isSupabaseConfigured, supabase } from './supabase';

export type EventCategory = 'birthday' | 'trip' | 'gathering' | 'milestone';

export interface FamilyEvent {
  id: string;
  title: string;
  date: string;
  category: EventCategory;
  description?: string;
  location?: string;
  createdBy: string;
  createdAt: number;
}

export type FamilyEventInput = Pick<FamilyEvent, 'title' | 'date' | 'category'> &
  Partial<Pick<FamilyEvent, 'description' | 'location'>>;

const CALENDAR_STORAGE_KEY = 'ourcircle_family_events';
const EVENT_CATEGORIES: EventCategory[] = ['birthday', 'trip', 'gathering', 'milestone'];

function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isFamilyEvent(value: unknown): value is FamilyEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<FamilyEvent>;
  return typeof event.id === 'string' && typeof event.title === 'string' &&
    validDate(String(event.date ?? '')) && EVENT_CATEGORIES.includes(event.category as EventCategory) &&
    typeof event.createdBy === 'string' && Number.isFinite(event.createdAt);
}

function mapRemoteEvent(row: Record<string, unknown>): FamilyEvent {
  const createdAt = typeof row.created_at === 'string' ? Date.parse(row.created_at) : Date.now();
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    date: String(row.event_date ?? ''),
    category: row.category as EventCategory,
    description: typeof row.description === 'string' ? row.description : undefined,
    location: typeof row.location === 'string' ? row.location : undefined,
    createdBy: String(row.created_by ?? ''),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
}

class CalendarStore {
  private events: FamilyEvent[] = [];
  private listeners: ((events: FamilyEvent[]) => void)[] = [];

  constructor() {
    this.events = supabase ? [] : this.loadEvents();
  }

  private loadEvents(): FamilyEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isFamilyEvent).sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      return [];
    }
  }

  private saveEvents() {
    if (!supabase && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(this.events));
      } catch {
        // Keep the in-memory calendar usable when this browser blocks storage.
      }
    }
    this.notify();
  }

  public getEvents(): FamilyEvent[] {
    return [...this.events];
  }

  public getUpcomingEvents(_daysAhead = 60): FamilyEvent[] {
    const today = getISTDateString();
    return this.events.filter((event) => event.date >= today).slice(0, 10);
  }

  public getPersistenceMode(): 'this browser' | 'shared circle' {
    return isSupabaseConfigured ? 'shared circle' : 'this browser';
  }

  public async load(): Promise<FamilyEvent[]> {
    if (!supabase) return this.getEvents();
    const { data, error } = await supabase.from('family_events')
      .select('id,title,event_date,category,description,location,created_by,created_at')
      .order('event_date', { ascending: true });
    if (error) throw error;
    this.events = (data ?? []).map((row) => mapRemoteEvent(row as Record<string, unknown>));
    this.notify();
    return this.getEvents();
  }

  public async addEvent(eventInput: FamilyEventInput): Promise<FamilyEvent> {
    const title = eventInput.title.trim();
    if (!title || title.length > 120) throw new Error('Event title must contain 1–120 characters.');
    if (!validDate(eventInput.date)) throw new Error('Choose a valid calendar date.');
    if (!EVENT_CATEGORIES.includes(eventInput.category)) throw new Error('Choose a valid event category.');

    const currentUser = authStore.getCurrentUser();
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user || authData.user.id !== currentUser?.userId) {
        throw new Error('Your session could not be verified. Sign in again before adding an event.');
      }
      const { data, error } = await supabase.from('family_events').insert({
        title,
        event_date: eventInput.date,
        category: eventInput.category,
        description: eventInput.description?.trim().slice(0, 500) || null,
        location: eventInput.location?.trim().slice(0, 160) || null,
        created_by: authData.user.id,
      }).select('id,title,event_date,category,description,location,created_by,created_at').single();
      if (error) throw error;
      const event = mapRemoteEvent(data as Record<string, unknown>);
      this.events = [...this.events, event].sort((a, b) => a.date.localeCompare(b.date));
      this.notify();
      return event;
    }
    const newEvent: FamilyEvent = {
      ...eventInput,
      title,
      description: eventInput.description?.trim().slice(0, 500) || undefined,
      location: eventInput.location?.trim().slice(0, 160) || undefined,
      id: `evt_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`,
      createdBy: currentUser?.userId || 'local-browser',
      createdAt: Date.now(),
    };
    this.events = [...this.events, newEvent].sort((a, b) => a.date.localeCompare(b.date));
    this.saveEvents();
    return newEvent;
  }

  public async updateEvent(id: string, eventInput: FamilyEventInput): Promise<boolean> {
    const existing = this.events.find((event) => event.id === id);
    if (!existing) return false;
    const title = eventInput.title.trim();
    if (!title || title.length > 120 || !validDate(eventInput.date) || !EVENT_CATEGORIES.includes(eventInput.category)) {
      throw new Error('Enter a title, valid date and event category.');
    }
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user || authData.user.id !== authStore.getCurrentUser()?.userId) {
        throw new Error('Your session could not be verified. Sign in again before editing an event.');
      }
      const { data, error } = await supabase.from('family_events').update({
        title,
        event_date: eventInput.date,
        category: eventInput.category,
        description: eventInput.description?.trim().slice(0, 500) || null,
        location: eventInput.location?.trim().slice(0, 160) || null,
      }).eq('id', id).select('id,title,event_date,category,description,location,created_by,created_at').maybeSingle();
      if (error) throw error;
      if (!data) return false;
      const updated = mapRemoteEvent(data as Record<string, unknown>);
      this.events = this.events.map((event) => event.id === id ? updated : event).sort((a, b) => a.date.localeCompare(b.date));
      this.notify();
      return true;
    }
    this.events = this.events.map((event) => event.id === id ? {
      ...event,
      ...eventInput,
      title,
      description: eventInput.description?.trim().slice(0, 500) || undefined,
      location: eventInput.location?.trim().slice(0, 160) || undefined,
    } : event).sort((a, b) => a.date.localeCompare(b.date));
    this.saveEvents();
    return true;
  }

  public async deleteEvent(id: string): Promise<boolean> {
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user || authData.user.id !== authStore.getCurrentUser()?.userId) {
        throw new Error('Your session could not be verified. Sign in again before deleting an event.');
      }
      const { data, error } = await supabase.from('family_events').delete().eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) return false;
      this.events = this.events.filter((event) => event.id !== id);
      this.notify();
      return true;
    }
    const prevLen = this.events.length;
    this.events = this.events.filter((event) => event.id !== id);
    if (this.events.length === prevLen) return false;
    this.saveEvents();
    return true;
  }

  public subscribe(listener: (events: FamilyEvent[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getEvents());
    return () => {
      this.listeners = this.listeners.filter((current) => current !== listener);
    };
  }

  private notify() {
    const events = this.getEvents();
    this.listeners.forEach((listener) => listener(events));
  }
}

export const calendarStore = new CalendarStore();

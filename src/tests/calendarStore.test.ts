import { describe, expect, it } from 'vitest';
import { calendarStore } from '../services/calendarStore';

describe('calendarStore event management', () => {
  it('starts without fabricated family milestones', () => {
    expect(calendarStore.getEvents()).toEqual([]);
  });

  it('creates, edits and deletes a browser event', async () => {
    const event = await calendarStore.addEvent({
      title: 'Family Potluck Dinner',
      date: '2026-11-20',
      category: 'gathering',
      location: 'Terrace Garden',
      description: 'Bring your favorite dish!',
    });

    expect(calendarStore.getEvents().some((item) => item.id === event.id)).toBe(true);
    expect(await calendarStore.updateEvent(event.id, {
      title: 'Family Dinner',
      date: '2026-11-21',
      category: 'gathering',
      location: 'Terrace Garden',
      description: 'Updated plan',
    })).toBe(true);
    expect(calendarStore.getEvents().find((item) => item.id === event.id)?.title).toBe('Family Dinner');
    expect(await calendarStore.deleteEvent(event.id)).toBe(true);
    expect(calendarStore.getEvents().some((item) => item.id === event.id)).toBe(false);
  });

  it('rejects invalid dates and empty titles', async () => {
    await expect(calendarStore.addEvent({ title: 'Invalid date', date: '2026-02-31', category: 'trip' })).rejects.toThrow(/valid calendar date/);
    await expect(calendarStore.addEvent({ title: '  ', date: '2026-11-20', category: 'trip' })).rejects.toThrow(/title/);
  });
});

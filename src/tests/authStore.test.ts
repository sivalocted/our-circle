import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { authStore, createInitialAvatar, profileFromAuthUser } from '../services/authStore';

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: { full_name: 'Circle Member' },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    is_anonymous: false,
    ...overrides,
  } as User;
}

describe('authStore identity mapping', () => {
  it('does not accept a browser-editable user metadata role as admin', () => {
    const profile = profileFromAuthUser(user({ user_metadata: { full_name: 'Circle Member', role: 'admin' } }));
    expect(profile.role).toBe('cousin');
  });

  it('maps a server-managed app metadata role', () => {
    const profile = profileFromAuthUser(user({ app_metadata: { provider: 'google', providers: ['google'], role: 'admin' } }));
    expect(profile.role).toBe('admin');
  });

  it('keeps invitation and password management unavailable in the browser', () => {
    expect(authStore.getWhitelist()).toEqual([]);
    expect(authStore.inviteCousin('member@example.com').success).toBe(false);
    expect(authStore.revokeInvite('member@example.com')).toBe(false);
  });

  it('generates an escaped SVG avatar for a real profile without an image', () => {
    const avatar = createInitialAvatar('<A');
    expect(avatar).toContain('data:image/svg+xml');
    expect(decodeURIComponent(avatar)).toContain('&lt;');
  });
});

import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

export type AuthAccessState = 'checking' | 'authorized' | 'signed_out' | 'denied' | 'unavailable' | 'unconfigured';

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  birthday?: string;
  avatarUrl: string;
  role: 'admin' | 'cousin';
  isOnboarded: boolean;
  joinedAt: number;
  upiHandle?: string;
}

export function createInitialAvatar(name: string): string {
  const initial = (name || '•').trim().charAt(0).toUpperCase();
  const safeInitial = initial.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="#2A2420"/><text x="50" y="62" font-size="42" font-family="sans-serif" font-weight="bold" fill="#DFBE8A" text-anchor="middle">${safeInitial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Map only a verified Supabase user. Authorization comes from trusted app_metadata, never user_metadata. */
export function profileFromAuthUser(user: User): UserProfile {
  const publicMetadata = user.user_metadata ?? {};
  const displayName = typeof publicMetadata.full_name === 'string'
    ? publicMetadata.full_name
    : typeof publicMetadata.name === 'string'
      ? publicMetadata.name
      : user.email?.split('@')[0] ?? 'Circle member';
  const avatar = typeof publicMetadata.avatar_url === 'string' ? publicMetadata.avatar_url : '';
  const role = user.app_metadata?.role === 'admin' ? 'admin' : 'cousin';

  return {
    id: user.id,
    userId: user.id,
    email: user.email ?? '',
    name: displayName,
    birthday: undefined,
    avatarUrl: avatar || createInitialAvatar(displayName),
    role,
    isOnboarded: false,
    joinedAt: user.created_at ? Date.parse(user.created_at) : Date.now(),
    upiHandle: typeof publicMetadata.upi_handle === 'string' ? publicMetadata.upi_handle : undefined,
  };
}

class AuthStore {
  private currentUser: UserProfile | null = null;
  private listeners = new Set<(user: UserProfile | null) => void>();
  private accessListeners = new Set<(state: AuthAccessState) => void>();
  private accessState: AuthAccessState = isSupabaseConfigured ? 'checking' : 'unconfigured';
  private sessionVersion = 0;

  constructor() {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Could not restore the authentication session.', error);
        this.setAccessState('unavailable');
        return;
      }
      this.setSessionUser(data.session?.user ?? null);
    }).catch(() => this.setAccessState('unavailable'));

    supabase.auth.onAuthStateChange((_event, session) => {
      this.setSessionUser(session?.user ?? null);
    });
  }

  private setSessionUser(user: User | null) {
    const version = ++this.sessionVersion;
    if (!user) {
      this.currentUser = null;
      this.setAccessState('signed_out');
      this.notifyUser();
      return;
    }

    this.currentUser = null;
    this.setAccessState('checking');
    this.notifyUser();
    if (!supabase) {
      this.setAccessState('unconfigured');
      return;
    }

    void (async () => {
      try {
        const lookup = () => supabase!.from('family_members').select('role')
          .eq('email', (user.email ?? '').toLowerCase()).eq('is_active', true).maybeSingle();
        let result = await lookup();
        if (version !== this.sessionVersion) return;
        if (result.error) {
          this.setAccessState('unavailable');
          return;
        }
        if (!result.data) {
          // The RPC checks auth.users email confirmation, invitation expiry and
          // normalized address before adding membership. OAuth alone grants nothing.
          await supabase!.rpc('accept_family_invitation');
          if (version !== this.sessionVersion) return;
          result = await lookup();
        }
        if (result.error) {
          this.setAccessState('unavailable');
          return;
        }
        if (!result.data) {
          this.setAccessState('denied');
          return;
        }
        const base = profileFromAuthUser(user);
        let profile = base;
        try {
          const { data } = await supabase!.from('family_profiles')
            .select('display_name,avatar_path').eq('user_id', user.id).maybeSingle();
          const { data: privateData } = await supabase!.from('family_profile_private')
            .select('birthday_month,birthday_day').eq('user_id', user.id).maybeSingle();
          if (data) profile = {
            ...base,
            name: data.display_name,
            birthday: privateData?.birthday_month && privateData.birthday_day
              ? `${String(privateData.birthday_month).padStart(2, '0')}-${String(privateData.birthday_day).padStart(2, '0')}`
              : undefined,
            isOnboarded: true,
          };
        } catch {
          // Profile reads are optional until the profile migration is installed.
        }
        if (version !== this.sessionVersion) return;
        this.currentUser = { ...profile, role: result.data.role === 'admin' ? 'admin' : 'cousin' };
        this.setAccessState('authorized');
        this.notifyUser();
      } catch {
        if (version === this.sessionVersion) this.setAccessState('unavailable');
      }
    })();
  }

  private notifyUser() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  private setAccessState(state: AuthAccessState) {
    this.accessState = state;
    this.accessListeners.forEach((listener) => listener(state));
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  getAccessState(): AuthAccessState {
    return this.accessState;
  }

  subscribeAccess(callback: (state: AuthAccessState) => void) {
    this.accessListeners.add(callback);
    callback(this.accessState);
    return () => { this.accessListeners.delete(callback); };
  }

  isAuthenticated(): boolean {
    return Boolean(this.currentUser);
  }

  isAdmin(): boolean {
    // UI hint only. Database policies must independently enforce admin permissions.
    return this.currentUser?.role === 'admin';
  }

  async signInWithSupabaseOAuth() {
    if (!supabase || !isSupabaseConfigured) {
      return { error: new Error('Authentication is not configured for this deployment.') };
    }
    const redirectUrl = window.location.origin + window.location.pathname;
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl },
    });
  }

  async signOut() {
    if (!supabase) {
      this.setSessionUser(null);
      return { error: null };
    }
    const result = await supabase.auth.signOut();
    if (result.error) return result;
    this.setSessionUser(null);
    return result;
  }

  /** Local profile fields are user-owned metadata, never authorization claims. */
  async completeOnboarding(profileData: {
    name: string;
    birthdayMonth: number;
    birthdayDay: number;
    birthdayYear?: number;
    birthdayVisibility: 'private' | 'members';
    birthdayYearVisible: boolean;
    introduction?: string;
    preferredTimezone: string;
  }): Promise<UserProfile | null> {
    if (!supabase || !this.currentUser) return null;

    const updated: UserProfile = {
      ...this.currentUser,
      name: profileData.name.trim() || this.currentUser.name,
      birthday: `${String(profileData.birthdayMonth).padStart(2, '0')}-${String(profileData.birthdayDay).padStart(2, '0')}`,
      isOnboarded: true,
    };
    const { error } = await supabase.rpc('complete_family_profile', {
      p_display_name: updated.name,
      p_birthday_month: profileData.birthdayMonth,
      p_birthday_day: profileData.birthdayDay,
      p_birthday_year: profileData.birthdayYear ?? null,
      p_birthday_visibility: profileData.birthdayVisibility,
      p_birthday_year_visible: profileData.birthdayYearVisible,
      p_introduction: profileData.introduction?.trim() || null,
      p_preferred_timezone: profileData.preferredTimezone || 'Asia/Kolkata',
    });
    if (error) throw error;
    this.currentUser = updated;
    this.listeners.forEach((listener) => listener(updated));
    return updated;
  }

  /** Invitation management must be implemented by a trusted server function. */
  getWhitelist(): string[] {
    return [];
  }

  inviteCousin(_email: string): { success: false; message: string } {
    return { success: false, message: 'Invitations are unavailable until server-side access control is configured.' };
  }

  revokeInvite(_email: string): boolean {
    return false;
  }

  subscribe(callback: (user: UserProfile | null) => void) {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => { this.listeners.delete(callback); };
  }
}

export const authStore = new AuthStore();

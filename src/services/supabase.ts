import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: number;
  reactions?: Record<string, number>;
}

export interface MemberPresence {
  id: string;
  name: string;
  avatarUrl: string;
  onlineAt: number;
  currentAction?: string;
}

export interface FloatingReactionEvent {
  id: string;
  emoji: string;
  x?: number;
  y?: number;
  senderName?: string;
}

export interface BuzzEvent {
  id: string;
  type: 'chai' | 'pizza' | 'laugh' | 'love';
  senderId: string;
  senderName: string;
  timestamp: number;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!)
  : null;

const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('ourcircle_live_sync')
  : null;

function newEventId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class RealtimeService {
  private messageListeners = new Set<(message: ChatMessage) => void>();
  private reactionListeners = new Set<(reaction: FloatingReactionEvent) => void>();
  private presenceListeners = new Set<(members: MemberPresence[]) => void>();
  private buzzListeners = new Set<(buzz: BuzzEvent) => void>();
  private messages: ChatMessage[] = [];
  private onlineMembers: MemberPresence[] = [];
  private identity: { id: string; name: string; avatarUrl: string } | null = null;
  private chatChannel: RealtimeChannel | null = null;
  private reactionChannel: RealtimeChannel | null = null;
  private buzzChannel: RealtimeChannel | null = null;
  private presenceChannel: RealtimeChannel | null = null;
  private connectVersion = 0;
  private seenEvents = new Set<string>();

  constructor() {
    if (broadcast) {
      broadcast.onmessage = (event) => {
        const { type, payload } = event.data ?? {};
        if (type === 'NEW_REACTION') this.handleIncomingReaction(payload, false);
        if (type === 'NEW_BUZZ') this.handleIncomingBuzz(payload, false);
      };
    }
  }

  async connectToCircle(identity: { id: string; name: string; avatarUrl: string }): Promise<void> {
    if (!supabase) return;
    if (this.identity?.id === identity.id && this.presenceChannel) return;
    const version = ++this.connectVersion;
    await this.disconnectFromCircle(true);
    if (version !== this.connectVersion) return;

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || data.user.id !== identity.id) return;
    this.identity = identity;

    this.chatChannel = supabase.channel('circle:chat-messages', { config: { private: true } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        this.handleIncomingMessage(this.mapMessage(payload.new as Record<string, unknown>));
      })
      .subscribe();

    this.reactionChannel = supabase.channel('circle:reactions', { config: { private: true } })
      .on('broadcast', { event: 'floating_reaction' }, ({ payload }) => this.handleIncomingReaction(payload as FloatingReactionEvent, false))
      .subscribe();

    this.buzzChannel = supabase.channel('circle:buzzes', { config: { private: true } })
      .on('broadcast', { event: 'cousin_buzz' }, ({ payload }) => this.handleIncomingBuzz(payload as BuzzEvent, false))
      .subscribe();

    const presenceChannel = supabase.channel('circle:presence', {
      config: { private: true, presence: { key: identity.id } },
    });
    this.presenceChannel = presenceChannel;
    presenceChannel
      .on('presence', { event: 'sync' }, () => this.syncPresence(presenceChannel))
      .on('presence', { event: 'join' }, () => this.syncPresence(presenceChannel))
      .on('presence', { event: 'leave' }, () => this.syncPresence(presenceChannel))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void presenceChannel.track({
            user_id: identity.id,
            name: identity.name,
            avatar_url: identity.avatarUrl,
            online_at: new Date().toISOString(),
          });
        }
      });
  }

  async disconnectFromCircle(keepConnectionToken = false): Promise<void> {
    if (!keepConnectionToken) ++this.connectVersion;
    const channels = [this.chatChannel, this.reactionChannel, this.buzzChannel, this.presenceChannel]
      .filter((channel): channel is RealtimeChannel => Boolean(channel));
    this.chatChannel = null;
    this.reactionChannel = null;
    this.buzzChannel = null;
    this.presenceChannel = null;
    this.identity = null;
    this.onlineMembers = [];
    this.notifyPresence();
    await Promise.all(channels.map((channel) => channel.unsubscribe().catch(() => 'error')));
  }

  private syncPresence(channel: RealtimeChannel) {
    const state = channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
    const members = Object.entries(state).flatMap(([key, values]) => {
      const presence = values[0];
      if (!presence) return [];
      const onlineAt = typeof presence.online_at === 'string' ? Date.parse(presence.online_at) : Date.now();
      return [{
        id: String(presence.user_id ?? key),
        name: String(presence.name ?? 'Circle member'),
        avatarUrl: String(presence.avatar_url ?? ''),
        onlineAt: Number.isFinite(onlineAt) ? onlineAt : Date.now(),
      }];
    });
    this.onlineMembers = members.sort((a, b) => a.name.localeCompare(b.name));
    this.notifyPresence();
  }

  private mapMessage(row: Record<string, unknown>): ChatMessage {
    const createdAt = typeof row.created_at === 'string' ? Date.parse(row.created_at) : Date.now();
    return {
      id: String(row.id ?? ''),
      senderId: String(row.sender_id ?? ''),
      senderName: String(row.sender_name ?? 'Circle member'),
      senderAvatar: String(row.sender_avatar ?? ''),
      content: String(row.content ?? ''),
      timestamp: Number.isFinite(createdAt) ? createdAt : Date.now(),
    };
  }

  async loadMessages(): Promise<ChatMessage[]> {
    if (!supabase) throw new Error('Shared chat is not configured.');
    const { data, error } = await supabase.from('chat_messages')
      .select('id,sender_id,sender_name,sender_avatar,content,created_at')
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw error;
    const combined = new Map(this.messages.map((message) => [message.id, message]));
    for (const row of data ?? []) {
      const message = this.mapMessage(row as Record<string, unknown>);
      combined.set(message.id, message);
    }
    this.messages = [...combined.values()].sort((a, b) => a.timestamp - b.timestamp);
    return [...this.messages];
  }

  getActiveCousin(): MemberPresence {
    return {
      id: this.identity?.id ?? 'local-device',
      name: this.identity?.name ?? 'This device',
      avatarUrl: this.identity?.avatarUrl ?? '',
      onlineAt: Date.now(),
    };
  }

  setActiveCousin(_personId: string) {
    // Identity comes from the verified Supabase session.
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  async sendMessage(content: string, sender: { id: string; name: string; avatarUrl: string }): Promise<ChatMessage> {
    if (!supabase) throw new Error('Shared chat is not configured.');
    const clean = content.trim();
    if (!clean || clean.length > 2000) throw new Error('Message must contain 1–2,000 characters.');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== sender.id) {
      throw new Error('Your session could not be verified. Sign in again before sending.');
    }

    const { data, error } = await supabase.from('chat_messages').insert({
      sender_id: authData.user.id,
      sender_name: sender.name,
      sender_avatar: sender.avatarUrl,
      content: clean,
    }).select('id,sender_id,sender_name,sender_avatar,content,created_at').single();
    if (error) throw error;
    const message = this.mapMessage(data as Record<string, unknown>);
    this.handleIncomingMessage(message);
    return message;
  }

  private handleIncomingMessage(message: ChatMessage) {
    if (!message.id || this.messages.some((existing) => existing.id === message.id)) return;
    this.messages = [...this.messages, message].sort((a, b) => a.timestamp - b.timestamp);
    this.messageListeners.forEach((listener) => listener(message));
  }

  onNewMessage(callback: (message: ChatMessage) => void) {
    this.messageListeners.add(callback);
    return () => { this.messageListeners.delete(callback); };
  }

  triggerReaction(emoji: string, x?: number, y?: number) {
    const event: FloatingReactionEvent = {
      id: newEventId(), emoji, x, y, senderName: this.identity?.name,
    };
    this.handleIncomingReaction(event);
    void this.reactionChannel?.send({ type: 'broadcast', event: 'floating_reaction', payload: event });
  }

  private rememberEvent(id: string): boolean {
    if (!id || this.seenEvents.has(id)) return false;
    this.seenEvents.add(id);
    if (this.seenEvents.size > 500) this.seenEvents.delete(this.seenEvents.values().next().value as string);
    return true;
  }

  private handleIncomingReaction(event: FloatingReactionEvent, local = true) {
    if (!this.rememberEvent(event.id)) return;
    this.reactionListeners.forEach((listener) => listener(event));
    if (local) broadcast?.postMessage({ type: 'NEW_REACTION', payload: event });
  }

  onReaction(callback: (event: FloatingReactionEvent) => void) {
    this.reactionListeners.add(callback);
    return () => { this.reactionListeners.delete(callback); };
  }

  triggerBuzz(type: BuzzEvent['type']) {
    const event: BuzzEvent = {
      id: newEventId(),
      type,
      senderId: this.identity?.id ?? 'local-device',
      senderName: this.identity?.name ?? 'This device',
      timestamp: Date.now(),
    };
    this.handleIncomingBuzz(event);
    void this.buzzChannel?.send({ type: 'broadcast', event: 'cousin_buzz', payload: event });
  }

  private handleIncomingBuzz(event: BuzzEvent, local = true) {
    if (!this.rememberEvent(event.id)) return;
    this.buzzListeners.forEach((listener) => listener(event));
    if (local) broadcast?.postMessage({ type: 'NEW_BUZZ', payload: event });
  }

  onBuzz(callback: (buzz: BuzzEvent) => void) {
    this.buzzListeners.add(callback);
    return () => { this.buzzListeners.delete(callback); };
  }

  getOnlineMembers(): MemberPresence[] {
    return [...this.onlineMembers];
  }

  onPresenceChange(callback: (members: MemberPresence[]) => void) {
    this.presenceListeners.add(callback);
    callback(this.getOnlineMembers());
    return () => { this.presenceListeners.delete(callback); };
  }

  private notifyPresence() {
    const members = this.getOnlineMembers();
    this.presenceListeners.forEach((listener) => listener(members));
  }
}

export const realtimeService = new RealtimeService();

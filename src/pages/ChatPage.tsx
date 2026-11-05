import { useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { authStore, type UserProfile } from '../services/authStore';
import { isSupabaseConfigured, realtimeService, type ChatMessage } from '../services/supabase';

export function ChatPage() {
  const [user, setUser] = useState<UserProfile | null>(() => authStore.getCurrentUser());
  const [messages, setMessages] = useState<ChatMessage[]>(() => realtimeService.getMessages());
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(setUser);
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    void realtimeService.loadMessages()
      .then((loaded) => { if (active) setMessages(loaded); })
      .catch(() => { if (active) setError('Chat history is unavailable. Confirm the database migration and your family access, then retry.'); })
      .finally(() => { if (active) setIsLoading(false); });
    const unsubscribe = realtimeService.onNewMessage((message) => {
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    return () => { active = false; unsubscribe(); };
  }, [user?.userId]);

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !isSupabaseConfigured || !draft.trim() || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await realtimeService.sendMessage(draft, { id: user.userId, name: user.name, avatarUrl: user.avatarUrl });
      setDraft('');
    } catch {
      setError('Message not sent. Check the connection and access policies, then try again.');
    } finally {
      setIsSending(false);
    }
  };

  const retry = async () => {
    setIsLoading(true);
    setError(null);
    try { setMessages(await realtimeService.loadMessages()); }
    catch { setError('Chat history is still unavailable. Check the database migration and access policies.'); }
    finally { setIsLoading(false); }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-4xl flex-col px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-[#8a704a]" />
        <div><p className="text-[11px] uppercase tracking-[0.22em] text-[#8a704a]">Our Circle</p><h1 className="mt-1 font-serif text-4xl tracking-[-0.04em]">Chat</h1></div>
      </div>
      {!isSupabaseConfigured || !user ? (
        <section className="mt-8 rounded-3xl border border-[#ded8cb] bg-white/60 p-6 text-sm leading-6 text-[#69675f]">
          Shared chat needs an authenticated account, a configured Supabase project, and the chat migration with family access policies. No local message history or sender identities are fabricated.
        </section>
      ) : (
        <section className="mt-8 flex min-h-[min(66vh,680px)] flex-1 flex-col overflow-hidden rounded-3xl border border-[#ded8cb] bg-white/65">
          <div className="flex items-center justify-between border-b border-[#ded8cb] px-5 py-4">
            <div><h2 className="text-sm font-medium">Circle conversation</h2><p className="mt-1 text-xs text-[#77736b]">Signed in as {user.name}</p></div>
            <button type="button" onClick={() => void retry()} disabled={isLoading} className="rounded-full border border-[#c8b99e] px-3 py-1.5 text-xs disabled:opacity-50">Refresh</button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
            {isLoading && <p className="text-sm text-[#77736b]">Loading messages…</p>}
            {!isLoading && !error && messages.length === 0 && <p className="py-10 text-center text-sm leading-6 text-[#77736b]">No messages yet. Start the conversation.</p>}
            {messages.map((message) => {
              const mine = message.senderId === user.userId;
              return <article key={message.id} className={`max-w-[85%] rounded-2xl border px-4 py-3 ${mine ? 'ml-auto border-[#c8b99e] bg-[#efe7d8]' : 'border-[#ded8cb] bg-white/80'}`}>
                <p className="mb-1 text-xs font-medium">{mine ? 'You' : message.senderName}</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                <time className="mt-2 block text-right text-[10px] text-[#77736b]" dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleString()}</time>
              </article>;
            })}
          </div>
          {error && <div className="mx-5 mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}
          <form onSubmit={(event) => void send(event)} className="flex items-end gap-2 border-t border-[#ded8cb] p-4">
            <textarea aria-label="Write a message" rows={2} maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" className="min-h-12 flex-1 resize-y rounded-2xl border border-[#ded8cb] bg-white px-4 py-3 text-sm outline-none focus:border-[#8a704a]" />
            <button type="submit" disabled={!draft.trim() || isSending} className="flex h-12 items-center gap-2 rounded-full bg-[#25241f] px-4 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></button>
          </form>
        </section>
      )}
    </main>
  );
}

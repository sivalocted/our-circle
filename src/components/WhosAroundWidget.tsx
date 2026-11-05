import { useEffect, useState } from 'react';
import { ChevronDown, UsersRound } from 'lucide-react';
import { realtimeService, type MemberPresence } from '../services/supabase';

export function WhosAroundWidget() {
  const [onlineMembers, setOnlineMembers] = useState<MemberPresence[]>(() => realtimeService.getOnlineMembers());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => realtimeService.onPresenceChange(setOnlineMembers), []);

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsExpanded((open) => !open)} aria-expanded={isExpanded} aria-label="Show family members online" className="flex h-10 items-center gap-2 rounded-full px-3 text-xs text-[#6c6a64] transition hover:bg-black/5 hover:text-[#24231f]">
        <UsersRound className="h-4 w-4" />
        <span className="hidden md:inline">{onlineMembers.length ? `${onlineMembers.length} online` : 'Presence'}</span>
        <ChevronDown className={`hidden h-3 w-3 transition-transform md:block ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <section className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#ded8cb] bg-[#f7f3ea] p-3 text-[#24231f] shadow-xl" aria-label="Current family presence">
          <h2 className="border-b border-[#ded8cb] pb-2 text-xs font-medium">Online now</h2>
          {onlineMembers.length === 0 ? (
            <p className="py-4 text-xs leading-5 text-[#77736b]">Live presence could not be confirmed. Check the realtime connection.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {onlineMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-2 rounded-xl px-2 py-2">
                  {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9e0cf] text-xs">{member.name.charAt(0).toUpperCase()}</span>}
                  <span className="min-w-0 flex-1 truncate text-xs">{member.name}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-600" aria-label="Online" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

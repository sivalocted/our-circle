import { NavLink, Link } from 'react-router';
import { CalendarDays, Gamepad2, Images, LogOut, MessageCircle, Settings, Sparkles } from 'lucide-react';
import type { UserProfile } from '../services/authStore';
import { WhosAroundWidget } from './WhosAroundWidget';

interface NavbarProps {
  currentUser: UserProfile | null;
  onSignOut: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof Images;
  end?: boolean;
}

const primaryLinks: NavItem[] = [
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/play', label: 'Play', icon: Gamepad2 },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
];

export function Navbar({ currentUser, onSignOut }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dcd6ca] bg-[#f5f2eb]/95 text-[#24231f] backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Our Circle home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#272620] text-[#e5bd80]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden font-serif text-sm tracking-tight min-[380px]:inline sm:text-lg">Our Circle</span>
        </Link>

        <nav aria-label="Main navigation" className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {primaryLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) => `flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-1 text-sm transition sm:px-4 ${isActive ? 'bg-[#e9e0cf] text-[#3b3327]' : 'text-[#6c6a64] hover:bg-black/5 hover:text-[#24231f]'}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {currentUser && <WhosAroundWidget />}
          <Link to="/settings" className="flex h-10 w-10 items-center justify-center rounded-full text-[#6c6a64] transition hover:bg-black/5 hover:text-[#24231f]" aria-label="Profile and settings">
            {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <Settings className="h-4 w-4" />}
          </Link>
          {currentUser && (
            <button type="button" onClick={onSignOut} className="flex h-10 w-10 items-center justify-center rounded-full text-[#6c6a64] transition hover:bg-black/5 hover:text-[#24231f]" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

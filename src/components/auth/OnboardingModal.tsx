import { useState } from 'react';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { authStore, type UserProfile } from '../../services/authStore';
import { toastManager } from '../ActivityToasts';

interface OnboardingModalProps { user: UserProfile; onComplete: (updated: UserProfile) => void }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENT_YEAR = new Date().getFullYear();

export function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const parts = user.birthday?.split('-') ?? [];
  const [name, setName] = useState(user.name || '');
  const [month, setMonth] = useState(parts.length === 2 ? Number(parts[0]) : parts.length === 3 ? Number(parts[1]) : 0);
  const [day, setDay] = useState(parts.length === 2 ? Number(parts[1]) : parts.length === 3 ? Number(parts[2]) : 0);
  const [year, setYear] = useState(parts.length === 3 ? parts[0] : '');
  const [yearVisible, setYearVisible] = useState(false);
  const [birthdayVisible, setBirthdayVisible] = useState(false);
  const [intro, setIntro] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const days = month ? new Date(2000, month, 0).getDate() : 31;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !month || !day) {
      setError('Enter a display name and a valid birthday month and day.');
      return;
    }
    if (yearVisible && (!year || !/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > CURRENT_YEAR)) {
      setError(`Please enter your 4-digit birth year (1900–${CURRENT_YEAR}) or uncheck "I want to share my birth year".`);
      return;
    }
    if (year && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > CURRENT_YEAR)) {
      setError(`Please enter a valid birth year between 1900 and ${CURRENT_YEAR}.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await authStore.completeOnboarding({
        name: name.trim(),
        birthdayMonth: month,
        birthdayDay: day,
        birthdayYear: year ? Number(year) : undefined,
        birthdayVisibility: birthdayVisible ? 'members' : 'private',
        birthdayYearVisible: Boolean(yearVisible && year),
        introduction: intro,
        preferredTimezone: timezone,
      });
      if (!updated) throw new Error('Profile service is unavailable.');
      toastManager.showToast(`Welcome to the family circle, ${updated.name}!`);
      onComplete(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(msg || 'Your profile could not be saved. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#161510]/80 p-4 backdrop-blur-xl">
    <section aria-labelledby="onboarding-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/50 bg-[#f5f2eb] p-6 text-[#24231f] shadow-2xl sm:p-8">
      <div className="flex items-center gap-3"><span className="rounded-2xl bg-[#e9e0cf] p-3 text-[#735f3f]"><Sparkles className="h-5 w-5" /></span><div><p className="text-xs uppercase tracking-[.18em] text-[#8a704a]">First visit</p><h1 id="onboarding-title" className="font-serif text-3xl">Make yourself at home</h1></div></div>
      <p className="mt-4 text-sm leading-6 text-[#69675f]">Your profile helps family recognize you. Birthday details stay private unless you choose to share them.</p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5">
        <label className="block text-sm font-medium">Display name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#d8d0c1] bg-white px-3 outline-none focus:border-[#8a704a]" /></label>
        <fieldset><legend className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-[#8a704a]" />Birthday (month and day required, year optional)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="birthday-month">Month</label><select id="birthday-month" required value={month || ''} onChange={(event) => { setMonth(Number(event.target.value)); setDay(0); }} className="min-h-11 rounded-xl border border-[#d8d0c1] bg-white px-3"><option value="">Month</option>{MONTHS.map((value,index)=><option key={value} value={index+1}>{value}</option>)}</select>
            <label className="sr-only" htmlFor="birthday-day">Day</label><select id="birthday-day" required value={day || ''} onChange={(event) => setDay(Number(event.target.value))} className="min-h-11 rounded-xl border border-[#d8d0c1] bg-white px-3"><option value="">Day</option>{Array.from({length:days},(_,index)=><option key={index+1} value={index+1}>{index+1}</option>)}</select></div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[#625f58]"><input type="checkbox" checked={yearVisible} onChange={(event)=>setYearVisible(event.target.checked)} />I want to share my birth year with members</label>
          {yearVisible && <label className="mt-2 block text-sm">Birth year<input type="number" min="1900" max={CURRENT_YEAR} value={year} onChange={(event)=>setYear(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl border border-[#d8d0c1] bg-white px-3" /></label>}
          <label className="mt-3 flex items-center gap-2 text-sm text-[#625f58]"><input type="checkbox" checked={birthdayVisible} onChange={(event)=>setBirthdayVisible(event.target.checked)} />Show my birthday to invited family members</label>
        </fieldset>
        <label className="block text-sm font-medium">A little about you <span className="font-normal text-[#77736b]">(optional)</span><textarea maxLength={280} rows={2} value={intro} onChange={(event)=>setIntro(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8d0c1] bg-white p-3 outline-none focus:border-[#8a704a]" /></label>
        <label className="block text-sm font-medium">Preferred timezone<select value={timezone} onChange={(event)=>setTimezone(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#d8d0c1] bg-white px-3"><option value="Asia/Kolkata">India Standard Time</option><option value="UTC">UTC</option><option value="America/New_York">Eastern Time</option><option value="America/Los_Angeles">Pacific Time</option><option value="Europe/London">UK time</option></select></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#292820] px-4 font-medium text-white disabled:opacity-60">{saving ? 'Saving profile…' : 'Continue to Memories'}{!saving && <ArrowRight className="h-4 w-4" />}</button>
      </form>
    </section>
  </div>;
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { LockKeyhole, Pencil, Plane, Save, X } from 'lucide-react';
import { authStore } from '../../services/authStore';
import { travelVaultStore, type TripGoal } from '../../services/travelVaultStore';

interface TravelVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TravelVaultModal({ isOpen, onClose }: TravelVaultModalProps) {
  const [goal, setGoal] = useState<TripGoal>(() => travelVaultStore.getTripGoal());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TripGoal>(() => travelVaultStore.getTripGoal());
  const [saveError, setSaveError] = useState<string | null>(null);
  const isAdmin = authStore.isAdmin();
  const legacyEntries = travelVaultStore.getContributions();

  if (!isOpen) return null;

  const saveGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    const validTarget = Number.isFinite(draft.targetAmount) && draft.targetAmount >= 0;
    if (!validTarget) {
      setSaveError('Enter a valid target amount.');
      return;
    }
    const saved = travelVaultStore.updateTripGoal(draft);
    if (!saved) {
      setSaveError('Only a verified administrator can edit this local draft.');
      return;
    }
    setGoal({ ...draft });
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-fund-title"
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#d5c5a6] bg-[#f7f3ea] text-[#24231f] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[#ded8cb] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e9e0cf] text-[#806d52]"><Plane className="h-5 w-5" /></span>
            <div><h1 id="trip-fund-title" className="font-serif text-xl">Trip fund</h1><p className="mt-1 text-xs text-[#77736b]">A plan and contribution history</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close trip fund" className="rounded-full p-2 text-[#77736b] hover:bg-black/5 hover:text-[#24231f]"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          <div className="flex items-start gap-3 rounded-2xl border border-[#ded8cb] bg-white/65 p-4 text-sm leading-6 text-[#69675f]">
            <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#806d52]" />
            <p>Payments are disabled. This project has no server-side payment order creation or settlement verification configured, so it cannot safely accept or confirm contributions.</p>
          </div>

          <section className="rounded-3xl border border-[#ded8cb] bg-white/65 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#806d52]">Trip plan · local draft</p>
                <h2 className="mt-2 font-serif text-3xl">{goal.destination || 'No trip planned yet'}</h2>
                {goal.description && <p className="mt-2 max-w-xl text-sm leading-6 text-[#69675f]">{goal.description}</p>}
                {goal.departureDate && <p className="mt-3 text-xs text-[#77736b]">Planned date: {goal.departureDate}</p>}
              </div>
              {isAdmin && !editing && <button type="button" onClick={() => { setDraft(goal); setEditing(true); }} className="inline-flex items-center gap-2 rounded-full border border-[#c8b99e] px-4 py-2 text-xs font-medium hover:bg-[#f0e9dc]"><Pencil className="h-3.5 w-3.5" />Edit local draft</button>}
            </div>

            {goal.targetAmount > 0 && <p className="mt-5 border-t border-[#ded8cb] pt-4 text-sm text-[#69675f]">Target amount: <span className="font-medium text-[#24231f]">₹{goal.targetAmount.toLocaleString('en-IN')}</span></p>}

            {editing && (
              <form onSubmit={saveGoal} className="mt-6 grid gap-3 border-t border-[#ded8cb] pt-5 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-[#69675f] sm:col-span-2">Destination<input maxLength={120} value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })} className="rounded-xl border border-[#ded8cb] bg-white px-3 py-2.5 text-sm text-[#24231f]" /></label>
                <label className="grid gap-1 text-xs text-[#69675f]">Target amount<input type="number" min="0" step="1" value={draft.targetAmount} onChange={(event) => setDraft({ ...draft, targetAmount: Number(event.target.value) })} className="rounded-xl border border-[#ded8cb] bg-white px-3 py-2.5 text-sm text-[#24231f]" /></label>
                <label className="grid gap-1 text-xs text-[#69675f]">Planned date<input type="date" value={draft.departureDate} onChange={(event) => setDraft({ ...draft, departureDate: event.target.value })} className="rounded-xl border border-[#ded8cb] bg-white px-3 py-2.5 text-sm text-[#24231f]" /></label>
                <label className="grid gap-1 text-xs text-[#69675f] sm:col-span-2">Description<textarea maxLength={500} rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="rounded-xl border border-[#ded8cb] bg-white px-3 py-2.5 text-sm text-[#24231f]" /></label>
                {saveError && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{saveError}</p>}
                <div className="flex gap-2 sm:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#25241f] px-4 py-2.5 text-xs font-medium text-white"><Save className="h-3.5 w-3.5" />Save draft</button><button type="button" onClick={() => { setDraft(goal); setEditing(false); setSaveError(null); }} className="rounded-full border border-[#ded8cb] px-4 py-2.5 text-xs">Cancel</button></div>
              </form>
            )}
          </section>

          <section className="rounded-3xl border border-[#ded8cb] bg-white/65 p-5 sm:p-6">
            <h2 className="font-serif text-xl">Contribution history</h2>
            {legacyEntries.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[#77736b]">No contribution history is available from a verified payment service.</p>
            ) : (
              <>
                <p className="mt-2 text-xs leading-5 text-[#77736b]">These entries were stored in this browser. Their payment status cannot be verified, so they are shown as local records and are excluded from totals.</p>
                <ul className="mt-4 divide-y divide-[#ded8cb] rounded-2xl border border-[#ded8cb] bg-white/70">
                  {legacyEntries.map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-3 p-3 text-sm"><span>{entry.note || 'Local contribution note'}<span className="ml-2 text-xs text-[#77736b]">Unverified local record</span></span><span>₹{entry.amount.toLocaleString('en-IN')}</span></li>)}
                </ul>
              </>
            )}
          </section>
        </div>
      </motion.section>
    </div>
  );
}

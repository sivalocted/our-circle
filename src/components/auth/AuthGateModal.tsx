import { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabase';
import { authStore } from '../../services/authStore';

interface AuthGateProps {
  onPreview?: () => void;
}

export function AuthGateModal({ onPreview }: AuthGateProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    const { error: authError } = await authStore.signInWithSupabaseOAuth();
    if (authError) {
      setError(authError.message);
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-[#24231f]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative flex min-h-[48vh] flex-col justify-between overflow-hidden bg-[#25241f] px-7 py-8 text-[#f5f2eb] sm:px-12 sm:py-12 lg:min-h-screen lg:px-16">
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25">
              <Sparkles className="h-4 w-4 text-[#e5bd80]" />
            </div>
            <span className="font-serif text-lg tracking-tight">Our Circle</span>
          </div>

          <div className="relative z-10 max-w-xl py-16 lg:py-24">
            <p className="mb-5 text-[11px] uppercase tracking-[0.26em] text-[#e5bd80]">A private family archive</p>
            <h1 className="max-w-[12ch] font-serif text-5xl leading-[0.98] tracking-[-0.04em] sm:text-7xl">
              The moments that make us, kept close.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/65 sm:text-base">
              Photographs, plans, conversations and small games, gathered in one place for your circle.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs text-white/55">
            <LockKeyhole className="h-4 w-4" />
            Private access is available after the account connection is configured.
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-24 h-[440px] w-[440px] rounded-full border border-white/10 sm:right-[-7rem] sm:h-[600px] sm:w-[600px]">
            <div className="absolute inset-8 rounded-full border border-white/10" />
            <div className="absolute inset-20 rounded-full border border-white/10" />
            <div className="absolute inset-[34%] rounded-full bg-[#c69355]/15 blur-3xl" />
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-14 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#e9e0cf] text-[#665338]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#6b573b]">Welcome back</p>
              <h2 className="mt-2 font-serif text-4xl tracking-[-0.03em]">Sign in to your circle</h2>
              <p className="mt-3 text-sm leading-6 text-[#6c6a64]">
                Access is verified through the connected identity provider. An email address alone does not grant access.
              </p>
            </div>

            {isSupabaseConfigured ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="flex min-h-12 w-full items-center justify-between rounded-full bg-[#25241f] px-5 text-sm font-medium text-white transition hover:bg-[#3b3932] disabled:cursor-wait disabled:opacity-60"
              >
                <span>{isSigningIn ? 'Connecting securely…' : 'Continue with Google'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="rounded-2xl border border-[#ded8cb] bg-white/70 p-5">
                <p className="text-sm font-medium">Account connection is not configured</p>
                <p className="mt-2 text-sm leading-6 text-[#6c6a64]">
                  Set the Supabase project URL and publishable key, then configure Google sign-in and database access policies. No local password or admin shortcut is available.
                </p>
                {import.meta.env.DEV && onPreview && (
                  <button
                    type="button"
                    onClick={onPreview}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-between rounded-full border border-[#c8b99e] px-4 text-sm font-medium transition hover:bg-[#f0e9dc]"
                  >
                    <span>Explore local preview</span>
                    <span className="text-xs text-[#77736b]">local browser data</span>
                  </button>
                )}
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
            <p className="mt-7 text-xs leading-5 text-[#625f58]">
              Account invitations and administrator access are managed by the service, not by this browser.
            </p>
            <div className="mt-12 border-t border-[#ded8cb] pt-5 text-xs text-[#625f58]">A private space for the people who belong here.</div>
          </div>
        </section>
      </div>
    </main>
  );
}

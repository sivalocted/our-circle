import { ArrowDownRight, ArrowRight, CalendarDays, Images, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { REAL_PHOTOS } from '../data/circleData';
import { SafeImage } from '../components/SafeImage';

function formatMemoryDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(parsed);
}

export function HomePage({ preview = false }: { preview?: boolean }) {
  const localImages = REAL_PHOTOS.filter((photo) => photo.cardUrl.startsWith('/photos/'));
  const [featured, ...companions] = localImages.length > 0 ? localImages : REAL_PHOTOS;

  return (
    <main className="bg-[#f5f2eb] text-[#24231f]">
      {preview && (
        <div className="border-b border-[#e0d8c8] bg-[#eee7da] px-4 py-2 text-center text-xs text-[#6c5c43]">
          Local preview · account and shared data services are not configured
        </div>
      )}

      <section className="mx-auto grid max-w-[1500px] gap-10 px-4 pb-16 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[.85fr_1.15fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="relative z-10 max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.23em] text-[#8a704a]">
            <Sparkles className="h-4 w-4" /> A place for your people
          </div>
          <h1 className="max-w-[11ch] font-serif text-6xl leading-[0.91] tracking-[-0.055em] sm:text-7xl xl:text-[92px]">
            Keep the good close.
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-[#69675f] sm:text-lg sm:leading-8">
            A shared home for the photographs, plans and little rituals that make a family feel near.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/memories" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#272620] px-6 text-sm font-medium text-white transition hover:bg-[#403e35]">
              Open memories <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/calendar" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#cfc7b9] px-5 text-sm text-[#4d4b45] transition hover:bg-white/70">
              <CalendarDays className="h-4 w-4" /> See the calendar
            </Link>
          </div>
          <div className="mt-14 flex items-center gap-3 border-t border-[#ded8cb] pt-5 text-xs text-[#89867f]">
            <ArrowDownRight className="h-4 w-4" /> Take a look around your circle
          </div>
        </div>

        {featured ? (
          <div className="grid min-h-[440px] grid-cols-12 grid-rows-[1fr_110px] gap-3 sm:min-h-[580px] sm:gap-4">
            <Link to="/memories" className="group relative col-span-8 row-span-2 overflow-hidden rounded-[2rem] bg-[#d9d2c5]">
              <SafeImage containerClassName="absolute inset-0" src={featured.cardUrl || featured.fullUrl} alt={`Family memory from ${featured.dateFormatted}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" fetchPriority="high" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-7">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">A moment from the archive</p>
                  <p className="mt-2 font-serif text-2xl sm:text-3xl">{formatMemoryDate(featured.dateFormatted)}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
            {companions.slice(0, 2).map((photo, index) => (
              <Link key={photo.id} to="/memories" className={`group relative col-span-4 overflow-hidden rounded-[1.5rem] bg-[#ded8cc] ${index === 0 ? 'row-span-1' : 'row-span-1'}`}>
                <SafeImage containerClassName="absolute inset-0" src={photo.cardUrl} alt={`Family memory from ${photo.dateFormatted}`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-3 left-3 text-[10px] tracking-wide text-white/90">{formatMemoryDate(photo.dateFormatted)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#cfc7b9] p-8 text-center">
            <Images className="h-7 w-7 text-[#8a704a]" />
            <h2 className="mt-4 font-serif text-2xl">Your archive starts here</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#69675f]">No shared memories are available yet. Add a photo collection when connected storage is ready.</p>
          </div>
        )}
      </section>

      <section className="border-y border-[#ded8cb] bg-[#ede8de]">
        <div className="mx-auto grid max-w-[1500px] gap-px px-4 sm:px-8 md:grid-cols-3">
          <Link to="/memories" className="group flex min-h-40 items-center justify-between gap-4 border-b border-[#d9d1c3] py-7 md:border-b-0 md:border-r md:pr-8">
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a704a]">01 · Remember</p><h2 className="mt-2 font-serif text-3xl">Memories</h2><p className="mt-1 text-sm text-[#69675f]">Browse the moments you’ve kept.</p></div>
            <ArrowRight className="h-5 w-5 text-[#8a704a] transition group-hover:translate-x-1" />
          </Link>
          <Link to="/play" className="group flex min-h-40 items-center justify-between gap-4 border-b border-[#d9d1c3] py-7 md:border-b-0 md:border-r md:px-8">
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a704a]">02 · Play</p><h2 className="mt-2 font-serif text-3xl">Little games</h2><p className="mt-1 text-sm text-[#69675f]">A few minutes of friendly fun.</p></div>
            <ArrowRight className="h-5 w-5 text-[#8a704a] transition group-hover:translate-x-1" />
          </Link>
          <Link to="/calendar" className="group flex min-h-40 items-center justify-between gap-4 py-7 md:pl-8">
            <div><p className="text-[10px] uppercase tracking-[0.2em] text-[#8a704a]">03 · Get together</p><h2 className="mt-2 font-serif text-3xl">Calendar</h2><p className="mt-1 text-sm text-[#69675f]">Keep the next date in view.</p></div>
            <ArrowRight className="h-5 w-5 text-[#8a704a] transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-8 text-xs text-[#89867f] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-serif text-sm text-[#4d4b45]">Our Circle</span>
        <span>Made for the moments you want to keep.</span>
      </footer>
    </main>
  );
}

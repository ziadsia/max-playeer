import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { PlayerProvider } from '../hooks/usePlayer';
import { useAuth } from '../hooks/useAuth';
import { useI18n, type TKey } from '../i18n';

const NAV: [string, TKey, string][] = [
  ['/', 'dashboard', 'home'], ['/live', 'live', 'tv'], ['/movies', 'movies', 'film'], ['/series', 'series', 'series'],
  ['/favorites', 'favorites', 'heart'], ['/recent', 'recent', 'clock'], ['/search', 'search', 'search'], ['/settings', 'settings', 'settings'],
];

export const Logo = ({ className = 'text-3xl' }: { className?: string }) => (
  <span className={`font-black tracking-[0.2em] text-white ${className}`} style={{ textShadow: '0 0 24px rgba(37,99,255,.7)' }}>
    MA<span className="text-max-blue">X</span>
  </span>
);

function Shell() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-max-line bg-max-panel p-4 transition-transform duration-300 ltr:border-r rtl:border-l lg:sticky lg:top-0 lg:h-screen lg:shrink-0
        ${open ? '' : 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'}`}
      >
        <div className="mb-8 mt-2 px-2"><Logo /></div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map(([to, key, icon]) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-max-blue text-white shadow-lg shadow-max-blue/25' : 'text-slate-300 hover:bg-max-card hover:text-white'}`}
            >
              <Icon name={icon} className="h-5 w-5" /> {t(key)}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="btn-ghost mt-3 justify-start"><Icon name="logout" className="h-4 w-4" /> {t('logout')}</button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-max-line bg-max-bg/80 px-4 py-3 backdrop-blur lg:px-8">
          <button className="btn-ghost !px-3 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
          <form className="flex-1" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav('/search?q=' + encodeURIComponent(q.trim())); }}>
            <div className="relative max-w-xl">
              <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-slate-500"><Icon name="search" className="h-4 w-4" /></span>
              <input className="input !rounded-full !ps-10 !py-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPh')} aria-label={t('search')} />
            </div>
          </form>
          <span className="hidden rounded-full border border-max-line bg-max-panel px-4 py-1.5 text-sm text-slate-300 sm:block">{user?.username}</span>
        </header>
        <main className="p-4 lg:p-8"><div key={loc.pathname} className="animate-fade"><Outlet /></div></main>
      </div>
    </div>
  );
}

export default function Layout() {
  return <PlayerProvider><Shell /></PlayerProvider>;
}

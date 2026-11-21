import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import type { Category } from '../types';
import Icon from './Icon';

export const Spinner = () => <div className="h-9 w-9 animate-spin rounded-full border-4 border-max-line border-t-max-glow" role="status" />;
export const Loading = () => <div className="flex justify-center py-24"><Spinner /></div>;

export function ErrorBox({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="panel mx-auto my-12 max-w-md text-center">
      <p className="mb-4 text-slate-300">{t('loadFail')}</p>
      {onRetry && <button className="btn" onClick={onRetry}>{t('retry')}</button>}
    </div>
  );
}
export const Empty = ({ text }: { text?: string }) => {
  const { t } = useI18n();
  return <p className="py-16 text-center text-slate-400">{text ?? t('noResults')}</p>;
};

export const PageHeader = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

export function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <div className="scroll-row">{children}</div>
    </section>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full min-w-[200px] sm:w-72">
      <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-slate-500"><Icon name="search" className="h-4 w-4" /></span>
      <input className="input !ps-9 !py-2" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function CategoryBar({ cats, value, onChange }: { cats: Category[]; value: string; onChange: (id: string) => void }) {
  const { t } = useI18n();
  const all = [{ category_id: 'all', category_name: t('all') }, ...cats];
  return (
    <div className="scroll-row mb-5">
      {all.map((c) => (
        <button
          key={c.category_id} onClick={() => onChange(String(c.category_id))}
          className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
            value === String(c.category_id) ? 'border-max-blue bg-max-blue text-white' : 'border-max-line bg-max-panel text-slate-300 hover:border-max-glow'
          }`}
        >{c.category_name}</button>
      ))}
    </div>
  );
}

/** Progressive rendering for very large lists (thousands of channels/movies). */
export function useInfinite(len: number, step = 48, resetOn: unknown[] = []) {
  const [count, setCount] = useState(step);
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setCount(step), resetOn);
  useEffect(() => {
    const el = ref.current;
    if (!el || count >= len) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setCount((c) => Math.min(c + step, len)); }, { rootMargin: '700px' });
    io.observe(el);
    return () => io.disconnect();
  }, [len, step, count]);
  return { count, ref };
}

export const GRID_POSTER = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6';
export const GRID_WIDE = 'grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4';

export const yearOf = (name: string, ...more: (string | undefined)[]) => {
  for (const m of more) { const y = m?.match(/\d{4}/)?.[0]; if (y) return y; }
  return name.match(/\((\d{4})\)/)?.[1] ?? '';
};
export const ratingOf = (r?: string | number) => { const n = Number(r); return n > 0 ? n.toFixed(1) : ''; };
export const firstOf = (v?: string[] | string) => (Array.isArray(v) ? v[0] : v);

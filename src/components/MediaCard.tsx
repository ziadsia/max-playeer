import { useState } from 'react';
import Icon from './Icon';
import { useI18n } from '../i18n';

interface Props {
  title: string; image?: string; sub?: string; wide?: boolean; badge?: string;
  onClick: () => void; fav?: boolean; onFav?: () => void; progress?: number; active?: boolean;
}

export default function MediaCard({ title, image, sub, wide, badge, onClick, fav, onFav, progress, active }: Props) {
  const { t } = useI18n();
  const [bad, setBad] = useState(false);
  return (
    <div className="group relative">
      <button onClick={onClick} className="block w-full text-start">
        <div className={`relative overflow-hidden rounded-xl bg-max-card ring-1 transition ${active ? 'ring-2 ring-max-blue' : 'ring-max-line group-hover:ring-max-glow'} ${wide ? 'aspect-video' : 'aspect-[2/3]'}`}>
          {image && !bad ? (
            <img src={image} alt="" loading="lazy" onError={() => setBad(true)}
              className={`h-full w-full transition duration-300 group-hover:scale-105 ${wide ? 'object-contain p-5' : 'object-cover'}`} />
          ) : (
            <div className="grid h-full place-items-center text-4xl font-black text-max-glow/50">{title.trim().slice(0, 1)}</div>
          )}
          <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-max-blue"><Icon name="play" className="h-5 w-5" fill /></span>
          </div>
          {badge && <span className="absolute start-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-bold text-amber-300">★ {badge}</span>}
          {progress ? <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60"><div className="h-full bg-max-blue" style={{ width: `${Math.min(100, progress)}%` }} /></div> : null}
        </div>
        <p className="mt-2 truncate px-1 text-sm font-semibold">{title}</p>
        {sub ? <p className="truncate px-1 text-xs text-slate-400">{sub}</p> : null}
      </button>
      {onFav && (
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          aria-label={fav ? t('removeFav') : t('addFav')} aria-pressed={!!fav}
          className={`absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur transition hover:bg-black ${fav ? 'text-rose-500' : 'text-white/80 opacity-0 focus:opacity-100 group-hover:opacity-100 max-sm:opacity-100'}`}
        >
          <Icon name="heart" className="h-4 w-4" fill={fav} />
        </button>
      )}
    </div>
  );
}

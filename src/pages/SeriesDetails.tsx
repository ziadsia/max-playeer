import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { ErrorBox, Loading, firstOf, ratingOf, yearOf } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites, useProgress } from '../hooks/useLibrary';
import { usePlayer } from '../hooks/usePlayer';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import type { Episode, SeriesInfo } from '../types';

function seasonsOf(si?: SeriesInfo): [string, Episode[]][] {
  const e = si?.episodes;
  if (!e) return [];
  if (Array.isArray(e)) {
    const m: Record<string, Episode[]> = {};
    e.forEach((ep) => { (m[String(ep.season ?? 1)] ||= []).push(ep); });
    return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0]));
  }
  return Object.entries(e).filter(([, v]) => Array.isArray(v)).sort((a, b) => Number(a[0]) - Number(b[0]));
}

export default function SeriesDetails() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const nav = useNavigate();
  const { play } = usePlayer();
  const fav = useFavorites();
  const prog = useProgress();
  const info = useAsync(() => api.seriesInfo(id), [id]);
  const [sel, setSel] = useState<string | null>(null);
  const seasons = useMemo(() => seasonsOf(info.data), [info.data]);

  if (info.loading && !info.data) return <Loading />;
  if (info.error || !info.data || !info.data.info) return <ErrorBox onRetry={info.retry} />;

  const i = info.data.info;
  const name = i.name || '';
  const poster = i.cover;
  const bg = firstOf(i.backdrop_path) || poster;
  const season = sel && seasons.some(([k]) => k === sel) ? sel : seasons[0]?.[0];
  const eps = seasons.find(([k]) => k === season)?.[1] || [];
  const key = mk('series', id);
  const isFav = fav.has(key);
  const meta = [yearOf(name, i.releaseDate), ratingOf(i.rating) && `★ ${ratingOf(i.rating)}`, i.genre].filter(Boolean);

  return (
    <div>
      <button className="btn-ghost mb-4" onClick={() => nav(-1)}><Icon name="back" className="h-4 w-4 rtl:rotate-180" /> {t('back')}</button>
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-max-line">
        {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />}
        <div className="absolute inset-0 bg-gradient-to-t from-max-bg via-max-bg/70 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-10">
          {poster && <img src={poster} alt={name} className="w-44 shrink-0 self-center rounded-2xl shadow-2xl ring-1 ring-max-line sm:self-start" />}
          <div className="min-w-0 flex-1">
            <h1 className="mb-3 text-3xl font-black" dir="auto">{name}</h1>
            <p className="mb-5 text-sm text-slate-300">{meta.join('  •  ')}</p>
            <button className={`btn-ghost mb-5 ${isFav ? '!text-rose-500' : ''}`} onClick={() => fav.toggle({ key, type: 'series', id, title: name, poster })}>
              <Icon name="heart" className="h-4 w-4" fill={isFav} /> {isFav ? t('removeFav') : t('addFav')}
            </button>
            {i.plot && <p className="mb-4 max-w-3xl leading-7 text-slate-300" dir="auto">{i.plot}</p>}
            {i.director && <p className="text-sm text-slate-400"><b className="text-slate-200">{t('director')}:</b> {i.director}</p>}
            {i.cast && <p className="text-sm text-slate-400"><b className="text-slate-200">{t('cast')}:</b> {i.cast}</p>}
          </div>
        </div>
      </div>

      {seasons.length === 0 ? <p className="text-slate-400">{t('empty')}</p> : (
        <>
          <div className="scroll-row mb-4">
            {seasons.map(([k]) => (
              <button key={k} onClick={() => setSel(k)} className={`shrink-0 rounded-full border px-5 py-1.5 text-sm font-semibold ${k === season ? 'border-max-blue bg-max-blue' : 'border-max-line bg-max-panel text-slate-300 hover:border-max-glow'}`}>
                {t('season')} {k}
              </button>
            ))}
          </div>
          <h2 className="mb-3 text-lg font-bold">{t('episodes')} ({eps.length})</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {eps.map((ep) => {
              const ek = mk('episode', ep.id);
              const p = prog.map[ek];
              const title = `${name} - S${season}E${ep.episode_num}`;
              const img = ep.info?.movie_image || poster;
              return (
                <li key={ep.id}>
                  <button
                    className="panel flex w-full items-center gap-4 !p-3 text-start transition hover:border-max-blue"
                    onClick={() => play({ type: 'episode', id: ep.id, ext: ep.container_extension || 'mp4', title, poster: img })}
                  >
                    <span className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-max-card">
                      {img && <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      <span className="absolute inset-0 grid place-items-center bg-black/30"><Icon name="play" className="h-5 w-5" fill /></span>
                      {p && p.d ? <span className="absolute inset-x-0 bottom-0 h-1 bg-black/60"><span className="block h-full bg-max-blue" style={{ width: `${(p.t / p.d) * 100}%` }} /></span> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold" dir="auto">{t('episode')} {ep.episode_num}{ep.title ? ` — ${ep.title}` : ''}</span>
                      <span className="block truncate text-xs text-slate-400">{ep.info?.duration || ''}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

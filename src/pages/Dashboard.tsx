import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import MediaCard from '../components/MediaCard';
import { LibRow } from '../components/LibGrid';
import { Row, ratingOf, yearOf } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites, useHistory } from '../hooks/useLibrary';
import { useI18n } from '../i18n';
import { api } from '../services/api';

export const useExpiry = () => {
  const { t, locale } = useI18n();
  return (exp?: string | null) => (exp && Number(exp) > 0 ? new Date(Number(exp) * 1000).toLocaleDateString(locale) : t('unlimited'));
};

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const fmtExp = useExpiry();
  const fav = useFavorites();
  const hist = useHistory();
  const live = useAsync(() => api.live(), []);
  const vod = useAsync(() => api.vod(), []);
  const ser = useAsync(() => api.series(), []);

  const newest = useMemo(() => [...(vod.data || [])].sort((a, b) => Number(b.added || 0) - Number(a.added || 0)).slice(0, 16), [vod.data]);
  const newSeries = useMemo(() => [...(ser.data || [])].sort((a, b) => Number(b.last_modified || 0) - Number(a.last_modified || 0)).slice(0, 16), [ser.data]);

  const stats = [
    { label: t('liveChannels'), n: live.data?.length, icon: 'tv', to: '/live' },
    { label: t('movies'), n: vod.data?.length, icon: 'film', to: '/movies' },
    { label: t('series'), n: ser.data?.length, icon: 'series', to: '/series' },
  ];

  return (
    <div>
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-max-line bg-gradient-to-br from-max-card via-max-panel to-max-bg p-6 sm:p-10">
        <div className="pointer-events-none absolute -end-20 -top-20 h-72 w-72 rounded-full bg-max-blue/25 blur-[90px]" />
        <p className="text-sm text-slate-400">{t('welcome')}</p>
        <h1 className="mb-6 text-3xl font-black sm:text-4xl" dir="auto">{user?.username}</h1>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-300">
          <span>{t('status')}: <b className="text-white">{user?.status}</b></span>
          <span>{t('expires')}: <b className="text-white">{fmtExp(user?.exp_date)}</b></span>
          {user?.max_connections && <span>{t('connections')}: <b className="text-white">{user.active_cons ?? 0} / {user.max_connections}</b></span>}
        </div>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <button key={s.to} onClick={() => nav(s.to)} className="panel flex items-center gap-4 text-start transition hover:border-max-blue">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-max-blue/15 text-max-glow"><Icon name={s.icon} className="h-6 w-6" /></span>
            <span><span className="block text-2xl font-black tabular-nums">{s.n ?? '—'}</span><span className="text-sm text-slate-400">{s.label}</span></span>
          </button>
        ))}
      </div>

      <LibRow title={t('continueWatching')} items={hist.items.slice(0, 14)} />
      <LibRow title={t('favorites')} items={fav.items.slice(0, 14)} />

      {newest.length > 0 && (
        <Row title={`${t('recentlyAdded')} · ${t('movies')}`}>
          {newest.map((m) => (
            <div key={m.stream_id} className="w-36 shrink-0 sm:w-40">
              <MediaCard title={m.name} image={m.stream_icon} sub={yearOf(m.name, m.year)} badge={ratingOf(m.rating)} onClick={() => nav(`/movies/${m.stream_id}`)}
                fav={fav.has(mk('movie', m.stream_id))} onFav={() => fav.toggle({ key: mk('movie', m.stream_id), type: 'movie', id: m.stream_id, title: m.name, poster: m.stream_icon, ext: m.container_extension })} />
            </div>
          ))}
        </Row>
      )}
      {newSeries.length > 0 && (
        <Row title={t('newSeries')}>
          {newSeries.map((s) => (
            <div key={s.series_id} className="w-36 shrink-0 sm:w-40">
              <MediaCard title={s.name} image={s.cover} sub={yearOf(s.name, s.releaseDate)} badge={ratingOf(s.rating)} onClick={() => nav(`/series/${s.series_id}`)}
                fav={fav.has(mk('series', s.series_id))} onFav={() => fav.toggle({ key: mk('series', s.series_id), type: 'series', id: s.series_id, title: s.name, poster: s.cover })} />
            </div>
          ))}
        </Row>
      )}
    </div>
  );
}

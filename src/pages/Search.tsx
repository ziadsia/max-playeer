import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MediaCard from '../components/MediaCard';
import { Empty, ErrorBox, GRID_POSTER, GRID_WIDE, Loading, PageHeader, SearchInput, ratingOf, yearOf } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites } from '../hooks/useLibrary';
import { usePlayer } from '../hooks/usePlayer';
import { useI18n } from '../i18n';
import { api } from '../services/api';

const LIMIT = 36;

export default function Search() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { play } = usePlayer();
  const fav = useFavorites();
  const [params] = useSearchParams();
  const urlQ = params.get('q') || '';
  const [input, setInput] = useState(urlQ);
  useEffect(() => setInput(urlQ), [urlQ]);
  const q = useDeferredValue(input);

  const live = useAsync(() => api.live(), []);
  const vod = useAsync(() => api.vod(), []);
  const ser = useAsync(() => api.series(), []);

  const res = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return null;
    const f = <T extends { name: string }>(a?: T[]) => (a || []).filter((x) => (x.name || '').toLowerCase().includes(qq));
    return { live: f(live.data), vod: f(vod.data), ser: f(ser.data) };
  }, [q, live.data, vod.data, ser.data]);

  const loading = (live.loading && !live.data) || (vod.loading && !vod.data) || (ser.loading && !ser.data);
  const failed = live.error && vod.error && ser.error;

  return (
    <div>
      <PageHeader title={t('search')}><SearchInput value={input} onChange={setInput} placeholder={t('searchPh')} /></PageHeader>
      {failed ? <ErrorBox onRetry={() => { live.retry(); vod.retry(); ser.retry(); }} /> : loading && q ? <Loading /> : !res ? <Empty text={t('searchPh')} /> :
        res.live.length + res.vod.length + res.ser.length === 0 ? <Empty /> : (
          <div className="space-y-10">
            {res.live.length > 0 && (
              <section><h2 className="mb-3 text-lg font-bold">{t('live')} ({res.live.length})</h2>
                <div className={GRID_WIDE}>{res.live.slice(0, LIMIT).map((s) => (
                  <MediaCard key={s.stream_id} wide title={s.name} image={s.stream_icon}
                    onClick={() => play({ type: 'live', id: s.stream_id, ext: 'm3u8', title: s.name, poster: s.stream_icon })}
                    fav={fav.has(mk('live', s.stream_id))}
                    onFav={() => fav.toggle({ key: mk('live', s.stream_id), type: 'live', id: s.stream_id, title: s.name, poster: s.stream_icon, ext: 'm3u8' })} />
                ))}</div></section>
            )}
            {res.vod.length > 0 && (
              <section><h2 className="mb-3 text-lg font-bold">{t('movies')} ({res.vod.length})</h2>
                <div className={GRID_POSTER}>{res.vod.slice(0, LIMIT).map((m) => (
                  <MediaCard key={m.stream_id} title={m.name} image={m.stream_icon} sub={yearOf(m.name, m.year)} badge={ratingOf(m.rating)}
                    onClick={() => nav(`/movies/${m.stream_id}`)} fav={fav.has(mk('movie', m.stream_id))}
                    onFav={() => fav.toggle({ key: mk('movie', m.stream_id), type: 'movie', id: m.stream_id, title: m.name, poster: m.stream_icon, ext: m.container_extension })} />
                ))}</div></section>
            )}
            {res.ser.length > 0 && (
              <section><h2 className="mb-3 text-lg font-bold">{t('series')} ({res.ser.length})</h2>
                <div className={GRID_POSTER}>{res.ser.slice(0, LIMIT).map((s) => (
                  <MediaCard key={s.series_id} title={s.name} image={s.cover} sub={yearOf(s.name, s.releaseDate)} badge={ratingOf(s.rating)}
                    onClick={() => nav(`/series/${s.series_id}`)} fav={fav.has(mk('series', s.series_id))}
                    onFav={() => fav.toggle({ key: mk('series', s.series_id), type: 'series', id: s.series_id, title: s.name, poster: s.cover })} />
                ))}</div></section>
            )}
          </div>
        )}
    </div>
  );
}

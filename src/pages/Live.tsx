import { useMemo, useState } from 'react';
import MediaCard from '../components/MediaCard';
import VideoPlayer from '../components/VideoPlayer';
import Icon from '../components/Icon';
import { CategoryBar, Empty, ErrorBox, Loading, PageHeader, SearchInput, useInfinite } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites, useHistory } from '../hooks/useLibrary';
import { useI18n } from '../i18n';
import { api, streamUrl } from '../services/api';
import type { EpgItem, LiveStream } from '../types';

const b64 = (s?: string) => {
  if (!s) return '';
  try { return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))); } catch { return s; }
};

export default function Live() {
  const { t } = useI18n();
  const cats = useAsync(() => api.liveCategories(), []);
  const streams = useAsync(() => api.live(), []);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [cur, setCur] = useState<LiveStream | null>(null);
  const fav = useFavorites();
  const hist = useHistory();

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (streams.data || []).filter((s) => (cat === 'all' || s.category_id === cat) && (!qq || (s.name || '').toLowerCase().includes(qq)));
  }, [streams.data, cat, q]);
  const { count, ref } = useInfinite(filtered.length, 60, [cat, q]);
  const epg = useAsync<EpgItem[]>(() => (cur ? api.epg(cur.stream_id).catch(() => []) : Promise.resolve([])), [cur?.stream_id]);

  const choose = (s: LiveStream) => {
    setCur(s);
    hist.push({ key: mk('live', s.stream_id), type: 'live', id: s.stream_id, title: s.name, poster: s.stream_icon, ext: 'm3u8' });
  };

  if (streams.loading && !streams.data) return <Loading />;
  if (streams.error) return <ErrorBox onRetry={streams.retry} />;
  const now = epg.data?.[0], next = epg.data?.[1];

  return (
    <div>
      <PageHeader title={t('live')}><SearchInput value={q} onChange={setQ} placeholder={t('filterPh')} /></PageHeader>
      {cats.data && <CategoryBar cats={cats.data} value={cat} onChange={setCat} />}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-6">
        <div className="mb-6 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          {cur ? (
            <>
              <VideoPlayer key={cur.stream_id} src={streamUrl('live', cur.stream_id, 'm3u8')} title={cur.name} live />
              <div className="panel mt-3 !p-4">
                <div className="flex items-center gap-3">
                  <h2 className="min-w-0 flex-1 truncate text-lg font-bold" dir="auto">{cur.name}</h2>
                  <button
                    className={`btn-ghost !px-3 ${fav.has(mk('live', cur.stream_id)) ? '!text-rose-500' : ''}`}
                    aria-label={fav.has(mk('live', cur.stream_id)) ? t('removeFav') : t('addFav')}
                    onClick={() => fav.toggle({ key: mk('live', cur.stream_id), type: 'live', id: cur.stream_id, title: cur.name, poster: cur.stream_icon, ext: 'm3u8' })}
                  ><Icon name="heart" fill={fav.has(mk('live', cur.stream_id))} /></button>
                </div>
                {now && <p className="mt-2 text-sm text-slate-300" dir="auto"><span className="text-max-glow">{t('nowPlaying')}:</span> {b64(now.title)}</p>}
                {next && <p className="text-xs text-slate-500" dir="auto">{t('next')}: {b64(next.title)}</p>}
              </div>
            </>
          ) : (
            <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-max-line text-sm text-slate-500">{t('selectChannel')}</div>
          )}
        </div>

        <div className="lg:order-1">
          {filtered.length === 0 ? <Empty /> : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
                {filtered.slice(0, count).map((s) => (
                  <MediaCard
                    key={s.stream_id} wide title={s.name} image={s.stream_icon} active={cur?.stream_id === s.stream_id}
                    onClick={() => choose(s)} fav={fav.has(mk('live', s.stream_id))}
                    onFav={() => fav.toggle({ key: mk('live', s.stream_id), type: 'live', id: s.stream_id, title: s.name, poster: s.stream_icon, ext: 'm3u8' })}
                  />
                ))}
              </div>
              <div ref={ref} className="h-8" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

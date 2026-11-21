import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaCard from '../components/MediaCard';
import { CategoryBar, Empty, ErrorBox, GRID_POSTER, Loading, PageHeader, SearchInput, ratingOf, useInfinite, yearOf } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites, useProgress } from '../hooks/useLibrary';
import { useI18n } from '../i18n';
import { api } from '../services/api';

type Sort = 'new' | 'rating' | 'name';

export default function Movies() {
  const { t } = useI18n();
  const nav = useNavigate();
  const cats = useAsync(() => api.vodCategories(), []);
  const vod = useAsync(() => api.vod(), []);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('new');
  const fav = useFavorites();
  const prog = useProgress();

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const a = (vod.data || []).filter((m) => (cat === 'all' || m.category_id === cat) && (!qq || (m.name || '').toLowerCase().includes(qq)));
    if (sort === 'new') a.sort((x, y) => Number(y.added || 0) - Number(x.added || 0));
    else if (sort === 'rating') a.sort((x, y) => Number(y.rating || 0) - Number(x.rating || 0));
    else a.sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    return a;
  }, [vod.data, cat, q, sort]);
  const { count, ref } = useInfinite(items.length, 48, [cat, q, sort]);

  if (vod.loading && !vod.data) return <Loading />;
  if (vod.error) return <ErrorBox onRetry={vod.retry} />;

  return (
    <div>
      <PageHeader title={t('movies')}>
        <SearchInput value={q} onChange={setQ} placeholder={t('filterPh')} />
        <select className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="new">{t('sortNew')}</option><option value="rating">{t('sortRating')}</option><option value="name">{t('sortName')}</option>
        </select>
      </PageHeader>
      {cats.data && <CategoryBar cats={cats.data} value={cat} onChange={setCat} />}
      {items.length === 0 ? <Empty /> : (
        <>
          <div className={GRID_POSTER}>
            {items.slice(0, count).map((m) => {
              const p = prog.map[mk('movie', m.stream_id)];
              return (
                <MediaCard
                  key={m.stream_id} title={m.name} image={m.stream_icon} sub={yearOf(m.name, m.year)} badge={ratingOf(m.rating)}
                  progress={p && p.d ? (p.t / p.d) * 100 : 0} onClick={() => nav(`/movies/${m.stream_id}`)}
                  fav={fav.has(mk('movie', m.stream_id))}
                  onFav={() => fav.toggle({ key: mk('movie', m.stream_id), type: 'movie', id: m.stream_id, title: m.name, poster: m.stream_icon, ext: m.container_extension })}
                />
              );
            })}
          </div>
          <div ref={ref} className="h-8" />
        </>
      )}
    </div>
  );
}

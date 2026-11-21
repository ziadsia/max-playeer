import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaCard from '../components/MediaCard';
import { CategoryBar, Empty, ErrorBox, GRID_POSTER, Loading, PageHeader, SearchInput, ratingOf, useInfinite, yearOf } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites } from '../hooks/useLibrary';
import { useI18n } from '../i18n';
import { api } from '../services/api';

type Sort = 'new' | 'rating' | 'name';

export default function SeriesPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const cats = useAsync(() => api.seriesCategories(), []);
  const ser = useAsync(() => api.series(), []);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('new');
  const fav = useFavorites();

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const a = (ser.data || []).filter((s) => (cat === 'all' || s.category_id === cat) && (!qq || (s.name || '').toLowerCase().includes(qq)));
    if (sort === 'new') a.sort((x, y) => Number(y.last_modified || 0) - Number(x.last_modified || 0));
    else if (sort === 'rating') a.sort((x, y) => Number(y.rating || 0) - Number(x.rating || 0));
    else a.sort((x, y) => (x.name || '').localeCompare(y.name || ''));
    return a;
  }, [ser.data, cat, q, sort]);
  const { count, ref } = useInfinite(items.length, 48, [cat, q, sort]);

  if (ser.loading && !ser.data) return <Loading />;
  if (ser.error) return <ErrorBox onRetry={ser.retry} />;

  return (
    <div>
      <PageHeader title={t('series')}>
        <SearchInput value={q} onChange={setQ} placeholder={t('filterPh')} />
        <select className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="new">{t('sortNew')}</option><option value="rating">{t('sortRating')}</option><option value="name">{t('sortName')}</option>
        </select>
      </PageHeader>
      {cats.data && <CategoryBar cats={cats.data} value={cat} onChange={setCat} />}
      {items.length === 0 ? <Empty /> : (
        <>
          <div className={GRID_POSTER}>
            {items.slice(0, count).map((s) => (
              <MediaCard
                key={s.series_id} title={s.name} image={s.cover} sub={yearOf(s.name, s.releaseDate)} badge={ratingOf(s.rating)}
                onClick={() => nav(`/series/${s.series_id}`)} fav={fav.has(mk('series', s.series_id))}
                onFav={() => fav.toggle({ key: mk('series', s.series_id), type: 'series', id: s.series_id, title: s.name, poster: s.cover })}
              />
            ))}
          </div>
          <div ref={ref} className="h-8" />
        </>
      )}
    </div>
  );
}

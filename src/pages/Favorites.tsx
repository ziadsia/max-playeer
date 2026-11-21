import { useState } from 'react';
import LibGrid from '../components/LibGrid';
import { Empty, PageHeader } from '../components/ui';
import { useFavorites } from '../hooks/useLibrary';
import { useI18n } from '../i18n';

export default function Favorites() {
  const { t } = useI18n();
  const fav = useFavorites();
  const [tab, setTab] = useState<'all' | 'live' | 'movie' | 'series'>('all');
  const tabs = [['all', t('all')], ['live', t('live')], ['movie', t('movies')], ['series', t('series')]] as const;
  const items = fav.items.filter((i) => tab === 'all' || i.type === tab);
  return (
    <div>
      <PageHeader title={t('favorites')} />
      <div className="scroll-row mb-5">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full border px-5 py-1.5 text-sm font-semibold ${tab === k ? 'border-max-blue bg-max-blue' : 'border-max-line bg-max-panel text-slate-300 hover:border-max-glow'}`}>{label}</button>
        ))}
      </div>
      {items.length ? <LibGrid items={items} /> : <Empty text={t('empty')} />}
    </div>
  );
}

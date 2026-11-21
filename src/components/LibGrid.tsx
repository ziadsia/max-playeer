import MediaCard from './MediaCard';
import { GRID_POSTER, GRID_WIDE, Row } from './ui';
import { useFavorites, useProgress } from '../hooks/useLibrary';
import { useOpen } from '../hooks/useOpen';
import { useI18n, type TKey } from '../i18n';
import type { LibItem } from '../types';

const LABEL: Record<string, TKey> = { live: 'live', movie: 'movies', series: 'series', episode: 'episode' };

function useCard() {
  const { t } = useI18n();
  const open = useOpen();
  const fav = useFavorites();
  const prog = useProgress();
  return (it: LibItem) => {
    const p = prog.map[it.key];
    return (
      <MediaCard
        key={it.key} title={it.title} image={it.poster} sub={t(LABEL[it.type])} wide={it.type === 'live'}
        onClick={() => open(it)} progress={p && p.d ? (p.t / p.d) * 100 : 0}
        fav={fav.has(it.key)} onFav={it.type === 'episode' ? undefined : () => fav.toggle(it)}
      />
    );
  };
}

export default function LibGrid({ items }: { items: LibItem[] }) {
  const card = useCard();
  const wide = items.filter((i) => i.type === 'live');
  const poster = items.filter((i) => i.type !== 'live');
  return (
    <div className="space-y-8">
      {wide.length > 0 && <div className={GRID_WIDE}>{wide.map(card)}</div>}
      {poster.length > 0 && <div className={GRID_POSTER}>{poster.map(card)}</div>}
    </div>
  );
}

export function LibRow({ title, items }: { title: string; items: LibItem[] }) {
  const card = useCard();
  if (!items.length) return null;
  return (
    <Row title={title}>
      {items.map((it) => <div key={it.key} className={`shrink-0 ${it.type === 'live' ? 'w-52' : 'w-36 sm:w-40'}`}>{card(it)}</div>)}
    </Row>
  );
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import Icon from '../components/Icon';
import { streamUrl } from '../services/api';
import { mk, useHistory, useProgress } from './useLibrary';
import { useI18n } from '../i18n';
import type { PlayItem } from '../types';

const Ctx = createContext<{ play: (i: PlayItem) => void }>({ play: () => {} });
export const usePlayer = () => useContext(Ctx);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [item, setItem] = useState<PlayItem | null>(null);
  const hist = useHistory();
  const prog = useProgress();

  const play = (i: PlayItem) => {
    hist.push({ key: mk(i.type, i.id), type: i.type, id: i.id, title: i.title, poster: i.poster, ext: i.ext });
    setItem(i);
  };

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !document.fullscreenElement && setItem(null);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [item]);

  const key = item ? mk(item.type, item.id) : '';
  return (
    <Ctx.Provider value={{ play }}>
      {children}
      {item && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-3 sm:p-6" role="dialog" aria-label={item.title}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="truncate text-lg font-bold">{item.title}</h2>
            <button className="btn-ghost !px-3" onClick={() => setItem(null)} aria-label={t('close')}><Icon name="close" /></button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <VideoPlayer
              key={key}
              src={streamUrl(item.type, item.id, item.ext)}
              title={item.title}
              live={item.type === 'live'}
              startAt={prog.map[key]?.t || 0}
              onProgress={item.type === 'live' ? undefined : (tm, d) => prog.save(key, tm, d)}
              className="max-h-full w-full max-w-6xl"
            />
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

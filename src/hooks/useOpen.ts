import { useNavigate } from 'react-router-dom';
import { usePlayer } from './usePlayer';
import type { LibItem } from '../types';

/** One place that decides what happens when a saved item is clicked. */
export function useOpen() {
  const nav = useNavigate();
  const { play } = usePlayer();
  return (it: LibItem) => {
    if (it.type === 'movie') nav(`/movies/${it.id}`);
    else if (it.type === 'series') nav(`/series/${it.id}`);
    else play({ type: it.type, id: it.id, ext: it.ext || (it.type === 'live' ? 'm3u8' : 'mp4'), title: it.title, poster: it.poster });
  };
}

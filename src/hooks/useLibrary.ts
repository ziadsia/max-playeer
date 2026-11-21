import { useAuth } from './useAuth';
import { useStored } from './useStored';
import type { ItemType, LibItem } from '../types';

const EMPTY_LIST: LibItem[] = [];
const EMPTY_MAP: Record<string, { t: number; d: number }> = {};
export const mk = (type: ItemType, id: string | number) => `${type}:${id}`;
const useUserKey = () => useAuth().user?.username ?? 'anon';

export function useFavorites() {
  const u = useUserKey();
  const [items, set] = useStored<LibItem[]>(`max:${u}:fav`, EMPTY_LIST);
  const has = (key: string) => items.some((i) => i.key === key);
  const toggle = (it: LibItem) =>
    set((p) => (p.some((x) => x.key === it.key) ? p.filter((x) => x.key !== it.key) : [{ ...it, at: Date.now() }, ...p]));
  return { items, has, toggle };
}

export function useHistory() {
  const u = useUserKey();
  const [items, set] = useStored<LibItem[]>(`max:${u}:hist`, EMPTY_LIST);
  const push = (it: LibItem) => set((p) => [{ ...it, at: Date.now() }, ...p.filter((x) => x.key !== it.key)].slice(0, 40));
  const clear = () => set([]);
  return { items, push, clear };
}

export function useProgress() {
  const u = useUserKey();
  const [map, set] = useStored<Record<string, { t: number; d: number }>>(`max:${u}:prog`, EMPTY_MAP);
  const save = (key: string, t: number, d: number) =>
    set((p) => {
      const n = { ...p };
      if (d > 0 && t / d > 0.95) delete n[key]; else n[key] = { t: Math.floor(t), d: Math.floor(d) };
      return n;
    });
  return { map, save };
}

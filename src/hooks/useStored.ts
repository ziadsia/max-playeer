import { useCallback, useMemo, useSyncExternalStore } from 'react';

const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());
const subscribe = (cb: () => void) => {
  subs.add(cb); window.addEventListener('storage', cb);
  return () => { subs.delete(cb); window.removeEventListener('storage', cb); };
};

export function useStored<T>(key: string, fallback: T): [T, (v: T | ((p: T) => T)) => void] {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(key), () => null);
  const value = useMemo<T>(() => { try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; } },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw]);
  const set = useCallback((v: T | ((p: T) => T)) => {
    let cur: T = fallback;
    try { const r = localStorage.getItem(key); if (r) cur = JSON.parse(r) as T; } catch { /* ignore */ }
    const next = typeof v === 'function' ? (v as (p: T) => T)(cur) : v;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
    notify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set];
}

export function clearUserData(username: string) {
  Object.keys(localStorage).filter((k) => k.startsWith(`max:${username}:`)).forEach((k) => localStorage.removeItem(k));
  notify();
}

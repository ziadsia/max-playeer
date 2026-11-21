import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler } from '../services/api';
import type { UserInfo } from '../types';

interface Ctx { user: UserInfo | null; loading: boolean; login: (u: string, p: string) => Promise<void>; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (u: string, p: string) => { setUser(await api.login(u, p)); }, []);
  const logout = useCallback(async () => { await api.logout(); setUser(null); }, []);
  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

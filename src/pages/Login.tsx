import { useState, type FormEvent } from 'react';
import { Logo } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import { ApiError } from '../services/api';

export default function Login() {
  const { t, lang, setLang } = useI18n();
  const { login } = useAuth();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!u.trim() || !p) { setErr(t('errFill')); return; }
    setBusy(true); setErr('');
    try { await login(u.trim(), p); }
    catch (ex) {
      const c = ex instanceof ApiError ? ex.code : 'network';
      setErr(c === 'invalid_credentials' ? t('errInvalid') : c.startsWith('account_') ? t('errExpired') : c === 'rate_limited' ? t('errMany') : t('errServer'));
    } finally { setBusy(false); }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-40 start-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-max-blue/20 blur-[120px]" />
      <button className="btn-ghost absolute end-4 top-4 !py-1.5" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>{lang === 'ar' ? 'English' : 'العربية'}</button>
      <form onSubmit={submit} className="relative w-full max-w-sm animate-fade rounded-3xl border border-max-line bg-max-panel/90 p-8 shadow-2xl shadow-max-blue/10 backdrop-blur" noValidate>
        <div className="mb-2 text-center"><Logo className="text-5xl" /></div>
        <p className="mb-8 text-center text-sm text-slate-400">{t('loginSub')}</p>

        <label className="mb-1 block text-sm font-semibold text-slate-300" htmlFor="u">{t('username')}</label>
        <input id="u" className="input mb-4" dir="ltr" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={u} onChange={(e) => setU(e.target.value)} autoFocus />

        <label className="mb-1 block text-sm font-semibold text-slate-300" htmlFor="p">{t('password')}</label>
        <input id="p" className="input mb-5" dir="ltr" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} />

        {err && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}
        <button className="btn w-full !py-3" disabled={busy}>{busy ? t('loading') : t('login')}</button>
      </form>
    </div>
  );
}

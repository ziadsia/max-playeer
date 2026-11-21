import { useState } from 'react';
import { PageHeader } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { clearUserData } from '../hooks/useStored';
import { useI18n } from '../i18n';
import { useExpiry } from './Dashboard';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const fmtExp = useExpiry();
  const [done, setDone] = useState(false);
  const row = 'flex items-center justify-between gap-4 border-b border-max-line py-3 last:border-0';

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t('settings')} />

      <section className="panel">
        <h2 className="mb-2 font-bold">{t('language')}</h2>
        <div className="flex gap-2">
          {(['ar', 'en'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={`rounded-xl border px-5 py-2 text-sm font-semibold ${lang === l ? 'border-max-blue bg-max-blue' : 'border-max-line bg-max-panel text-slate-300 hover:border-max-glow'}`}>
              {l === 'ar' ? 'العربية' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-1 font-bold">{t('account')}</h2>
        <div className={row}><span className="text-slate-400">{t('username')}</span><b dir="ltr">{user?.username}</b></div>
        <div className={row}><span className="text-slate-400">{t('status')}</span><b>{user?.status}</b></div>
        <div className={row}><span className="text-slate-400">{t('expires')}</span><b>{fmtExp(user?.exp_date)}</b></div>
        {user?.max_connections && <div className={row}><span className="text-slate-400">{t('connections')}</span><b>{user.active_cons ?? 0} / {user.max_connections}</b></div>}
      </section>

      <section className="panel flex flex-wrap gap-3">
        <button className="btn-ghost" onClick={() => { if (confirm(t('confirmClear'))) { clearUserData(user?.username || 'anon'); setDone(true); } }}>{t('clearData')}</button>
        {done && <span className="self-center text-sm text-emerald-400">{t('cleared')}</span>}
        <button className="btn ms-auto" onClick={logout}>{t('logout')}</button>
      </section>
    </div>
  );
}

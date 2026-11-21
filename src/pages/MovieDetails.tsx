import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { ErrorBox, Loading, firstOf, ratingOf, yearOf } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { mk, useFavorites, useProgress } from '../hooks/useLibrary';
import { usePlayer } from '../hooks/usePlayer';
import { useI18n } from '../i18n';
import { api } from '../services/api';

export default function MovieDetails() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const nav = useNavigate();
  const { play } = usePlayer();
  const fav = useFavorites();
  const prog = useProgress();
  const info = useAsync(() => api.vodInfo(id), [id]);

  if (info.loading && !info.data) return <Loading />;
  const d = info.data;
  if (info.error || !d || (!d.info && !d.movie_data)) return <ErrorBox onRetry={info.retry} />;

  const i = d.info || {};
  const name = i.name || d.movie_data?.name || '';
  const poster = i.movie_image || i.cover_big;
  const bg = firstOf(i.backdrop_path) || poster;
  const ext = d.movie_data?.container_extension || 'mp4';
  const key = mk('movie', id);
  const p = prog.map[key];
  const isFav = fav.has(key);
  const meta = [yearOf(name, i.releasedate), ratingOf(i.rating) && `★ ${ratingOf(i.rating)}`, i.duration, i.genre].filter(Boolean);

  return (
    <div>
      <button className="btn-ghost mb-4" onClick={() => nav(-1)}><Icon name="back" className="h-4 w-4 rtl:rotate-180" /> {t('back')}</button>
      <div className="relative overflow-hidden rounded-3xl border border-max-line">
        {bg && <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" />}
        <div className="absolute inset-0 bg-gradient-to-t from-max-bg via-max-bg/70 to-transparent" />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:p-10">
          {poster && <img src={poster} alt={name} className="w-44 shrink-0 self-center rounded-2xl shadow-2xl ring-1 ring-max-line sm:self-start" />}
          <div className="min-w-0 flex-1">
            <h1 className="mb-3 text-3xl font-black" dir="auto">{name}</h1>
            <p className="mb-5 text-sm text-slate-300">{meta.join('  •  ')}</p>
            <div className="mb-6 flex flex-wrap gap-3">
              <button className="btn" onClick={() => play({ type: 'movie', id, ext, title: name, poster })}>
                <Icon name="play" className="h-4 w-4" fill /> {p ? `${t('resume')}` : t('play')}
              </button>
              <button
                className={`btn-ghost ${isFav ? '!text-rose-500' : ''}`}
                onClick={() => fav.toggle({ key, type: 'movie', id, title: name, poster, ext })}
              ><Icon name="heart" className="h-4 w-4" fill={isFav} /> {isFav ? t('removeFav') : t('addFav')}</button>
            </div>
            {(i.plot || i.description) && <><h2 className="mb-1 font-bold">{t('plot')}</h2><p className="mb-4 max-w-3xl leading-7 text-slate-300" dir="auto">{i.plot || i.description}</p></>}
            {i.director && <p className="text-sm text-slate-400"><b className="text-slate-200">{t('director')}:</b> {i.director}</p>}
            {i.cast && <p className="text-sm text-slate-400"><b className="text-slate-200">{t('cast')}:</b> {i.cast}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

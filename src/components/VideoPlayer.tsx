import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Icon from './Icon';
import { useI18n } from '../i18n';

interface Props {
  src: string; title?: string; live?: boolean; startAt?: number; className?: string;
  onProgress?: (t: number, d: number) => void;
}
const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return (h ? h + ':' : '') + p(m) + ':' + p(x);
};

export default function VideoPlayer({ src, live, startAt = 0, onProgress, className = '' }: Props) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<number>();
  const lastSave = useRef(0);
  const last = useRef({ t: 0, d: 0 });
  const cb = useRef(onProgress);
  cb.current = onProgress;

  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(false);
  const [show, setShow] = useState(true);
  const [full, setFull] = useState(false);
  const [levels, setLevels] = useState<{ i: number; h: number }[]>([]);
  const [level, setLevel] = useState(-1);

  // attach source
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    setErr(false); setBusy(true); setLevels([]); setLevel(-1); setCur(0); setDur(0);
    let hls: Hls | null = null;
    let retries = 0;
    const resume = !live && startAt > 5 ? startAt : 0;
    if (/\.m3u8(\?|$)/i.test(src) && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, maxBufferLength: 30, startPosition: resume || -1 });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, d) => {
        setLevels(d.levels.map((l, i) => ({ i, h: l.height })).filter((l) => l.h > 0).sort((a, b) => b.h - a.h));
        v.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (!d.fatal) return;
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR && retries < 3) { retries++; hls!.startLoad(); }
        else if (d.type === Hls.ErrorTypes.MEDIA_ERROR && retries < 3) { retries++; hls!.recoverMediaError(); }
        else setErr(true);
      });
      hls.loadSource(src);
      hls.attachMedia(v);
    } else {
      v.src = src;
      v.addEventListener('loadedmetadata', () => { if (resume) { try { v.currentTime = resume; } catch { /* ignore */ } } v.play().catch(() => {}); }, { once: true });
      v.load();
    }
    return () => { hls?.destroy(); hlsRef.current = null; v.removeAttribute('src'); v.load(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // flush progress on unmount
  useEffect(() => () => { if (!live && last.current.d > 0 && last.current.t > 0) cb.current?.(last.current.t, last.current.d); }, [live]);

  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);

  const poke = () => {
    setShow(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShow(false), 3000);
  };
  const toggle = () => { const v = vid.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); };
  const seekBy = (s: number) => { const v = vid.current; if (v && !live) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s)); };
  const toggleFull = () => {
    const el = box.current, v = vid.current as any;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el?.requestFullscreen) el.requestFullscreen();
    else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS Safari
  };
  const setQuality = (l: number) => { setLevel(l); if (hlsRef.current) hlsRef.current.currentLevel = l; };
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'f') toggleFull();
    else if (e.key === 'm' && vid.current) vid.current.muted = !vid.current.muted;
    else if (e.key === 'ArrowRight') seekBy(10);
    else if (e.key === 'ArrowLeft') seekBy(-10);
    poke();
  };

  const visible = show || !playing;
  return (
    <div
      ref={box} tabIndex={0} onKeyDown={onKey} onMouseMove={poke} onTouchStart={poke}
      className={`group relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-max-line ${full ? '!rounded-none' : ''} ${className}`}
      style={{ cursor: visible ? 'default' : 'none' }}
    >
      <video
        ref={vid} className="h-full w-full bg-black" playsInline onClick={toggle}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onWaiting={() => setBusy(true)} onPlaying={() => { setBusy(false); setErr(false); }} onCanPlay={() => setBusy(false)}
        onDurationChange={(e) => setDur(e.currentTarget.duration)}
        onVolumeChange={(e) => { setVol(e.currentTarget.volume); setMuted(e.currentTarget.muted); }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget; setCur(v.currentTime);
          if (!live && v.duration > 0) {
            last.current = { t: v.currentTime, d: v.duration };
            const now = Date.now();
            if (now - lastSave.current > 5000) { lastSave.current = now; cb.current?.(v.currentTime, v.duration); }
          }
        }}
        onError={() => { if (!hlsRef.current) setErr(true); }}
      />

      {busy && !err && <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-max-line border-t-max-glow" /></div>}
      {err && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <p className="max-w-sm text-sm text-slate-200">{t('playError')}</p>
        </div>
      )}
      {!playing && !busy && !err && (
        <button onClick={toggle} aria-label={t('play')} className="absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-max-blue/90 shadow-lg shadow-max-blue/40"><Icon name="play" className="h-7 w-7" fill /></span>
        </button>
      )}

      <div dir="ltr" className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-10 transition-opacity duration-300 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {!live && (
          <input
            type="range" min={0} max={dur || 0} step={1} value={Math.min(cur, dur || 0)} aria-label="Progress"
            onChange={(e) => { if (vid.current) vid.current.currentTime = Number(e.target.value); }}
            className="mb-1 h-1 w-full cursor-pointer accent-[#2563ff]"
          />
        )}
        <div className="flex items-center gap-3 text-sm">
          <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className="p-1 hover:text-max-glow"><Icon name={playing ? 'pause' : 'play'} fill /></button>
          <div className="flex items-center gap-1">
            <button onClick={() => { if (vid.current) vid.current.muted = !vid.current.muted; }} aria-label="Mute" className="p-1 hover:text-max-glow"><Icon name={muted || vol === 0 ? 'mute' : 'volume'} /></button>
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol} aria-label="Volume"
              onChange={(e) => { const v = vid.current; if (v) { v.volume = Number(e.target.value); v.muted = Number(e.target.value) === 0; } }}
              className="hidden h-1 w-20 cursor-pointer accent-[#2563ff] sm:block"
            />
          </div>
          {live
            ? <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold">{t('liveBadge')}</span>
            : <span className="tabular-nums text-slate-300">{fmt(cur)} / {fmt(dur)}</span>}
          <span className="flex-1" />
          {levels.length > 1 && (
            <select value={level} onChange={(e) => setQuality(Number(e.target.value))} aria-label={t('quality')} className="rounded-md border border-max-line bg-black/70 px-2 py-1 text-xs">
              <option value={-1}>{t('auto')}</option>
              {levels.map((l) => <option key={l.i} value={l.i}>{l.h}p</option>)}
            </select>
          )}
          <button onClick={toggleFull} aria-label="Fullscreen" className="p-1 hover:text-max-glow"><Icon name={full ? 'exit' : 'full'} /></button>
        </div>
      </div>
    </div>
  );
}

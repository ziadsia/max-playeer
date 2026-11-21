const P: Record<string, string> = {
  play: 'M6 3l14 9-14 9V3z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14',
  mute: 'M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6',
  full: 'M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3',
  exit: 'M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3',
  close: 'M18 6L6 18M6 6l12 12',
  heart: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z',
  search: 'M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z',
  home: 'M3 12l9-9 9 9M5 10v10h14V10',
  tv: 'M2 7h20v13H2zM17 2l-5 5-5-5',
  film: 'M3 3h18v18H3zM7 3v18M17 3v18M3 8h4M3 12h18M3 16h4M17 8h4M17 16h4',
  series: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  back: 'M19 12H5M12 19l-7-7 7-7',
  menu: 'M3 6h18M3 12h18M3 18h18',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z',
};

export default function Icon({ name, className = 'h-5 w-5', fill = false }: { name: keyof typeof P | string; className?: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

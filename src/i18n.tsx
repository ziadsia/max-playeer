import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const ar = {
  dashboard: 'لوحة التحكم', live: 'البث المباشر', movies: 'الأفلام', series: 'المسلسلات', favorites: 'المفضلة',
  recent: 'شوهد مؤخرًا', search: 'بحث', settings: 'الإعدادات', logout: 'تسجيل الخروج',
  username: 'اسم المستخدم', password: 'كلمة المرور', login: 'تسجيل الدخول', loginSub: 'أدخل بيانات اشتراكك للمتابعة',
  errInvalid: 'اسم المستخدم أو كلمة المرور غير صحيحة', errServer: 'تعذر الاتصال بالسيرفر. حاول مرة أخرى بعد قليل.',
  errExpired: 'الاشتراك منتهي أو الحساب غير مفعّل.', errFill: 'أدخل اسم المستخدم وكلمة المرور.',
  errMany: 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.', all: 'الكل', loading: 'جارٍ التحميل…',
  noResults: 'لا توجد نتائج', retry: 'إعادة المحاولة', loadFail: 'تعذر تحميل البيانات',
  searchPh: 'ابحث عن قناة أو فيلم أو مسلسل…', filterPh: 'بحث في هذا القسم…',
  addFav: 'إضافة للمفضلة', removeFav: 'إزالة من المفضلة', play: 'تشغيل', resume: 'استكمال المشاهدة',
  season: 'الموسم', episode: 'الحلقة', episodes: 'الحلقات', year: 'السنة', rating: 'التقييم', plot: 'القصة',
  cast: 'الممثلون', director: 'المخرج', genre: 'النوع', duration: 'المدة',
  continueWatching: 'استكمل المشاهدة', recentlyAdded: 'أضيف حديثًا', welcome: 'أهلًا',
  account: 'الحساب', status: 'الحالة', expires: 'ينتهي في', connections: 'الاتصالات', unlimited: 'غير محدود',
  language: 'اللغة', clearData: 'مسح المفضلة وسجل المشاهدة', clearHistory: 'مسح السجل', cleared: 'تم المسح',
  quality: 'الجودة', auto: 'تلقائي', nowPlaying: 'يُعرض الآن', next: 'التالي', selectChannel: 'اختر قناة للمشاهدة',
  sortNew: 'الأحدث', sortRating: 'الأعلى تقييمًا', sortName: 'الاسم', playError: 'تعذر تشغيل هذا المحتوى. جرّب مرة أخرى أو اختر محتوى آخر.',
  empty: 'لا يوجد شيء هنا بعد', liveChannels: 'قنوات مباشرة', newSeries: 'مسلسلات حديثة', close: 'إغلاق', back: 'رجوع',
  confirmClear: 'هل تريد مسح المفضلة وسجل المشاهدة من هذا المتصفح؟', minutes: 'دقيقة', liveBadge: 'مباشر',
} as const;

const en: Record<keyof typeof ar, string> = {
  dashboard: 'Dashboard', live: 'Live TV', movies: 'Movies', series: 'Series', favorites: 'Favorites',
  recent: 'Recently Watched', search: 'Search', settings: 'Settings', logout: 'Log out',
  username: 'Username', password: 'Password', login: 'Login', loginSub: 'Enter your subscription details to continue',
  errInvalid: 'Wrong username or password', errServer: 'Could not reach the server. Please try again shortly.',
  errExpired: 'Subscription expired or account is not active.', errFill: 'Enter your username and password.',
  errMany: 'Too many attempts. Please wait and try again.', all: 'All', loading: 'Loading…',
  noResults: 'No results', retry: 'Retry', loadFail: 'Could not load data',
  searchPh: 'Search channels, movies, series…', filterPh: 'Search in this section…',
  addFav: 'Add to favorites', removeFav: 'Remove from favorites', play: 'Play', resume: 'Resume',
  season: 'Season', episode: 'Episode', episodes: 'Episodes', year: 'Year', rating: 'Rating', plot: 'Plot',
  cast: 'Cast', director: 'Director', genre: 'Genre', duration: 'Duration',
  continueWatching: 'Continue watching', recentlyAdded: 'Recently added', welcome: 'Welcome',
  account: 'Account', status: 'Status', expires: 'Expires', connections: 'Connections', unlimited: 'Unlimited',
  language: 'Language', clearData: 'Clear favorites and watch history', clearHistory: 'Clear history', cleared: 'Cleared',
  quality: 'Quality', auto: 'Auto', nowPlaying: 'Now playing', next: 'Next', selectChannel: 'Pick a channel to start watching',
  sortNew: 'Newest', sortRating: 'Top rated', sortName: 'Name', playError: 'This content could not be played. Try again or pick another.',
  empty: 'Nothing here yet', liveChannels: 'Live channels', newSeries: 'New series', close: 'Close', back: 'Back',
  confirmClear: 'Clear favorites and watch history from this browser?', minutes: 'min', liveBadge: 'LIVE',
};

export type Lang = 'ar' | 'en';
export type TKey = keyof typeof ar;
const dicts = { ar, en };

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string; locale: string }
const I18n = createContext<Ctx>(null as unknown as Ctx);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('max:lang') === 'en' ? 'en' : 'ar'));
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  const setLang = (l: Lang) => { localStorage.setItem('max:lang', l); setLangState(l); };
  const t = (k: TKey) => dicts[lang][k] ?? k;
  return <I18n.Provider value={{ lang, setLang, t, locale: lang === 'ar' ? 'ar-EG' : 'en-GB' }}>{children}</I18n.Provider>;
}
export const useI18n = () => useContext(I18n);

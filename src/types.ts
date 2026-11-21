export interface UserInfo {
  username: string; status: string; exp_date: string | null; is_trial?: string;
  active_cons?: string; max_connections?: string; allowed_output_formats?: string[];
}
export interface Category { category_id: string; category_name: string; parent_id?: number }
export interface LiveStream { num?: number; name: string; stream_id: number; stream_icon?: string; category_id: string; epg_channel_id?: string }
export interface VodStream {
  num?: number; name: string; stream_id: number; stream_icon?: string; rating?: string | number; rating_5based?: number;
  category_id: string; container_extension: string; added?: string; year?: string;
}
export interface Series {
  series_id: number; name: string; cover?: string; plot?: string; cast?: string; director?: string; genre?: string;
  releaseDate?: string; rating?: string | number; category_id: string; last_modified?: string;
}
export interface VodInfo {
  info?: {
    name?: string; movie_image?: string; cover_big?: string; plot?: string; description?: string; releasedate?: string;
    rating?: string | number; genre?: string; duration?: string; director?: string; cast?: string;
    backdrop_path?: string[] | string; youtube_trailer?: string;
  };
  movie_data?: { stream_id: number; name: string; container_extension: string };
}
export interface Episode {
  id: string; episode_num: number | string; title: string; container_extension: string; season?: number | string;
  info?: { movie_image?: string; plot?: string; duration?: string; rating?: string | number };
}
export interface SeriesInfo {
  info?: {
    name?: string; cover?: string; plot?: string; cast?: string; director?: string; genre?: string;
    releaseDate?: string; rating?: string | number; backdrop_path?: string[] | string;
  };
  episodes?: Record<string, Episode[]> | Episode[];
}
export interface EpgItem { title: string; description?: string; start?: string; end?: string }

export type ItemType = 'live' | 'movie' | 'series' | 'episode';
export interface PlayItem { type: 'live' | 'movie' | 'episode'; id: string | number; ext: string; title: string; poster?: string }
export interface LibItem { key: string; type: ItemType; id: string | number; title: string; poster?: string; ext?: string; at?: number }

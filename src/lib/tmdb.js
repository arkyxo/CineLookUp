const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// Common TMDb genre ids (stable, documented by TMDb) — used for the curated
// genre rows on the homepage without an extra round trip.
export const GENRE_IDS = {
  Action: 28,
  Comedy: 35,
  Horror: 27,
  Romance: 10749,
  'Sci-Fi': 878,
  Drama: 18,
};

// ---- Response cache ----
// Repeat visits to the same movie/genre/trending endpoint are common
// (revisiting Home, reopening a title you just viewed, etc.), so cache
// responses for a few minutes instead of re-hitting TMDb every time.
// Backed by localStorage so it survives reloads, falling back to an
// in-memory Map if storage is unavailable (private browsing, quota, etc.).
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const memCache = new Map();

function cacheGet(key) {
  const mem = memCache.get(key);
  if (mem && Date.now() - mem.time < CACHE_TTL) return mem.data;

  try {
    const raw = localStorage.getItem(`tmdb-cache:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.time < CACHE_TTL) {
        memCache.set(key, parsed);
        return parsed.data;
      }
      localStorage.removeItem(`tmdb-cache:${key}`);
    }
  } catch {
    // localStorage unavailable — in-memory cache above still applies for this session.
  }
  return null;
}

function cacheSet(key, data) {
  const entry = { data, time: Date.now() };
  memCache.set(key, entry);
  try {
    localStorage.setItem(`tmdb-cache:${key}`, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — safe to ignore, falls back to in-memory only.
  }
}

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const cacheKey = url.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const res = await fetch(cacheKey);
  if (!res.ok) {
    throw new Error(`TMDb request failed (${res.status}): ${endpoint}`);
  }
  const data = await res.json();
  cacheSet(cacheKey, data);
  return data;
}

export const imageUrl = (path, size = 'w500') =>
  path ? `${IMG_BASE}/${size}${path}` : null;

export const getTrending = (mediaType = 'movie', window = 'week') =>
  tmdbFetch(`/trending/${mediaType}/${window}`);

export const getPopular = (mediaType = 'movie', page = 1) =>
  tmdbFetch(`/${mediaType}/popular`, { page });

export const getTopRated = (mediaType = 'movie', page = 1) =>
  tmdbFetch(`/${mediaType}/top_rated`, { page });

export const getNowPlaying = (page = 1) =>
  tmdbFetch('/movie/now_playing', { page });

export const getMovieDetails = (id) =>
  tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos,similar' });

export const getTvDetails = (id) =>
  tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos,similar' });

export const searchMulti = (query, page = 1) =>
  tmdbFetch('/search/multi', { query, page });

export const getGenreList = (mediaType = 'movie') =>
  tmdbFetch(`/genre/${mediaType}/list`);

export const discoverByGenre = (genreId, { mediaType = 'movie', page = 1, sortBy = 'popularity.desc' } = {}) =>
  tmdbFetch(`/discover/${mediaType}`, { with_genres: genreId, page, sort_by: sortBy });

export const getPersonDetails = (id) =>
  tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits' });

export const getRecommendations = (id, mediaType = 'movie') =>
  tmdbFetch(`/${mediaType}/${id}/recommendations`);

// Pull the first official YouTube trailer out of a videos.results array.
export const getTrailerKey = (videos) => {
  if (!videos?.results?.length) return null;
  const trailer =
    videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official) ||
    videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ||
    videos.results.find((v) => v.site === 'YouTube');
  return trailer?.key || null;
};

export const getDirector = (credits) =>
  credits?.crew?.find((c) => c.job === 'Director')?.name || null;

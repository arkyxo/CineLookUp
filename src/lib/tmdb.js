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

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDb request failed (${res.status}): ${endpoint}`);
  }
  return res.json();
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

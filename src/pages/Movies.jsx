import { useEffect, useState } from 'react';
import { getPopular, getTopRated, getNowPlaying } from '../lib/tmdb';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

const SORTS = [
  { key: 'popular', label: 'Most Popular', fetcher: () => getPopular('movie') },
  { key: 'top_rated', label: 'Highest Rated', fetcher: () => getTopRated('movie') },
  { key: 'now_playing', label: 'Newest', fetcher: () => getNowPlaying() },
];

export default function Movies() {
  const [sortKey, setSortKey] = useState('popular');
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setItems(null);
    setError(false);
    const sort = SORTS.find((s) => s.key === sortKey);
    sort
      .fetcher()
      .then((res) => setItems(res.results))
      .catch(() => setError(true));
  }, [sortKey, reloadKey]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Movies</h1>
        <div className="flex gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                sortKey === s.key ? 'bg-crimson-600 text-ink' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
      ) : !items ? (
        <SkeletonGrid />
      ) : (
        <div className="flex flex-wrap gap-4">
          {items.map((item) => (
            <MovieCard key={item.id} item={{ ...item, media_type: 'movie' }} />
          ))}
        </div>
      )}
    </div>
  );
}

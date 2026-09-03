import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { searchMulti, imageUrl } from '../lib/tmdb';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function Search() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    searchMulti(query)
      .then((res) => {
        setResults(res.results.filter((r) => r.media_type !== 'person' || r.profile_path));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [query, reloadKey]);

  const titles = results?.filter((r) => r.media_type === 'movie' || r.media_type === 'tv') || [];
  const people = results?.filter((r) => r.media_type === 'person') || [];

  if (error) return <ErrorState title="Search failed" onRetry={() => setReloadKey((k) => k + 1)} />;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <SkeletonGrid />
      </div>
    );
  }

  if (!query || (titles.length === 0 && people.length === 0)) {
    return (
      <EmptyState
        icon={SearchX}
        title={query ? `No results for "${query}"` : 'Search for something'}
        subtitle="Try a different title, actor, director, or genre."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="mb-6 text-xl font-semibold">
        Results for <span className="text-crimson-400">"{query}"</span>
      </h1>

      {titles.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">Titles</h2>
          <div className="flex flex-wrap gap-4">
            {titles.map((item) => (
              <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>
        </div>
      )}

      {people.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">People</h2>
          <div className="flex flex-wrap gap-4">
            {people.map((p) => (
              <div
                key={p.id}
                className="w-28 cursor-pointer text-center"
                onClick={() => navigate(`/person/${p.id}`)}
              >
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-elevated">
                  {p.profile_path && (
                    <img src={imageUrl(p.profile_path, 'w185')} alt={p.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

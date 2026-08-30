import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Star } from 'lucide-react';
import { getAllReviews } from '../lib/firebase';
import { imageUrl } from '../lib/tmdb';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function Reviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setReviews(null);
    setError(false);
    getAllReviews()
      .then(setReviews)
      .catch((err) => {
        console.error('Reviews failed to load:', err);
        setError(true);
      });
  }, [reloadKey]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="mb-1 text-2xl font-semibold">Reviews</h1>
      <p className="mb-6 text-sm text-white/50">See what everyone's watching and rating.</p>

      {error ? (
        <ErrorState title="Couldn't load reviews" onRetry={() => setReloadKey((k) => k + 1)} />
      ) : !reviews ? (
        <SkeletonGrid count={6} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          subtitle="Be the first — open any title and hit Review to rate and share your thoughts."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={`${r.username}-${r.id}`} className="flex gap-4 rounded-xl border border-white/10 bg-base-850 p-4">
              <div
                className="h-24 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-md bg-base-800"
                onClick={() => navigate(`/${r.mediaType || 'movie'}/${r.id}`)}
              >
                {r.posterPath && (
                  <img src={imageUrl(r.posterPath, 'w185')} alt={r.title} className="h-full w-full object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className="cursor-pointer font-semibold hover:text-crimson-400"
                    onClick={() => navigate(`/${r.mediaType || 'movie'}/${r.id}`)}
                  >
                    {r.title}
                  </p>
                  <span className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-crimson-400">
                    <Star size={13} className="fill-crimson-400" />
                    {r.rating}/5
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-white/40">@{r.username || 'Anonymous'}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{r.review}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
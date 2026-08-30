import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { getAllReviews } from '../lib/firebase';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ReviewCard from '../components/ReviewCard';

export default function Reviews() {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setReviews(null);
    setError(false);
    getAllReviews()
      .then(setReviews)
      .catch((err) => {
        console.error('Review Hall failed to load:', err);
        setError(true);
      });
  }, [reloadKey]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="mb-1 text-2xl font-semibold">Review Hall</h1>
      <p className="mb-6 text-sm text-white/50">See what everyone's watching, rating, and saying.</p>

      {error ? (
        <ErrorState title="Couldn't load Review Hall" onRetry={() => setReloadKey((k) => k + 1)} />
      ) : !reviews ? (
        <SkeletonGrid count={6} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Review Hall is empty"
          subtitle="Be the first — open any title and hit Review to rate and share your thoughts."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <ReviewCard key={`${r.reviewerUid}-${r.id}`} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
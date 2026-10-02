import { useEffect, useState } from 'react';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { getReviewsPage } from '../lib/firebase';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import ReviewCard from '../components/ReviewCard';

const PAGE_SIZE = 20;

export default function Reviews() {
  const [reviews, setReviews] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setReviews(null);
    setCursor(null);
    setHasMore(false);
    setError(false);
    setLoadMoreFailed(false);

    getReviewsPage(PAGE_SIZE)
      .then((page) => {
        if (cancelled) return;
        setReviews(page.reviews);
        setCursor(page.cursor);
        setHasMore(page.hasMore);
      })
      .catch((err) => {
        console.error('Review Hall failed to load:', err);
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const page = await getReviewsPage(PAGE_SIZE, cursor);
      setReviews((prev) => [...prev, ...page.reviews]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Failed to load more reviews:', err);
      setLoadMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="mb-1 text-2xl font-semibold">Review Hall</h1>
      <p className="mb-6 text-sm text-ink/50">See what everyone's watching, rating, and saying.</p>

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
        <>
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <ReviewCard key={`${r.reviewerUid}-${r.key}`} review={r} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/5 px-6 py-2.5 text-sm font-medium hover:bg-ink/10 disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load More'}
                {!loadingMore && <ChevronDown size={14} />}
              </button>
              {loadMoreFailed && (
                <p className="text-xs text-crimson-400">Couldn't load more reviews. Try again.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { getUidByUsername, getList } from '../lib/firebase';
import ReviewCard from '../components/ReviewCard';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function PublicProfile() {
  const { username } = useParams();
  const [notFound, setNotFound] = useState(false);
  const [allRatings, setAllRatings] = useState(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);
    setAllRatings(null);
    setError(false);

    async function load() {
      const uid = await getUidByUsername(username);
      if (cancelled) return;
      if (!uid) {
        setNotFound(true);
        return;
      }
      const list = await getList(uid, 'ratings');
      if (cancelled) return;
      setAllRatings(list.map((r) => ({ ...r, reviewerUid: uid })).sort((a, b) => b.ratedAt - a.ratedAt));
    }

    load().catch((err) => {
      console.error('Failed to load profile:', err);
      if (!cancelled) setError(true);
    });

    return () => {
      cancelled = true;
    };
  }, [username, reloadKey]);

  if (notFound) {
    return (
      <EmptyState
        icon={User}
        title="User not found"
        subtitle={`There's no account with the username @${username}.`}
      />
    );
  }

  if (error) {
    return <ErrorState title="Couldn't load this profile" onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  if (!allRatings) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
        <SkeletonGrid count={4} />
      </div>
    );
  }

  const reviews = allRatings.filter((r) => r.review && r.review.trim().length > 0);
  const avgRating = allRatings.length
    ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
    : '—';

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-8">
      <div className="flex items-center gap-4 rounded-xl border border-ink/10 bg-card p-6">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-crimson-600 text-xl font-semibold">
          {username[0]}
        </div>
        <div>
          <h1 className="text-xl font-semibold">@{username}</h1>
          <p className="text-sm text-ink/50">
            {allRatings.length} rated · {reviews.length} review{reviews.length !== 1 ? 's' : ''} · {avgRating} avg
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {reviews.length === 0 ? (
          <EmptyState title="No reviews yet" subtitle={`@${username} hasn't written any reviews.`} />
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>
    </div>
  );
}

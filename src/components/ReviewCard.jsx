import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle } from 'lucide-react';
import { imageUrl } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { getComments, addComment } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

const PREVIEW_COUNT = 2;

export default function ReviewCard({ review }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const goToTitle = () => navigate(`/${review.mediaType || 'movie'}/${review.id}`);

  useEffect(() => {
    let cancelled = false;
    getComments(review.reviewerUid, review.id)
      .then((list) => {
        if (!cancelled) setComments(list);
      })
      .catch((err) => {
        console.error('Failed to load comments:', err);
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [review.reviewerUid, review.id]);

  const postComment = async () => {
    if (!draft.trim() || !user) return;
    setPosting(true);
    const text = draft.trim();
    try {
      await addComment(review.reviewerUid, review.id, text, {
        uid: user.uid,
        username: user.displayName,
      });
      setComments((prev) => [
        ...(prev || []),
        { text, uid: user.uid, username: user.displayName, createdAt: Date.now() },
      ]);
      setDraft('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast("Couldn't post comment");
    } finally {
      setPosting(false);
    }
  };

  const visibleComments = comments ? (showAll ? comments : comments.slice(0, PREVIEW_COUNT)) : [];
  const hiddenCount = comments ? Math.max(0, comments.length - PREVIEW_COUNT) : 0;

  return (
    <div className="flex gap-4 rounded-xl border border-white/10 bg-base-850 p-4">
      <div
        className="h-24 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-md bg-base-800"
        onClick={goToTitle}
      >
        {review.posterPath && (
          <img src={imageUrl(review.posterPath, 'w185')} alt={review.title} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="cursor-pointer font-semibold hover:text-crimson-400" onClick={goToTitle}>
            {review.title}
          </p>
          <span className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-crimson-400">
            <Star size={13} className="fill-crimson-400" />
            {review.rating}/5
          </span>
        </div>
        <p className="mt-0.5 text-xs font-medium text-white/40">@{review.username || 'Anonymous'}</p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{review.review}</p>

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
            <MessageCircle size={13} />
            {comments === null ? 'Loading comments…' : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
          </div>

          {comments && comments.length > 0 && (
            <div className="flex flex-col gap-2">
              {visibleComments.map((c, i) => (
                <div key={c.id || i} className="rounded-md bg-white/5 px-3 py-2">
                  <p className="text-xs font-semibold text-white/70">@{c.username || 'Anonymous'}</p>
                  <p className="mt-0.5 text-sm text-white/80">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 text-xs font-medium text-crimson-400 hover:underline"
            >
              View {hiddenCount} more comment{hiddenCount !== 1 ? 's' : ''}
            </button>
          )}

          {user && (
            <div className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && postComment()}
                placeholder="Add a comment…"
                className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-crimson-500"
              />
              <button
                onClick={postComment}
                disabled={posting || !draft.trim()}
                className="flex-shrink-0 rounded-md bg-crimson-600 px-4 py-2 text-xs font-semibold hover:bg-crimson-500 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
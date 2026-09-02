import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, MessageCircle, Heart, CornerDownRight } from 'lucide-react';
import { imageUrl } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { getComments, addComment, getLikes, toggleLike } from '../lib/firebase';
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
  const [likes, setLikes] = useState(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [postingReply, setPostingReply] = useState(false);

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
    getLikes(review.reviewerUid, review.id)
      .then((list) => {
        if (!cancelled) setLikes(list);
      })
      .catch((err) => {
        console.error('Failed to load likes:', err);
        if (!cancelled) setLikes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [review.reviewerUid, review.id]);

  const liked = !!(user && likes?.includes(user.uid));

  const handleToggleLike = async () => {
    if (!user || likeBusy) return;
    setLikeBusy(true);
    try {
      const nowLiked = await toggleLike(review.reviewerUid, review.id, user.uid, user.displayName, {
        title: review.title,
        mediaType: review.mediaType,
      });
      setLikes((prev) =>
        nowLiked ? [...(prev || []), user.uid] : (prev || []).filter((id) => id !== user.uid)
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
      showToast("Couldn't update like");
    } finally {
      setLikeBusy(false);
    }
  };

  const postComment = async () => {
    if (!draft.trim() || !user) return;
    setPosting(true);
    const text = draft.trim();
    try {
      await addComment(
        review.reviewerUid,
        review.id,
        text,
        { uid: user.uid, username: user.displayName },
        { title: review.title, mediaType: review.mediaType }
      );
      setComments((prev) => [
        ...(prev || []),
        { text, uid: user.uid, username: user.displayName, createdAt: Date.now(), parentId: null },
      ]);
      setDraft('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast("Couldn't post comment");
    } finally {
      setPosting(false);
    }
  };

  const postReply = async (parentComment) => {
    if (!replyDraft.trim() || !user) return;
    setPostingReply(true);
    const text = replyDraft.trim();
    try {
      await addComment(
        review.reviewerUid,
        review.id,
        text,
        { uid: user.uid, username: user.displayName },
        { title: review.title, mediaType: review.mediaType },
        { id: parentComment.id, uid: parentComment.uid, username: parentComment.username }
      );
      setComments((prev) => [
        ...(prev || []),
        {
          text,
          uid: user.uid,
          username: user.displayName,
          createdAt: Date.now(),
          parentId: parentComment.id,
        },
      ]);
      setReplyDraft('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to post reply:', err);
      showToast("Couldn't post reply");
    } finally {
      setPostingReply(false);
    }
  };

  const topLevel = comments ? comments.filter((c) => !c.parentId) : [];
  const repliesFor = (commentId) => (comments || []).filter((c) => c.parentId === commentId);
  const visibleTopLevel = showAll ? topLevel : topLevel.slice(0, PREVIEW_COUNT);
  const hiddenCount = Math.max(0, topLevel.length - PREVIEW_COUNT);

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
        <div className="mt-0.5 flex items-center justify-between">
          <Link
            to={`/u/${review.username}`}
            className="text-xs font-medium text-white/40 hover:text-crimson-400 hover:underline"
          >
            @{review.username || 'Anonymous'}
          </Link>
          <button
            onClick={handleToggleLike}
            disabled={!user || likeBusy}
            className={`flex items-center gap-1 text-xs font-medium transition ${
              liked ? 'text-crimson-400' : 'text-white/40 hover:text-white'
            } disabled:cursor-default`}
          >
            <Heart size={13} className={liked ? 'fill-crimson-400' : ''} />
            {likes ? likes.length : ''}
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{review.review}</p>

        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
            <MessageCircle size={13} />
            {comments === null ? 'Loading comments…' : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
          </div>

          <div className="flex flex-col gap-3">
            {visibleTopLevel.map((c) => (
              <div key={c.id}>
                <div className="rounded-md bg-white/5 px-3 py-2">
                  <p className="text-xs font-semibold text-white/70">@{c.username || 'Anonymous'}</p>
                  <p className="mt-0.5 text-sm text-white/80">{c.text}</p>
                  {user && (
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === c.id ? null : c.id);
                        setReplyDraft('');
                      }}
                      className="mt-1 text-[11px] font-medium text-white/40 hover:text-crimson-400"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {repliesFor(c.id).map((r) => (
                  <div key={r.id} className="ml-6 mt-2 flex items-start gap-1.5">
                    <CornerDownRight size={12} className="mt-2.5 flex-shrink-0 text-white/20" />
                    <div className="flex-1 rounded-md bg-white/[0.03] px-3 py-2">
                      <p className="text-xs font-semibold text-white/70">@{r.username || 'Anonymous'}</p>
                      <p className="mt-0.5 text-sm text-white/80">{r.text}</p>
                    </div>
                  </div>
                ))}

                {replyingTo === c.id && (
                  <div className="ml-6 mt-2 flex gap-2">
                    <input
                      autoFocus
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && postReply(c)}
                      placeholder={`Reply to @${c.username}…`}
                      className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-crimson-500"
                    />
                    <button
                      onClick={() => postReply(c)}
                      disabled={postingReply || !replyDraft.trim()}
                      className="flex-shrink-0 rounded-md bg-crimson-600 px-4 py-2 text-xs font-semibold hover:bg-crimson-500 disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            ))}

            {!showAll && hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="text-xs font-medium text-crimson-400 hover:underline"
              >
                View {hiddenCount} more comment{hiddenCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Info, Star, ArrowLeft } from 'lucide-react';
import { imageUrl } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { getReview, setReview } from '../lib/firebase';
import { useToast } from '../context/ToastContext';
import StarRating from './StarRating';

export default function MovieQuickView({ item, onClose, onPlayTrailer, initialMode = 'info', onReviewSaved }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState(initialMode);
  const [myReview, setMyReview] = useState(null);
  const [draftRating, setDraftRating] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [item, initialMode]);

  useEffect(() => {
    if (!item || !user) return;
    getReview(user.uid, item.id).then((existing) => {
      setMyReview(existing);
      setDraftRating(existing?.rating || 0);
      setDraftText(existing?.review || '');
    });
  }, [item, user]);

  if (!item) return null;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

  const goToFullInfo = () => {
    onClose();
    navigate(`/${mediaType}/${item.id}`);
  };

  const handleTrailer = () => {
    onClose();
    onPlayTrailer(item);
  };

  const submitReview = async () => {
    if (!user || draftRating === 0) return;
    setSaving(true);
    try {
      await setReview(user.uid, { ...item, media_type: mediaType }, draftRating, draftText, user.displayName);
      const saved = { rating: draftRating, review: draftText };
      setMyReview(saved);
      onReviewSaved?.(saved);
      showToast(myReview ? 'Review updated' : 'Review posted');
      setMode('info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-ink/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-ink hover:bg-crimson-600"
        >
          <X size={16} />
        </button>

        <div className="relative h-44 w-full sm:h-52">
          <img
            src={imageUrl(item.backdrop_path || item.poster_path, 'w780')}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        </div>

        <div className="relative -mt-6 px-5 pb-5">
          <h2 className="font-display text-2xl tracking-wide sm:text-3xl">{title}</h2>

          <div className="mt-1.5 flex items-center gap-3 text-sm text-ink/70">
            <span className="flex items-center gap-1 font-semibold text-crimson-400">
              <Star size={13} className="fill-crimson-400" />
              {item.vote_average ? item.vote_average.toFixed(1) : '—'}
            </span>
            {year && <span>{year}</span>}
          </div>

          {mode === 'info' ? (
            <>
              {item.overview && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/70">{item.overview}</p>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  onClick={handleTrailer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-crimson-600 px-4 py-2.5 text-sm font-semibold hover:bg-crimson-500"
                >
                  <Play size={15} className="fill-ink" /> Watch Trailer
                </button>
                <button
                  onClick={goToFullInfo}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-ink/10 px-4 py-2.5 text-sm font-semibold hover:bg-ink/20"
                >
                  <Info size={15} /> Full Info
                </button>
              </div>

              {user && (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  {myReview ? (
                    <div className="flex items-center justify-between">
                      <StarRating value={myReview.rating} readOnly size={16} />
                      <button
                        onClick={() => setMode('review')}
                        className="text-xs font-medium text-crimson-400 hover:underline"
                      >
                        Edit Review
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setMode('review')}
                      className="w-full rounded-md border border-ink/15 py-2 text-sm font-semibold text-ink/80 hover:bg-ink/5"
                    >
                      Review
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4">
              <button
                onClick={() => setMode('info')}
                className="mb-3 flex items-center gap-1 text-xs text-ink/50 hover:text-ink"
              >
                <ArrowLeft size={12} /> Back
              </button>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">Your Rating</p>
              <StarRating value={draftRating} onChange={setDraftRating} size={22} />
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Write a review… (optional)"
                rows={4}
                className="mt-3 w-full resize-none rounded-md border border-ink/10 bg-ink/5 px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-crimson-500"
              />
              <button
                onClick={submitReview}
                disabled={draftRating === 0 || saving}
                className="mt-3 w-full rounded-md bg-crimson-600 py-2.5 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
              >
                {saving ? 'Saving…' : myReview ? 'Update Review' : 'Post Review'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

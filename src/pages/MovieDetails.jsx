import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Lock, LockOpen } from 'lucide-react';
import {
  getMovieDetails,
  getTvDetails,
  imageUrl,
  getTrailerKey,
  getDirector,
} from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { addToList, removeFromList, isInList, getReview } from '../lib/firebase';
import StarRating from '../components/StarRating';
import TrailerModal from '../components/TrailerModal';
import MovieQuickView from '../components/MovieQuickView';
import MovieRow from '../components/MovieRow';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import NotFound from './NotFound';
import { useToast } from '../context/ToastContext';

export default function MovieDetails() {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inPrivateList, setInPrivateList] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const validMediaType = mediaType === 'movie' || mediaType === 'tv';

  useEffect(() => {
    if (!validMediaType) return;
    setLoading(true);
    setError(false);
    const fetcher = mediaType === 'tv' ? getTvDetails : getMovieDetails;
    fetcher(id)
      .then((details) => {
        setData(details);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
    window.scrollTo(0, 0);
  }, [mediaType, id, reloadKey, validMediaType]);

  useEffect(() => {
    if (!user || !data) return;
    isInList(user.uid, 'watchlist', data.id).then(setInWatchlist);
    isInList(user.uid, 'privateList', data.id).then(setInPrivateList);
    getReview(user.uid, data.id).then(setMyReview);
  }, [user, data]);

  if (!validMediaType) return <NotFound />;
  if (loading) return <LoadingSpinner label="Loading title…" />;
  if (error || !data) {
    return <ErrorState title="Couldn't load this title" onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').slice(0, 4);
  const runtime = data.runtime || data.episode_run_time?.[0];
  const director = getDirector(data.credits);
  const cast = data.credits?.cast?.slice(0, 10) || [];
  const trailerKey = getTrailerKey(data.videos);

  const providerResults = data['watch/providers']?.results || {};
  const detectedRegion = (navigator.language?.split('-')[1] || 'US').toUpperCase();
  const providers = providerResults[detectedRegion] || providerResults.US;

  const requireAuth = () => {
    if (!user) navigate('/login');
    return !!user;
  };

  const toggleList = async (listName, isIn, setIsIn) => {
    if (!requireAuth()) return;
    const label = listName === 'watchlist' ? 'Watchlist' : 'Private List';
    if (isIn) {
      await removeFromList(user.uid, listName, data.id);
      showToast(`Removed from ${label}`);
    } else {
      await addToList(user.uid, listName, { ...data, media_type: mediaType });
      showToast(`Added to ${label}`);
    }
    setIsIn(!isIn);
  };

  return (
    <div className="pb-16">
      <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden sm:h-[55vh]">
        <img
          src={imageUrl(data.backdrop_path, 'original')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-fade-bottom" />
      </div>

      <div className="relative mx-auto -mt-24 flex max-w-6xl flex-col gap-6 px-4 sm:-mt-32 sm:flex-row sm:px-8">
        <img
          src={imageUrl(data.poster_path, 'w342')}
          alt={title}
          className="hidden w-48 flex-shrink-0 rounded-lg shadow-2xl ring-1 ring-white/10 sm:block"
        />

        <div className="flex-1">
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
            {year && <span>{year}</span>}
            {runtime && <span>{Math.floor(runtime / 60)}h {runtime % 60}m</span>}
            {data.genres?.length > 0 && <span>{data.genres.map((g) => g.name).join(', ')}</span>}
            <span className="flex items-center gap-1 font-semibold text-crimson-400">
              ★ {data.vote_average?.toFixed(1)}
            </span>
          </div>

          {director && <p className="mt-3 text-sm text-white/50">Directed by {director}</p>}

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            {data.overview}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {trailerKey && (
              <button
                onClick={() => setTrailerOpen(true)}
                className="flex items-center gap-2 rounded-md bg-crimson-600 px-5 py-2.5 text-sm font-semibold hover:bg-crimson-500"
              >
                <Play size={16} className="fill-white" /> Watch Trailer
              </button>
            )}
            <button
              onClick={() => toggleList('watchlist', inWatchlist, setInWatchlist)}
              className="flex items-center gap-2 rounded-md bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/20"
            >
              {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
              {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
            <button
              onClick={() => toggleList('privateList', inPrivateList, setInPrivateList)}
              className="flex items-center gap-2 rounded-md bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/20"
            >
              {inPrivateList ? <Lock size={16} /> : <LockOpen size={16} />}
              {inPrivateList ? 'In Private List' : 'Add to Private List'}
            </button>
          </div>

          <div className="mt-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">
              Your Review
            </p>
            {myReview ? (
              <div className="flex items-center gap-3">
                <StarRating value={myReview.rating} readOnly size={18} />
                <button
                  onClick={() => (requireAuth() ? setReviewOpen(true) : null)}
                  className="text-xs font-medium text-crimson-400 hover:underline"
                >
                  Edit Review
                </button>
              </div>
            ) : (
              <button
                onClick={() => (requireAuth() ? setReviewOpen(true) : null)}
                className="rounded-md bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/20"
              >
                Write a Review
              </button>
            )}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              Where to Watch
            </p>
            {providers?.flatrate?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {providers.flatrate.map((p) => (
                  <div key={p.provider_id} className="flex flex-col items-center gap-1" title={p.provider_name}>
                    <img
                      src={imageUrl(p.logo_path, 'w92')}
                      alt={p.provider_name}
                      className="h-10 w-10 rounded-lg ring-1 ring-white/10"
                    />
                    <span className="max-w-[56px] text-center text-[10px] leading-tight text-white/50 line-clamp-2">
                      {p.provider_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : providers?.rent?.length > 0 || providers?.buy?.length > 0 ? (
              <div>
                <p className="mb-1.5 text-[11px] text-white/40">Not on a subscription — available to rent or buy</p>
                <div className="flex flex-wrap gap-3">
                  {[...(providers.rent || []), ...(providers.buy || [])]
                    .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
                    .map((p) => (
                      <img
                        key={p.provider_id}
                        src={imageUrl(p.logo_path, 'w92')}
                        alt={p.provider_name}
                        title={p.provider_name}
                        className="h-10 w-10 rounded-lg ring-1 ring-white/10"
                      />
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30">Streaming availability isn't listed for your region.</p>
            )}
            {providers?.link && (
              <a
                href={providers.link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-[11px] text-white/30 hover:text-white/50"
              >
                Streaming data provided by JustWatch
              </a>
            )}
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-8">
          <h2 className="mb-3 text-lg font-semibold">Cast</h2>
          <div className="row-scroll flex gap-4 overflow-x-auto pb-2">
            {cast.map((c) => (
              <div
                key={c.id}
                className="w-24 flex-shrink-0 cursor-pointer text-center"
                onClick={() => navigate(`/person/${c.id}`)}
              >
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-base-800">
                  {c.profile_path && (
                    <img src={imageUrl(c.profile_path, 'w185')} alt={c.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium">{c.name}</p>
                <p className="line-clamp-1 text-[11px] text-white/40">{c.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.similar?.results?.length > 0 && (
        <div className="mt-10">
          <MovieRow title="More Like This" items={data.similar.results} />
        </div>
      )}

      {trailerOpen && (
        <TrailerModal videoKey={trailerKey} title={title} onClose={() => setTrailerOpen(false)} />
      )}

      {reviewOpen && (
        <MovieQuickView
          item={{ ...data, media_type: mediaType }}
          initialMode="review"
          onClose={() => setReviewOpen(false)}
          onPlayTrailer={() => setTrailerOpen(true)}
          onReviewSaved={setMyReview}
        />
      )}
    </div>
  );
}
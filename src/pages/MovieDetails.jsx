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
import { addToList, removeFromList, isInList, setRating, getRating } from '../lib/firebase';
import StarRating from '../components/StarRating';
import TrailerModal from '../components/TrailerModal';
import MovieRow from '../components/MovieRow';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MovieDetails() {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inPrivateList, setInPrivateList] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = mediaType === 'tv' ? getTvDetails : getMovieDetails;
    fetcher(id).then((details) => {
      setData(details);
      setLoading(false);
    });
    window.scrollTo(0, 0);
  }, [mediaType, id]);

  useEffect(() => {
    if (!user || !data) return;
    isInList(user.uid, 'watchlist', data.id).then(setInWatchlist);
    isInList(user.uid, 'privateList', data.id).then(setInPrivateList);
    getRating(user.uid, data.id).then(setMyRating);
  }, [user, data]);

  if (loading || !data) return <LoadingSpinner label="Loading title…" />;

  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || '').slice(0, 4);
  const runtime = data.runtime || data.episode_run_time?.[0];
  const director = getDirector(data.credits);
  const cast = data.credits?.cast?.slice(0, 10) || [];
  const trailerKey = getTrailerKey(data.videos);

  const requireAuth = () => {
    if (!user) navigate('/login');
    return !!user;
  };

  const toggleList = async (listName, isIn, setIsIn) => {
    if (!requireAuth()) return;
    if (isIn) {
      await removeFromList(user.uid, listName, data.id);
    } else {
      await addToList(user.uid, listName, { ...data, media_type: mediaType });
    }
    setIsIn(!isIn);
  };

  const rate = async (n) => {
    if (!requireAuth()) return;
    setMyRating(n);
    await setRating(user.uid, { ...data, media_type: mediaType }, n);
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
              Your Rating
            </p>
            <StarRating value={myRating} onChange={rate} />
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
    </div>
  );
}

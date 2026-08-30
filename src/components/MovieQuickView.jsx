import { useNavigate } from 'react-router-dom';
import { X, Play, Info, Star } from 'lucide-react';
import { imageUrl } from '../lib/tmdb';

export default function MovieQuickView({ item, onClose, onPlayTrailer }) {
  const navigate = useNavigate();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-base-850 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-crimson-600"
        >
          <X size={16} />
        </button>

        <div className="relative h-44 w-full sm:h-52">
          <img
            src={imageUrl(item.backdrop_path || item.poster_path, 'w780')}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base-850 via-base-850/10 to-transparent" />
        </div>

        <div className="relative -mt-6 px-5 pb-5">
          <h2 className="font-display text-2xl tracking-wide sm:text-3xl">{title}</h2>

          <div className="mt-1.5 flex items-center gap-3 text-sm text-white/70">
            <span className="flex items-center gap-1 font-semibold text-crimson-400">
              <Star size={13} className="fill-crimson-400" />
              {item.vote_average ? item.vote_average.toFixed(1) : '—'}
            </span>
            {year && <span>{year}</span>}
          </div>

          {item.overview && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/70">{item.overview}</p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleTrailer}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-crimson-600 px-4 py-2.5 text-sm font-semibold hover:bg-crimson-500"
            >
              <Play size={15} className="fill-white" /> Watch Trailer
            </button>
            <button
              onClick={goToFullInfo}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
            >
              <Info size={15} /> Full Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
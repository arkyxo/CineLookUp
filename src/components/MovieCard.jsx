import { useNavigate } from 'react-router-dom';
import { Star, Plus, Check } from 'lucide-react';
import { imageUrl } from '../lib/tmdb';

export default function MovieCard({ item, inWatchlist = false, onToggleWatchlist, onOpenModal }) {
  const navigate = useNavigate();
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

  const handleClick = () => {
    if (onOpenModal) onOpenModal(item);
    else navigate(`/${mediaType}/${item.id}`);
  };

  return (
    <div
      className="group relative w-[160px] sm:w-[180px] flex-shrink-0 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-elevated ring-1 ring-ink/5 transition-transform duration-300 group-hover:scale-105 group-hover:ring-crimson-500/50">
        {item.poster_path ? (
          <img
            src={imageUrl(item.poster_path, 'w342')}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-ink/40">
            {title}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs font-semibold leading-tight">{title}</p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-ink/70">
            <span className="flex items-center gap-1">
              <Star size={11} className="fill-crimson-400 text-crimson-400" />
              {item.vote_average ? item.vote_average.toFixed(1) : '—'}
            </span>
            <span>{year || ''}</span>
          </div>
          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(item);
              }}
              className="mt-2 flex items-center justify-center gap-1 rounded-md bg-ink/10 py-1 text-[11px] font-medium backdrop-blur transition hover:bg-crimson-600"
            >
              {inWatchlist ? <Check size={12} /> : <Plus size={12} />}
              {inWatchlist ? 'Added' : 'Watchlist'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

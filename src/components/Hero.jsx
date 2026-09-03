import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { imageUrl } from '../lib/tmdb';

export default function Hero({ item, inWatchlist, onToggleWatchlist, onPlayTrailer }) {
  const navigate = useNavigate();
  if (!item) return null;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');

  return (
    <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden sm:h-[78vh]">
      <img
        src={imageUrl(item.backdrop_path, 'original')}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-fade-bottom" />
      <div className="absolute inset-0 bg-fade-left" />

      <div className="relative flex h-full max-w-2xl flex-col justify-end gap-4 px-4 pb-14 sm:px-10">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson-400">
          {mediaType === 'tv' ? 'Series' : 'Featured Film'}
        </span>
        <h1 className="font-display text-5xl leading-none tracking-wide sm:text-7xl">{title}</h1>

        <div className="flex items-center gap-3 text-sm text-ink/80">
          <span className="flex items-center gap-1 font-medium text-crimson-400">
            <Star size={14} className="fill-crimson-400" />
            {item.vote_average ? item.vote_average.toFixed(1) : '—'}
          </span>
          {year && <span>{year}</span>}
          {item.genreNames?.length > 0 && <span>{item.genreNames.join(', ')}</span>}
        </div>

        <p className="line-clamp-3 text-sm text-ink/70 sm:text-base">{item.overview}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onPlayTrailer(item)}
            className="flex items-center gap-2 rounded-md bg-crimson-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-crimson-500"
          >
            <Play size={16} className="fill-ink" /> Watch Trailer
          </button>
          <button
            onClick={() => onToggleWatchlist(item)}
            className="flex items-center gap-2 rounded-md bg-ink/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-ink/20"
          >
            {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
          <button
            onClick={() => navigate(`/${mediaType}/${item.id}`)}
            className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-ink/80 transition hover:text-ink"
          >
            <Info size={16} /> More Info
          </button>
        </div>
      </div>
    </div>
  );
}

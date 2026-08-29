import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieRow({ title, items, watchlistIds, onToggleWatchlist }) {
  const scrollRef = useRef(null);

  if (!items?.length) return null;

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });
  };

  return (
    <section className="group/row relative mb-8 px-4 sm:px-8">
      <h2 className="mb-3 text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>

      <button
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 z-10 hidden h-full w-10 -translate-y-1/2 items-center justify-center bg-gradient-to-r from-base-950 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 sm:flex"
      >
        <ChevronLeft />
      </button>

      <div ref={scrollRef} className="row-scroll flex gap-3 overflow-x-auto scroll-smooth pb-2">
        {items.map((item) => (
          <MovieCard
            key={`${item.media_type || 'movie'}-${item.id}`}
            item={item}
            inWatchlist={watchlistIds?.has(item.id)}
            onToggleWatchlist={onToggleWatchlist}
          />
        ))}
      </div>

      <button
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 z-10 hidden h-full w-10 -translate-y-1/2 items-center justify-center bg-gradient-to-l from-base-950 to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 sm:flex"
      >
        <ChevronRight />
      </button>
    </section>
  );
}

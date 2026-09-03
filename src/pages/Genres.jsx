import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { getGenreList, discoverByGenre } from '../lib/tmdb';
import MovieCard from '../components/MovieCard';
import { SkeletonGrid } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

const BLURBS = {
  Action: 'High-stakes chases, stunts, and set pieces that never let up.',
  Adventure: 'Sweeping journeys into the unknown.',
  Animation: 'Stories told frame by frame, for every age.',
  Comedy: "Laughs, timing, and characters you can't help but love.",
  Crime: 'Heists, investigations, and the underworld in between.',
  Documentary: 'Real stories, real stakes.',
  Drama: 'Character-driven stories that stay with you.',
  Fantasy: 'Worlds built from imagination, magic, and myth.',
  Horror: 'Dread, tension, and things best watched with the lights on.',
  Mystery: 'Puzzles, twists, and the truth just out of reach.',
  Romance: 'Love stories in every shape.',
  'Science Fiction': 'Explore worlds beyond imagination — dystopian futures, deep space exploration, and mind-bending ideas.',
  Thriller: 'Tension that builds until the very last frame.',
};

// Shorter display labels for headings, independent of the exact TMDb genre name.
const DISPLAY_NAME = {
  'Science Fiction': 'Sci-Fi',
};

const SORT_TABS = [
  { key: 'trending', label: 'Trending', sortBy: 'popularity.desc' },
  { key: 'new', label: 'New Releases', sortBy: 'release_date.desc' },
  { key: 'top', label: 'Top Rated', sortBy: 'vote_average.desc' },
];

export default function Genres() {
  const { genreId } = useParams();
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    getGenreList('movie').then((res) => setGenres(res.genres));
  }, []);

  if (genreId) return <GenreDetail genreId={genreId} genres={genres} />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-semibold">Browse by Genre</h1>
      <div className="flex flex-wrap gap-3">
        {genres.map((g) => (
          <Link
            key={g.id}
            to={`/genres/${g.id}`}
            className="rounded-full border border-ink/10 bg-ink/5 px-4 py-2 text-sm font-medium transition hover:border-crimson-500 hover:text-crimson-400"
          >
            {g.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function GenreDetail({ genreId, genres }) {
  const [items, setItems] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState('trending');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const rawGenreName = genres.find((g) => String(g.id) === genreId)?.name || 'Genre';
  const displayName = DISPLAY_NAME[rawGenreName] || rawGenreName;
  const sortBy = SORT_TABS.find((t) => t.key === sortKey).sortBy;

  useEffect(() => {
    setItems(null);
    setError(false);
    setPage(1);
    discoverByGenre(genreId, { sortBy, page: 1 })
      .then((res) => {
        setItems(res.results);
        setTotalPages(res.total_pages);
      })
      .catch(() => setError(true));
  }, [genreId, sortBy, reloadKey]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await discoverByGenre(genreId, { sortBy, page: nextPage });
    setItems((prev) => [...prev, ...res.results]);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-crimson-500">
            <span>Genre</span>
            <ChevronRight size={12} />
          </div>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">{displayName}</h1>
          {BLURBS[rawGenreName] && <p className="mt-2 text-sm text-ink/50">{BLURBS[rawGenreName]}</p>}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex overflow-hidden rounded-lg border border-ink/10 bg-ink/5">
            {SORT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSortKey(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  sortKey === tab.key ? 'bg-crimson-600 text-ink' : 'text-ink/70 hover:bg-ink/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-ink/10"
          >
            <SlidersHorizontal size={13} />
            Filters
            <ChevronDown size={13} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="mt-4 flex flex-wrap gap-2 rounded-lg border border-ink/10 bg-card p-3">
          {genres.map((g) => (
            <Link
              key={g.id}
              to={`/genres/${g.id}`}
              onClick={() => setFiltersOpen(false)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                String(g.id) === genreId
                  ? 'bg-crimson-600 text-ink'
                  : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />
        ) : !items ? (
          <SkeletonGrid />
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {items.map((item) => (
                <MovieCard key={item.id} item={{ ...item, media_type: 'movie' }} />
              ))}
            </div>

            {page < totalPages && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/5 px-6 py-2.5 text-sm font-medium hover:bg-ink/10 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                  {!loadingMore && <ChevronDown size={14} />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

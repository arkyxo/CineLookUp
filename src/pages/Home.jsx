import { useEffect, useState, useCallback } from 'react';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  discoverByGenre,
  getGenreList,
  getMovieDetails,
  getTrailerKey,
  GENRE_IDS,
} from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { addToList, removeFromList, getList } from '../lib/firebase';

export default function Home() {
  const { user } = useAuth();
  const [hero, setHero] = useState(null);
  const [rows, setRows] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [trailer, setTrailer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [trending, popular, topRated, nowPlaying, genreList, action, comedy, horror] =
        await Promise.all([
          getTrending('movie', 'week'),
          getPopular('movie'),
          getTopRated('movie'),
          getNowPlaying(),
          getGenreList('movie'),
          discoverByGenre(GENRE_IDS.Action),
          discoverByGenre(GENRE_IDS.Comedy),
          discoverByGenre(GENRE_IDS.Horror),
        ]);

      if (cancelled) return;

      const genreMap = Object.fromEntries(genreList.genres.map((g) => [g.id, g.name]));
      const featured = trending.results[0];
      if (featured) {
        featured.genreNames = (featured.genre_ids || []).map((id) => genreMap[id]).filter(Boolean);
      }

      setHero(featured);
      setRows([
        { title: 'Trending Now', items: trending.results.slice(1, 15) },
        { title: 'Popular Movies', items: popular.results },
        { title: 'New Releases', items: nowPlaying.results },
        { title: 'Top Rated', items: topRated.results },
        { title: 'Action', items: action.results },
        { title: 'Comedy', items: comedy.results },
        { title: 'Horror', items: horror.results },
      ]);
      setLoading(false);
    }

    load().catch((err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchlistIds(new Set());
      return;
    }
    getList(user.uid, 'watchlist').then((items) => setWatchlistIds(new Set(items.map((i) => i.id))));
  }, [user]);

  const toggleWatchlist = useCallback(
    async (item) => {
      if (!user) {
        window.location.assign('/login');
        return;
      }
      const has = watchlistIds.has(item.id);
      const next = new Set(watchlistIds);
      if (has) {
        next.delete(item.id);
        await removeFromList(user.uid, 'watchlist', item.id);
      } else {
        next.add(item.id);
        await addToList(user.uid, 'watchlist', item);
      }
      setWatchlistIds(next);
    },
    [user, watchlistIds]
  );

  const playTrailer = async (item) => {
    const details = await getMovieDetails(item.id);
    const key = getTrailerKey(details.videos);
    setTrailer(key ? { key, title: item.title || item.name } : null);
  };

  if (loading) return <LoadingSpinner label="Loading CineLookUp…" />;

  return (
    <div className="pb-16">
      <Hero item={hero} inWatchlist={watchlistIds.has(hero?.id)} onToggleWatchlist={toggleWatchlist} onPlayTrailer={playTrailer} />

      <div className="mt-8">
        {rows.map((row) => (
          <MovieRow
            key={row.title}
            title={row.title}
            items={row.items}
            watchlistIds={watchlistIds}
            onToggleWatchlist={toggleWatchlist}
          />
        ))}
      </div>

      <TrailerModal videoKey={trailer?.key} title={trailer?.title} onClose={() => setTrailer(null)} />
    </div>
  );
}
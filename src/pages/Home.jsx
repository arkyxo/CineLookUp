import { useEffect, useState, useCallback } from 'react';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import MovieQuickView from '../components/MovieQuickView';
import { SkeletonHero, SkeletonRow } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import {
  getTrending,
  getPopular,
  getTopRated,
  getNowPlaying,
  discoverByGenre,
  getGenreList,
  getMovieDetails,
  getRecommendations,
  getTrailerKey,
  GENRE_IDS,
} from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { addToList, removeFromList, getList } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

export default function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [hero, setHero] = useState(null);
  const [rows, setRows] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [trailer, setTrailer] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [ratedButNoRecs, setRatedButNoRecs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

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

      const builtRows = [
        { title: 'Trending Now', items: trending.results.slice(1, 15) },
        { title: 'Popular Movies', items: popular.results },
        { title: 'New Releases', items: nowPlaying.results },
        { title: 'Top Rated', items: topRated.results },
        { title: 'Action', items: action.results },
        { title: 'Comedy', items: comedy.results },
        { title: 'Horror', items: horror.results },
      ];

      // Personalized row: seeded from the user's highest-rated title.
      if (user) {
        try {
          const ratings = await getList(user.uid, 'ratings');
          if (ratings.length > 0) {
            const top = [...ratings].sort((a, b) => b.rating - a.rating)[0];
            const recs = await getRecommendations(top.id, 'movie');
            if (recs.results?.length > 0) {
              builtRows.unshift({ title: 'Recommended For You', items: recs.results });
              setRatedButNoRecs(false);
            } else {
              setRatedButNoRecs(false);
            }
          } else {
            setRatedButNoRecs(true);
          }
        } catch {
          // Recommendations are a bonus, not critical — fail silently and keep the rest of Home working.
        }
      }

      if (cancelled) return;
      setHero(featured);
      setRows(builtRows);
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

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
        showToast('Removed from Watchlist');
      } else {
        next.add(item.id);
        await addToList(user.uid, 'watchlist', item);
        showToast('Added to Watchlist');
      }
      setWatchlistIds(next);
    },
    [user, watchlistIds, showToast]
  );

  const playTrailer = async (item) => {
    const details = await getMovieDetails(item.id);
    const key = getTrailerKey(details.videos);
    setTrailer(key ? { key, title: item.title || item.name } : null);
  };

  if (error) {
    return <ErrorState title="Couldn't load CineLookUp" onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  if (loading) {
    return (
      <div className="pb-16">
        <SkeletonHero />
        <div className="mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <Hero item={hero} inWatchlist={watchlistIds.has(hero?.id)} onToggleWatchlist={toggleWatchlist} onPlayTrailer={playTrailer} />

      {ratedButNoRecs && (
        <p className="mx-4 mt-6 rounded-lg border border-white/10 bg-base-850 px-4 py-3 text-sm text-white/60 sm:mx-8">
          Rate a few titles and we'll start recommending movies just for you.
        </p>
      )}

      <div className="mt-8">
        {rows.map((row) => (
          <MovieRow
            key={row.title}
            title={row.title}
            items={row.items}
            watchlistIds={watchlistIds}
            onToggleWatchlist={toggleWatchlist}
            onOpenModal={setQuickViewItem}
          />
        ))}
      </div>

      <MovieQuickView
        item={quickViewItem}
        onClose={() => setQuickViewItem(null)}
        onPlayTrailer={playTrailer}
      />
      <TrailerModal videoKey={trailer?.key} title={trailer?.title} onClose={() => setTrailer(null)} />
    </div>
  );
}
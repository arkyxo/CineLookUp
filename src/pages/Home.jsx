import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  getTvDetails,
  getRecommendations,
  getTrailerKey,
  itemKey,
  mediaTypeOf,
  GENRE_IDS,
} from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { addToList, removeFromList, getList } from '../lib/firebase';
import { useToast } from '../context/ToastContext';

export default function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
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
            // Seed from the title's real media type — a top-rated TV show must
            // use the TV recommendations endpoint, not the movie one.
            const recs = await getRecommendations(top.id, top.mediaType || 'movie');
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
    // Set of `${mediaType}-${id}` keys so a movie and a show that share a TMDb
    // id aren't confused with each other.
    getList(user.uid, 'watchlist')
      .then((items) => setWatchlistIds(new Set(items.map((i) => itemKey(i.mediaType || 'movie', i.id)))))
      .catch((err) => console.error('Failed to load watchlist:', err));
  }, [user]);

  const toggleWatchlist = useCallback(
    async (item) => {
      if (!user) {
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      const mediaType = mediaTypeOf(item);
      const key = itemKey(mediaType, item.id);
      const has = watchlistIds.has(key);
      try {
        if (has) {
          await removeFromList(user.uid, 'watchlist', mediaType, item.id);
          showToast('Removed from Watchlist');
        } else {
          await addToList(user.uid, 'watchlist', item);
          showToast('Added to Watchlist');
        }
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          if (has) next.delete(key);
          else next.add(key);
          return next;
        });
      } catch (err) {
        console.error('Failed to update watchlist:', err);
        showToast("Couldn't update your Watchlist", { type: 'error' });
      }
    },
    [user, watchlistIds, showToast, navigate, location.pathname]
  );

  const playTrailer = async (item) => {
    try {
      // Recommendation rows can contain TV shows, so fetch from the right endpoint.
      const details =
        mediaTypeOf(item) === 'tv' ? await getTvDetails(item.id) : await getMovieDetails(item.id);
      const key = getTrailerKey(details.videos);
      setTrailer(key ? { key, title: item.title || item.name } : null);
      if (!key) showToast('No trailer available for this title', { type: 'error' });
    } catch (err) {
      console.error('Failed to load trailer:', err);
      showToast("Couldn't load the trailer", { type: 'error' });
    }
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
      <Hero
        item={hero}
        inWatchlist={hero ? watchlistIds.has(itemKey(mediaTypeOf(hero), hero.id)) : false}
        onToggleWatchlist={toggleWatchlist}
        onPlayTrailer={playTrailer}
      />

      {ratedButNoRecs && (
        <p className="mx-4 mt-6 rounded-lg border border-ink/10 bg-card px-4 py-3 text-sm text-ink/60 sm:mx-8">
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
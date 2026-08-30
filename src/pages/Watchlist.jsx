import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getList, removeFromList } from '../lib/firebase';
import { getGenreList, imageUrl } from '../lib/tmdb';
import { useToast } from '../context/ToastContext';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const SORTS = [
  { key: 'added', label: 'Date Added' },
  { key: 'az', label: 'A–Z' },
  { key: 'rating', label: 'Rating' },
];

export default function Watchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState(null);
  const [genreMap, setGenreMap] = useState({});
  const [sortKey, setSortKey] = useState('added');
  const [genreFilter, setGenreFilter] = useState(null);

  useEffect(() => {
    if (!user) return;
    getList(user.uid, 'watchlist').then(setItems);
    getGenreList('movie').then((res) =>
      setGenreMap(Object.fromEntries(res.genres.map((g) => [g.id, g.name])))
    );
  }, [user]);

  const availableGenres = useMemo(() => {
    if (!items) return [];
    const ids = new Set();
    items.forEach((i) => (i.genreIds || []).forEach((id) => ids.add(id)));
    return [...ids].map((id) => ({ id, name: genreMap[id] })).filter((g) => g.name);
  }, [items, genreMap]);

  const visibleItems = useMemo(() => {
    if (!items) return [];
    let filtered = genreFilter ? items.filter((i) => i.genreIds?.includes(genreFilter)) : items;
    filtered = [...filtered];
    if (sortKey === 'added') filtered.sort((a, b) => b.addedAt - a.addedAt);
    if (sortKey === 'az') filtered.sort((a, b) => a.title.localeCompare(b.title));
    if (sortKey === 'rating') filtered.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    return filtered;
  }, [items, sortKey, genreFilter]);

  const handleRemove = (item) => {
    removeFromList(user.uid, 'watchlist', item.id).then(() => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast('Removed from Watchlist');
    });
  };

  if (!items) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Watchlist</h1>
          <p className="text-sm text-crimson-400">
            {visibleItems.length} item{visibleItems.length !== 1 ? 's' : ''}
            {genreFilter ? ` in ${genreMap[genreFilter]}` : ' saved for later'}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  sortKey === s.key ? 'bg-crimson-600 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {availableGenres.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setGenreFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !genreFilter ? 'bg-crimson-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            All Genres
          </button>
          {availableGenres.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenreFilter(g.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                genreFilter === g.id ? 'bg-crimson-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Bookmark}
            title="Your watchlist is empty"
            subtitle="Add movies and shows you want to watch later — they'll show up here."
            action={
              <button
                onClick={() => navigate('/movies')}
                className="mt-2 rounded-md bg-crimson-600 px-5 py-2.5 text-sm font-semibold hover:bg-crimson-500"
              >
                Browse Movies
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {visibleItems.map((item) => (
            <div key={item.id} className="group relative">
              <div
                className="aspect-[2/3] cursor-pointer overflow-hidden rounded-lg bg-base-800"
                onClick={() => navigate(`/${item.mediaType}/${item.id}`)}
              >
                {item.posterPath && (
                  <img src={imageUrl(item.posterPath, 'w342')} alt={item.title} className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-1.5 line-clamp-1 text-sm font-medium">{item.title}</p>
              <button onClick={() => handleRemove(item)} className="mt-1 text-xs text-white/40 hover:text-crimson-400">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

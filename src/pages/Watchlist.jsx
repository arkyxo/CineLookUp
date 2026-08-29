import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getList, removeFromList } from '../lib/firebase';
import { imageUrl } from '../lib/tmdb';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Watchlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    getList(user.uid, 'watchlist').then((list) =>
      setItems(list.sort((a, b) => b.addedAt - a.addedAt))
    );
  }, [user]);

  if (!items) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="text-2xl font-semibold">My Watchlist</h1>
      <p className="mb-6 text-sm text-crimson-400">{items.length} item{items.length !== 1 ? 's' : ''} saved for later</p>

      {items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Your watchlist is empty"
          subtitle="Add movies and shows you want to watch later — they'll show up here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((item) => (
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
              <button
                onClick={() =>
                  removeFromList(user.uid, 'watchlist', item.id).then(() =>
                    setItems((prev) => prev.filter((i) => i.id !== item.id))
                  )
                }
                className="mt-1 text-xs text-white/40 hover:text-crimson-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

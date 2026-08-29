import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getList, removeFromList } from '../lib/firebase';
import { imageUrl } from '../lib/tmdb';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function PrivateList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    getList(user.uid, 'privateList').then((list) =>
      setItems(list.sort((a, b) => b.addedAt - a.addedAt))
    );
  }, [user]);

  if (!items) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <div className="mb-1 flex items-center gap-2">
        <Lock size={20} className="text-crimson-500" />
        <h1 className="text-2xl font-semibold">Private Collection</h1>
      </div>
      <p className="mb-6 text-sm text-white/50">Only you can see these titles.</p>

      {items.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="Nothing in your private collection yet"
          subtitle="Titles you add here stay separate from your public watchlist and are visible only to you."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <div
                className="relative aspect-[2/3] cursor-pointer overflow-hidden rounded-lg bg-base-800"
                onClick={() => navigate(`/${item.mediaType}/${item.id}`)}
              >
                {item.posterPath && (
                  <img src={imageUrl(item.posterPath, 'w342')} alt={item.title} className="h-full w-full object-cover" />
                )}
                <Lock size={14} className="absolute right-1.5 top-1.5 text-crimson-400 drop-shadow" />
              </div>
              <p className="mt-1.5 line-clamp-1 text-sm font-medium">{item.title}</p>
              <button
                onClick={() =>
                  removeFromList(user.uid, 'privateList', item.id).then(() =>
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

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCustomList, getCustomListItems, removeFromCustomList, deleteCustomList } from '../lib/firebase';
import { imageUrl } from '../lib/tmdb';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export default function ListDetail() {
  const { listId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [list, setList] = useState(null);
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    getCustomList(user.uid, listId).then(setList);
    getCustomListItems(user.uid, listId).then((list) => setItems(list.sort((a, b) => b.addedAt - a.addedAt)));
  }, [user, listId]);

  const handleRemove = (item) => {
    removeFromCustomList(user.uid, listId, item.id).then(() => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast('Removed from list');
    });
  };

  const handleDeleteList = async () => {
    await deleteCustomList(user.uid, listId);
    showToast('List deleted');
    navigate('/lists');
  };

  if (!items || !list) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <button
        onClick={() => navigate('/lists')}
        className="mb-4 flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft size={15} /> My Lists
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{list.name}</h1>
          <p className="text-sm text-white/50">
            {items.length} title{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleDeleteList}
          className="flex items-center gap-1.5 rounded-md border border-crimson-600 px-3 py-1.5 text-xs font-semibold text-crimson-400 hover:bg-crimson-600 hover:text-white"
        >
          <Trash2 size={13} /> Delete List
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="This list is empty" subtitle="Add movies to it from any movie's details page." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
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
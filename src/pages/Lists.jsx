import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListVideo, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCustomLists, createCustomList } from '../lib/firebase';
import { SkeletonGrid } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Lists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCustomLists(user.uid).then(setLists);
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createCustomList(user.uid, newName.trim());
      setLists((prev) => [{ id, name: newName.trim(), createdAt: Date.now() }, ...(prev || [])]);
      setNewName('');
    } finally {
      setCreating(false);
    }
  };

  if (!lists) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-8">
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-8">
      <h1 className="mb-1 text-2xl font-semibold">My Lists</h1>
      <p className="mb-6 text-sm text-ink/50">Organize movies into your own custom collections.</p>

      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New list name…"
          className="flex-1 rounded-md border border-ink/10 bg-ink/5 px-4 py-2.5 text-sm outline-none placeholder:text-ink/30 focus:border-crimson-500"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="flex items-center gap-1.5 rounded-md bg-crimson-600 px-4 py-2.5 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
        >
          <Plus size={15} /> Create
        </button>
      </form>

      {lists.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="No lists yet"
          subtitle="Create your first list above, or add a movie to a new list straight from its details page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate(`/lists/${l.id}`)}
              className="rounded-xl border border-ink/10 bg-card p-5 text-left hover:border-crimson-500/50"
            >
              <div className="flex items-center gap-2 text-crimson-400">
                <ListVideo size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">List</span>
              </div>
              <h3 className="mt-2 font-semibold">{l.name}</h3>
              {l.description && <p className="mt-1 text-xs text-ink/50 line-clamp-2">{l.description}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

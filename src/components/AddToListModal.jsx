import { useEffect, useState } from 'react';
import { X, Plus, Check, ListPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getCustomLists,
  createCustomList,
  addToCustomList,
  removeFromCustomList,
  isInCustomList,
} from '../lib/firebase';
import { useToast } from '../context/ToastContext';

export default function AddToListModal({ item, onClose }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [lists, setLists] = useState(null);
  const [membership, setMembership] = useState({});
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCustomLists(user.uid).then(async (fetched) => {
      setLists(fetched);
      const entries = await Promise.all(
        fetched.map(async (l) => [l.id, await isInCustomList(user.uid, l.id, item.id)])
      );
      setMembership(Object.fromEntries(entries));
    });
  }, [user, item.id]);

  const toggleList = async (listId) => {
    const isIn = membership[listId];
    if (isIn) {
      await removeFromCustomList(user.uid, listId, item.id);
      showToast('Removed from list');
    } else {
      await addToCustomList(user.uid, listId, item);
      showToast('Added to list');
    }
    setMembership((prev) => ({ ...prev, [listId]: !isIn }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const listId = await createCustomList(user.uid, newName.trim());
      await addToCustomList(user.uid, listId, item);
      setLists((prev) => [{ id: listId, name: newName.trim(), createdAt: Date.now() }, ...prev]);
      setMembership((prev) => ({ ...prev, [listId]: true }));
      setNewName('');
      showToast('List created');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-base-850 p-5 shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add to List</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {lists === null ? (
          <p className="text-xs text-white/40">Loading…</p>
        ) : (
          <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {lists.length === 0 && <p className="text-xs text-white/40">No lists yet — create one below.</p>}
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleList(l.id)}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-white/5"
              >
                <span>{l.name}</span>
                {membership[l.id] ? (
                  <Check size={15} className="text-crimson-400" />
                ) : (
                  <Plus size={15} className="text-white/30" />
                )}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 flex gap-2 border-t border-white/10 pt-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New list name…"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-crimson-500"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex-shrink-0 rounded-md bg-crimson-600 px-4 py-2 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
          >
            <ListPlus size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
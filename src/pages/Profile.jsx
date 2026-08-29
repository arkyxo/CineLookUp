import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getList, logOut } from '../lib/firebase';
import { imageUrl } from '../lib/tmdb';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([getList(user.uid, 'watchlist'), getList(user.uid, 'privateList'), getList(user.uid, 'ratings')]).then(
      ([watchlist, privateList, ratings]) => {
        setStats({
          watchlist,
          privateList,
          ratings,
          avgRating: ratings.length
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : '—',
        });
      }
    );
  }, [user]);

  if (!stats) return <LoadingSpinner />;

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-white/10 bg-base-850 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crimson-600 text-2xl font-semibold uppercase">
            {(user.displayName || user.email)[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{user.displayName || 'Movie Fan'}</h1>
            <p className="text-sm text-white/50">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
          >
            <Settings size={15} /> Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md bg-crimson-600 px-4 py-2 text-sm font-medium hover:bg-crimson-500"
          >
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Rated" value={stats.ratings.length} />
        <Stat label="Watchlist" value={stats.watchlist.length} />
        <Stat label="Private List" value={stats.privateList.length} />
        <Stat label="Avg Rating" value={stats.avgRating} />
      </div>

      {stats.ratings.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Movies You've Rated</h2>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-6">
            {stats.ratings.map((r) => (
              <div key={r.id} className="cursor-pointer" onClick={() => navigate(`/movie/${r.id}`)}>
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-base-800">
                  {r.posterPath && <img src={imageUrl(r.posterPath, 'w185')} alt={r.title} className="h-full w-full object-cover" />}
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium">{r.title}</p>
                <p className="text-[11px] text-crimson-400">{'★'.repeat(r.rating)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-base-850 p-4 text-center">
      <p className="font-display text-3xl text-crimson-400">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/50">{label}</p>
    </div>
  );
}
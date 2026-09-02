import { useEffect, useState } from 'react';
import { Star, Film, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getList } from '../lib/firebase';
import { getGenreList } from '../lib/tmdb';
import { SkeletonGrid } from '../components/Skeleton';

export default function Stats() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState(null);
  const [genreMap, setGenreMap] = useState({});
  const [range, setRange] = useState('all');

  useEffect(() => {
    if (!user) return;
    getList(user.uid, 'ratings').then(setRatings);
    getGenreList('movie').then((res) =>
      setGenreMap(Object.fromEntries(res.genres.map((g) => [g.id, g.name])))
    );
  }, [user]);

  if (!ratings) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-8">
        <SkeletonGrid count={4} />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const filtered =
    range === 'year' ? ratings.filter((r) => new Date(r.ratedAt).getFullYear() === currentYear) : ratings;

  const totalRated = filtered.length;
  const totalReviews = filtered.filter((r) => r.review?.trim()).length;
  const avgRating = totalRated
    ? (filtered.reduce((sum, r) => sum + r.rating, 0) / totalRated).toFixed(1)
    : '—';

  const genreCounts = {};
  filtered.forEach((r) => (r.genreIds || []).forEach((id) => {
    genreCounts[id] = (genreCounts[id] || 0) + 1;
  }));
  const topGenreId = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topGenre = topGenreId ? genreMap[topGenreId] : null;

  const decadeCounts = {};
  filtered.forEach((r) => {
    const year = r.releaseDate ? parseInt(r.releaseDate.slice(0, 4), 10) : null;
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    }
  });
  const topDecade = Object.entries(decadeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your Stats</h1>
          <p className="text-sm text-white/50">A look back at what you've watched and rated.</p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {['all', 'year'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-sm font-medium transition ${
                range === r ? 'bg-crimson-600 text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {r === 'all' ? 'All Time' : currentYear}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Film} label="Rated" value={totalRated} />
        <StatCard icon={MessageSquare} label="Reviews" value={totalReviews} />
        <StatCard icon={Star} label="Avg Rating" value={avgRating} />
        <StatCard icon={TrendingUp} label="Top Genre" value={topGenre || '—'} small />
      </div>

      {topDecade && (
        <div className="mt-6 rounded-xl border border-white/10 bg-base-850 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Favorite Decade</p>
          <p className="mt-1 font-display text-4xl tracking-wide text-crimson-400">{topDecade}s</p>
        </div>
      )}

      {totalRated === 0 && (
        <p className="mt-8 text-center text-sm text-white/40">
          {range === 'year'
            ? `No ratings yet in ${currentYear}.`
            : "You haven't rated anything yet — go rate a few movies!"}
        </p>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, small }) {
  return (
    <div className="rounded-xl border border-white/10 bg-base-850 p-4 text-center">
      <Icon size={18} className="mx-auto text-crimson-400" />
      <p className={`mt-2 font-display tracking-wide text-crimson-400 ${small ? 'text-lg' : 'text-3xl'}`}>
        {value}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/50">{label}</p>
    </div>
  );
}
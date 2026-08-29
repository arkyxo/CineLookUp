import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Lock, Star, Compass, ChevronDown } from 'lucide-react';
import { getTrending, imageUrl } from '../lib/tmdb';

const FEATURES = [
  {
    icon: Bookmark,
    title: 'Build a watchlist',
    body: 'Save anything you want to watch later and pick it back up whenever you\'re ready.',
  },
  {
    icon: Lock,
    title: 'Keep a private collection',
    body: 'A second list just for you — separate from your watchlist, visible to no one else.',
  },
  {
    icon: Star,
    title: 'Rate what you watch',
    body: 'Give every title your own 1–5 star rating, tracked separately from the public score.',
  },
  {
    icon: Compass,
    title: 'Explore by genre',
    body: 'Browse curated rows across genres and sort by popularity, rating, or release date.',
  },
];

const FAQ = [
  {
    q: 'Is CineLookUp free to use?',
    a: 'Yes. Create an account and start building your watchlist, private collection, and ratings at no cost.',
  },
  {
    q: 'Do I need an account to browse movies?',
    a: 'No — browsing, search, and movie details are open to everyone. An account is only needed to save a watchlist, keep a private collection, or rate titles.',
  },
  {
    q: 'What can I watch here?',
    a: 'CineLookUp is a discovery and tracking tool, not a streaming service — "Watch Trailer" plays the official trailer for a title, not the full film.',
  },
  {
    q: 'Can I delete my account or data later?',
    a: 'Yes, from Settings you can update your profile at any time. Reach out via Contact Us for account deletion.',
  },
];

export default function Landing() {
  const [posters, setPosters] = useState([]);
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTrending('movie', 'week').then((res) =>
      setPosters(res.results.map((m) => m.poster_path).filter(Boolean))
    );
  }, []);

  const rowA = posters.slice(0, 10);
  const rowB = posters.slice(10, 20);

  const handleGetStarted = (e) => {
    e.preventDefault();
    navigate(`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center gap-3 opacity-30">
          <PosterMarquee items={rowA} direction="left" />
          <PosterMarquee items={rowB} direction="right" />
          <PosterMarquee items={rowA} direction="left" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-base-950/40 via-base-950/80 to-base-950" />

        <div className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-crimson-400">
            Discover · Track · Collect
          </span>
          <h1 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-7xl">
            Every film you mean to watch,
            <br className="hidden sm:block" /> in one place
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Search thousands of movies and shows, save what catches your eye, and rate what you finish —
            all synced to your account.
          </p>

          <form
            onSubmit={handleGetStarted}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none backdrop-blur placeholder:text-white/40 focus:border-crimson-500"
            />
            <button
              type="submit"
              className="flex-shrink-0 rounded-md bg-crimson-600 px-6 py-3 text-sm font-semibold hover:bg-crimson-500"
            >
              Get Started
            </button>
          </form>
          <p className="mt-3 text-xs text-white/40">Free account. No payment required.</p>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-base-850 p-6">
              <Icon size={22} className="text-crimson-500" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-8">
        <h2 className="mb-6 text-center font-display text-3xl tracking-wide">Frequently Asked Questions</h2>
        <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-base-850">
          {FAQ.map((item, i) => (
            <div key={item.q}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
              >
                {item.q}
                <ChevronDown
                  size={16}
                  className={`flex-shrink-0 text-white/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <p className="px-5 pb-4 text-sm leading-relaxed text-white/60">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PosterMarquee({ items, direction }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';

  return (
    <div className="flex w-max gap-3">
      <div className={`flex gap-3 ${animClass}`}>
        {doubled.map((path, i) => (
          <img
            key={`${path}-${i}`}
            src={imageUrl(path, 'w342')}
            alt=""
            className="h-40 w-28 flex-shrink-0 rounded-md object-cover sm:h-56 sm:w-36"
          />
        ))}
      </div>
    </div>
  );
}
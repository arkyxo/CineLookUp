import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logOut } from '../lib/firebase';
import SearchBox from './SearchBox';
import NotificationBell from './NotificationBell';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/genres', label: 'Genres' },
  { to: '/reviews', label: 'Review Hall' },
  { to: '/private-list', label: 'Private List' },
  { to: '/lists', label: 'Lists' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-crimson-500">
            <Film size={22} />
            <span className="font-display text-2xl tracking-wide text-white">CineLookUp</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="transition hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchBox className="hidden w-56 sm:block" />

          <div className="hidden sm:block">
            <NotificationBell />
          </div>

          {user ? (
            <Link
              to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-crimson-600 text-xs font-semibold uppercase"
            >
              {(user.displayName || user.email || '?')[0]}
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-crimson-600 px-4 py-1.5 text-sm font-semibold hover:bg-crimson-500"
            >
              Log In
            </Link>
          )}

          <button className="text-white/80 md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 bg-base-950 px-4 pb-4 md:hidden">
          <SearchBox className="my-3" onNavigate={() => setOpen(false)} />
          <nav className="flex flex-col gap-3 text-sm font-medium text-white/80">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user && (
              <>
                <Link to="/profile" onClick={() => setOpen(false)}>
                  Profile
                </Link>
                <button className="text-left text-crimson-400" onClick={() => logOut()}>
                  Log Out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
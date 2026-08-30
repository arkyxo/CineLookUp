import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { searchMulti, imageUrl } from '../lib/tmdb';

export default function SearchBox({ onNavigate, className = '' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return undefined;
    }
    // Wait for a pause in typing before hitting the API, instead of firing a
    // request on every keystroke.
    debounceRef.current = setTimeout(() => {
      searchMulti(query.trim()).then((res) => {
        const filtered = res.results
          .filter((r) => (r.media_type === 'person' ? r.profile_path : r.poster_path))
          .slice(0, 6);
        setSuggestions(filtered);
      });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const goToResult = (item) => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onNavigate?.();
    navigate(item.media_type === 'person' ? `/person/${item.id}` : `/${item.media_type}/${item.id}`);
  };

  const submitFullSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    onNavigate?.();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  return (
    <form onSubmit={submitFullSearch} className={`relative ${className}`}>
      <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Titles, people, genres…"
        className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-white/30 focus:border-crimson-500"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-white/10 bg-base-850 shadow-2xl">
          {suggestions.map((item) => (
            <button
              type="button"
              key={`${item.media_type}-${item.id}`}
              onMouseDown={() => goToResult(item)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
            >
              <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-base-700">
                <img
                  src={imageUrl(item.poster_path || item.profile_path, 'w92')}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title || item.name}</p>
                <p className="text-xs text-white/40">
                  {item.media_type === 'person'
                    ? 'Person'
                    : (item.release_date || item.first_air_date || '').slice(0, 4)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

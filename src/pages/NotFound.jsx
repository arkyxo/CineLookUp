import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Film size={40} className="text-white/20" />
      <h1 className="font-display text-5xl tracking-wide">404</h1>
      <p className="max-w-sm text-sm text-white/50">
        We couldn't find that page. It may have been moved, or the link might be broken.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-crimson-600 px-5 py-2.5 text-sm font-semibold hover:bg-crimson-500"
      >
        Back to Home
      </Link>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-ink/5 px-4 py-8 text-sm text-ink/40 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="font-display text-lg tracking-wide text-ink/70">CineLookUp</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link to="/privacy" className="hover:text-ink">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-ink">Terms of Service</Link>
          <Link to="/help" className="hover:text-ink">Help Center</Link>
          <Link to="/contact" className="hover:text-ink">Contact Us</Link>
        </nav>
        <span>© {new Date().getFullYear()} CineLookUp. All rights reserved.</span>
      </div>
    </footer>
  );
}
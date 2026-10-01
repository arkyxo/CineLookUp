import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import InfoPage from '../../components/InfoPage';

const FAQS = [
  {
    q: 'How do I add a movie to my watchlist?',
    a: 'Open any movie or show and use the watchlist button. You can see everything you saved on the Watchlist page.',
  },
  {
    q: "What's the difference between the Watchlist and the Private List?",
    a: 'The Watchlist is for things you plan to watch. The Private List is a collection meant just for you.',
  },
  {
    q: 'How do I create a custom list?',
    a: 'Go to Lists and create one, or use the "add to list" option on any title to put it into a list.',
  },
  {
    q: 'How do I rate or review a movie?',
    a: 'On a title\'s page, pick a star rating and optionally write a review. Your reviews appear on the Reviews page, and other users can like and reply to them.',
  },
  {
    q: 'Where can I see my stats?',
    a: 'Open your Profile and choose Stats to see your ratings, average score, top genre and favorite decade.',
  },
  {
    q: 'I forgot my password.',
    a: 'Use the "Forgot password" link on the login page and we will email you a reset link. If you are signed in, you can change it from Settings.',
  },
  {
    q: 'Can I change my username?',
    a: 'Yes. In Settings you can generate a new username.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings and choose Delete Account. This permanently removes your account, lists and ratings, and cannot be undone.',
  },
];

export default function HelpCenter() {
  const [open, setOpen] = useState(0);

  return (
    <InfoPage title="Help Center" subtitle="Quick answers to common questions.">
      <div className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-card">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-ink/5"
              >
                {f.q}
                <ChevronDown size={16} className={`shrink-0 text-ink/50 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <p className="px-5 pb-4 text-sm leading-relaxed text-ink/60">{f.a}</p>}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-ink/60">
        Still stuck?{' '}
        <Link to="/contact" className="text-crimson-400 hover:underline">
          Contact us
        </Link>
        .
      </p>
    </InfoPage>
  );
}
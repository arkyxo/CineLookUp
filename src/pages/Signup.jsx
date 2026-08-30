import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../lib/firebase';
import { useAttemptLimiter } from '../hooks/useAttemptLimiter';

export default function Signup() {
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { locked, secondsLeft, registerFailure, reset } = useAttemptLimiter(4, 30000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, username);
      reset();
      navigate('/');
    } catch (err) {
      registerFailure();
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-base-850 p-8">
        <h1 className="font-display text-3xl tracking-wide">Create Account</h1>
        <p className="mt-1 text-sm text-white/50">Save watchlists, ratings, and a private collection</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Username</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-white/60">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
            />
          </div>

          {locked ? (
            <p className="text-sm text-crimson-400">Too many attempts. Try again in {secondsLeft}s.</p>
          ) : (
            error && <p className="text-sm text-crimson-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || locked}
            className="mt-2 rounded-md bg-crimson-600 py-2.5 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
          >
            {locked ? `Try again in ${secondsLeft}s` : loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-crimson-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/weak-password': 'Password is too weak.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logIn } from '../lib/firebase';
import { useAttemptLimiter } from '../hooks/useAttemptLimiter';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { locked, secondsLeft, registerFailure, reset } = useAttemptLimiter(5, 30000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setError('');
    setLoading(true);
    try {
      await logIn(email, password);
      reset();
      navigate(location.state?.from || '/');
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
        <h1 className="font-display text-3xl tracking-wide">Welcome Back</h1>
        <p className="mt-1 text-sm text-white/50">Log in to your CineLookUp account</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
            {locked ? `Try again in ${secondsLeft}s` : loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-crimson-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
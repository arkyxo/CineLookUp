import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../lib/firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setError('That email address looks invalid.');
      } else {
        // Don't reveal whether an account exists for this email —
        // show the same success state either way.
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-base-850 p-8">
        <h1 className="font-display text-3xl tracking-wide">Reset Password</h1>
        <p className="mt-1 text-sm text-white/50">We'll email you a link to get back in.</p>

        {sent ? (
          <p className="mt-6 text-sm leading-relaxed text-white/70">
            If an account exists for <span className="font-semibold text-white">{email}</span>, a reset
            link is on its way. Check your inbox — and your spam folder, just in case.
          </p>
        ) : (
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

            {error && <p className="text-sm text-crimson-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-md bg-crimson-600 py-2.5 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          <Link to="/login" className="font-medium text-crimson-400 hover:underline">
            Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
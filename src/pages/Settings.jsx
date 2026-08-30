import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUsername, changePassword, deleteAccount } from '../lib/firebase';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user.displayName || '');
  const [nameStatus, setNameStatus] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwStatus, setPwStatus] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const saveUsername = async (e) => {
    e.preventDefault();
    setNameSaving(true);
    setNameStatus('');
    try {
      await updateUsername(username.trim());
      setNameStatus('Saved.');
    } catch {
      setNameStatus('Could not save. Try again.');
    } finally {
      setNameSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwStatus('');
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwStatus('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(friendlyError(err.code));
    } finally {
      setPwSaving(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      navigate('/');
    } catch (err) {
      setDeleteError(friendlyDeleteError(err.code));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-8 sm:px-8">
      <button
        onClick={() => navigate('/profile')}
        className="mb-6 flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft size={15} /> Back to Profile
      </button>

      <h1 className="text-2xl font-semibold">Settings</h1>

      <form onSubmit={saveUsername} className="mt-8 rounded-xl border border-white/10 bg-base-850 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Profile</h2>
        <label className="mb-1 mt-4 block text-xs font-medium text-white/60">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
        />
        <div className="mt-2 text-xs text-white/40">{user.email}</div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={nameSaving || !username.trim()}
            className="rounded-md bg-crimson-600 px-5 py-2 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
          >
            {nameSaving ? 'Saving…' : 'Save'}
          </button>
          {nameStatus && <span className="text-xs text-white/50">{nameStatus}</span>}
        </div>
      </form>

      <form onSubmit={savePassword} className="mt-6 rounded-xl border border-white/10 bg-base-850 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Change Password</h2>

        <label className="mb-1 mt-4 block text-xs font-medium text-white/60">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
        />

        <label className="mb-1 mt-4 block text-xs font-medium text-white/60">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
        />

        {pwError && <p className="mt-3 text-sm text-crimson-400">{pwError}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={pwSaving || !currentPassword || !newPassword}
            className="rounded-md bg-crimson-600 px-5 py-2 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
          >
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
          {pwStatus && <span className="text-xs text-white/50">{pwStatus}</span>}
        </div>
      </form>

      <div className="mt-6 rounded-xl border border-crimson-700/40 bg-crimson-700/10 p-6">
        <div className="flex items-center gap-2 text-crimson-400">
          <AlertTriangle size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Danger Zone</h2>
        </div>

        {!deleteOpen ? (
          <>
            <p className="mt-3 text-sm text-white/60">
              Permanently delete your account, watchlist, private collection, and ratings. This cannot be undone.
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="mt-4 rounded-md border border-crimson-600 px-5 py-2 text-sm font-semibold text-crimson-400 hover:bg-crimson-600 hover:text-white"
            >
              Delete Account
            </button>
          </>
        ) : (
          <form onSubmit={handleDelete} className="mt-3">
            <p className="text-sm text-white/70">
              This will permanently delete your account and all of your data. Enter your password to confirm.
            </p>
            <input
              type="password"
              autoFocus
              placeholder="Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="mt-3 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-crimson-500"
            />
            {deleteError && <p className="mt-2 text-sm text-crimson-400">{deleteError}</p>}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={deleting || !deletePassword}
                className="rounded-md bg-crimson-600 px-5 py-2 text-sm font-semibold hover:bg-crimson-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Permanently Delete My Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="text-sm text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function friendlyDeleteError(code) {
  const map = {
    'auth/invalid-credential': 'Incorrect password.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] || 'Could not delete account. Please try again.';
}

function friendlyError(code) {
  const map = {
    'auth/invalid-credential': 'Current password is incorrect.',
    'auth/wrong-password': 'Current password is incorrect.',
    'auth/weak-password': 'New password is too weak.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

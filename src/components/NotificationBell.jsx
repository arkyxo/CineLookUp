import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { watchNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/firebase';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = watchNotifications(user.uid, setNotifs);
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const unreadCount = notifs?.filter((n) => !n.read).length || 0;

  const handleToggleOpen = () => setOpen((o) => !o);

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user.uid);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClickNotif = async (n) => {
    if (!n.read) {
      markNotificationRead(user.uid, n.id).catch(() => {});
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    navigate(`/${n.mediaType || 'movie'}/${n.movieId}`);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={handleToggleOpen}
        aria-label="Notifications"
        className="relative text-ink/70 hover:text-ink"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-crimson-600 px-1 text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-ink/10 bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} className="text-xs text-crimson-400 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {notifs === null ? (
            <p className="px-4 py-6 text-center text-xs text-ink/40">Loading…</p>
          ) : notifs.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-ink/40">No notifications yet.</p>
          ) : (
            notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotif(n)}
                className={`flex w-full items-start gap-2.5 border-b border-ink/5 px-4 py-3 text-left last:border-0 hover:bg-ink/5 ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                {n.type === 'like' ? (
                  <Heart size={14} className="mt-0.5 flex-shrink-0 fill-crimson-400 text-crimson-400" />
                ) : (
                  <MessageCircle size={14} className="mt-0.5 flex-shrink-0 text-crimson-400" />
                )}
                <span className="text-xs leading-relaxed text-ink/80">
                  <span className="font-semibold">@{n.fromUsername}</span>{' '}
                  {n.type === 'like'
                    ? 'liked'
                    : n.type === 'reply'
                    ? 'replied to your comment on'
                    : 'commented on your review of'}{' '}
                  <span className="font-semibold">{n.movieTitle}</span>
                  {(n.type === 'comment' || n.type === 'reply') && n.text && (
                    <span className="mt-1 block text-ink/50">"{n.text}"</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

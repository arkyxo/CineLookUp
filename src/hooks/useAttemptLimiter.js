import { useEffect, useRef, useState } from 'react';

// Client-side cooldown after repeated failures. This is a UX deterrent, not a
// security boundary on its own — Firebase Auth already rate-limits failed
// logins server-side (surfaced as the "auth/too-many-requests" error code).
// This just stops someone from hammering the submit button in the meantime.
export function useAttemptLimiter(maxAttempts = 5, cooldownMs = 30000) {
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!lockedUntil) return undefined;
    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setSecondsLeft(0);
        clearInterval(intervalRef.current);
      } else {
        setSecondsLeft(remaining);
      }
    }, 250);
    return () => clearInterval(intervalRef.current);
  }, [lockedUntil]);

  const locked = !!lockedUntil && Date.now() < lockedUntil;

  const registerFailure = () => {
    setAttempts((prev) => {
      const next = prev + 1;
      if (next >= maxAttempts) {
        setLockedUntil(Date.now() + cooldownMs);
        setSecondsLeft(Math.ceil(cooldownMs / 1000));
      }
      return next;
    });
  };

  const reset = () => {
    setAttempts(0);
    setLockedUntil(null);
    setSecondsLeft(0);
  };

  return { locked, secondsLeft, registerFailure, reset };
}
import { useState, useEffect, useCallback } from 'react';

const COOLDOWN_KEY_PREFIX = 'raastafix_chat_cooldown_';

export function useCooldown(cooldownSeconds: number = 120, key: string = 'global') {
  const storageKey = `${COOLDOWN_KEY_PREFIX}${key}`;

  const getRemainingSeconds = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return 0;
      const expiry = parseInt(stored, 10);
      const now = Date.now();
      if (expiry > now) {
        return Math.ceil((expiry - now) / 1000);
      }
      localStorage.removeItem(storageKey);
      return 0;
    } catch {
      return 0;
    }
  }, [storageKey]);

  const [remaining, setRemaining] = useState<number>(getRemainingSeconds);

  useEffect(() => {
    setRemaining(getRemainingSeconds());
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      const sec = getRemainingSeconds();
      setRemaining(sec);
      if (sec <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getRemainingSeconds, remaining]);

  const startCooldown = useCallback(() => {
    const expiry = Date.now() + cooldownSeconds * 1000;
    try {
      localStorage.setItem(storageKey, expiry.toString());
    } catch (e) {
      console.warn('Failed to save cooldown in storage', e);
    }
    setRemaining(cooldownSeconds);
  }, [cooldownSeconds, storageKey]);

  return {
    isCoolingDown: remaining > 0,
    remainingSeconds: remaining,
    startCooldown,
  };
}

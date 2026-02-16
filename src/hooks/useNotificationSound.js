import { useRef, useCallback } from 'react';

const SOUND_URL = '/sounds/notification.wav';

export function useNotificationSound() {
  const audioRef = useRef(null);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUND_URL);
        audioRef.current.volume = 0.5;
      }
      // Reset to start if already playing
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Browser may block autoplay until user interaction - silently ignore
      });
    } catch {
      // Audio not supported - ignore
    }
  }, []);

  return { play };
}

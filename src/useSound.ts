import { useEffect, useRef } from 'react';

/**
 * GLOBAL SOUND SYSTEM
 * ------------------
 * - Background music (loop)
 * - Touch / click sound
 * - Autoplay browser restriction safe
 */

export function useSound() {
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const tapSoundRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // 🎵 Background music
    bgMusicRef.current = new Audio('/bg.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.25;

    // 👆 Touch sound
    tapSoundRef.current = new Audio('/tap.mp3');
    tapSoundRef.current.volume = 0.7;

    // 🛑 Autoplay restriction fix
    const unlockAudio = () => {
      if (!startedRef.current) {
        bgMusicRef.current
          ?.play()
          .then(() => {
            startedRef.current = true;
          })
          .catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      bgMusicRef.current?.pause();
    };
  }, []);

  // 🔊 Play tap sound
  const playTap = () => {
    if (!tapSoundRef.current) return;
    tapSoundRef.current.currentTime = 0;
    tapSoundRef.current.play().catch(() => {});
  };

  return { playTap };
}

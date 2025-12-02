import { useRef, useCallback } from "react";

// Better sound effect URLs
const SOUNDS = {
  upload: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  generate: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  complete: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  favorite: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  download: "https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3",
  preview: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3",
  error: "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3",
};

export const useSoundEffects = () => {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const playSound = useCallback((soundType: keyof typeof SOUNDS, volume = 0.5) => {
    try {
      const url = SOUNDS[soundType];
      let audio = audioRefs.current.get(soundType);
      
      if (!audio) {
        audio = new Audio(url);
        audioRefs.current.set(soundType, audio);
      }
      
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      // Silently fail for sound effects
    }
  }, []);

  return { playSound };
};

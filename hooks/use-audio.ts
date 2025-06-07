"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface AudioState {
  isMuted: boolean;
  volume: number;
}

export function useAudio() {
  const [audioState, setAudioState] = useState<AudioState>({
    isMuted: false,
    volume: 0.7
  });

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Initialize audio elements
  useEffect(() => {
    audioRefs.current = {
      deposit: new Audio('/audio/deposit.wav'),
      userDeposit: new Audio('/audio/userDeposit.wav'),
      win: new Audio('/audio/win.wav')
    };

    // Set initial volume
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = audioState.volume;
      audio.preload = 'auto';
    });

    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Update volume when state changes
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.volume = audioState.isMuted ? 0 : audioState.volume;
    });
  }, [audioState.isMuted, audioState.volume]);

  const playSound = useCallback((soundName: 'deposit' | 'userDeposit' | 'win') => {
    if (audioState.isMuted) return;

    const audio = audioRefs.current[soundName];
    if (audio) {
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    }
  }, [audioState.isMuted]);

  const toggleMute = useCallback(() => {
    setAudioState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setAudioState(prev => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume))
    }));
  }, []);

  return {
    isMuted: audioState.isMuted,
    volume: audioState.volume,
    playSound,
    toggleMute,
    setVolume
  };
}
"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useAudio } from '@/hooks/use-audio';

interface AudioContextType {
  isMuted: boolean;
  volume: number;
  playSound: (soundName: 'deposit' | 'userDeposit' | 'win') => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioHook = useAudio();

  return (
    <AudioContext.Provider value={audioHook}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }
  return context;
}
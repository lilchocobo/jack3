"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { useAudio } from "@/hooks/use-audio";

// Individual Volume Slider Component
interface VolumeSliderProps {
  isVisible: boolean;
}

export function VolumeSlider({ isVisible }: VolumeSliderProps) {
  const { volume, setVolume } = useAudio();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="casino-box casino-box-gold p-3 rounded-lg min-w-[120px]"
        >
          <div className="flex items-center gap-2">
            <VolumeX className="h-3 w-3 casino-text-gold" />
            <Slider
              value={[volume * 100]}
              onValueChange={([value]) => setVolume(value / 100)}
              max={100}
              step={5}
              className="flex-1"
            />
            <Volume2 className="h-3 w-3 casino-text-gold" />
          </div>
          <div className="text-center mt-2">
            <span className="text-xs casino-text-gold font-bold">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Individual Settings Button Component
interface SettingsButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export function SettingsButton({ onClick, isActive = false }: SettingsButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={onClick}
        className={`casino-box casino-box-gold p-3 rounded-full border-2 transition-all duration-200 ${
          isActive ? 'border-[#FFFF00]' : 'border-[#FFD700] hover:border-[#FFFF00]'
        }`}
        style={{
          background: 'linear-gradient(145deg, #4A0E4E, #2D0A30)',
          boxShadow: '0 0 15px rgba(255, 215, 0, 0.6), inset 0 1px 0 rgba(255, 215, 0, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
        }}
      >
        <Settings className="h-4 w-4 casino-text-gold" />
      </Button>
    </motion.div>
  );
}

// Individual Mute Button Component
export function MuteButton() {
  const { isMuted, toggleMute } = useAudio();

  return (
    <motion.div 
      whileHover={{ scale: 1.1 }} 
      whileTap={{ scale: 0.9 }}
      animate={{
        boxShadow: isMuted 
          ? '0 0 20px rgba(255, 20, 147, 0.8)' 
          : '0 0 20px rgba(255, 215, 0, 0.8)'
      }}
    >
      <Button
        onClick={toggleMute}
        className={`p-4 rounded-full border-3 transition-all duration-300 ${
          isMuted 
            ? 'border-[#FF1493] casino-box-pink' 
            : 'border-[#FFD700] casino-box-gold'
        }`}
        style={{
          background: isMuted 
            ? 'linear-gradient(145deg, #FF1493, #DC143C)' 
            : 'linear-gradient(145deg, #FFD700, #DAA520)',
          boxShadow: isMuted 
            ? '0 0 25px rgba(255, 20, 147, 0.8), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
            : '0 0 25px rgba(255, 215, 0, 0.8), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
        }}
      >
        <motion.div
          animate={{
            rotate: isMuted ? [0, -10, 10, 0] : 0,
            scale: isMuted ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 0.5,
            repeat: isMuted ? Infinity : 0,
            repeatDelay: 1
          }}
        >
          {isMuted ? (
            <VolumeX className="h-6 w-6 text-white" />
          ) : (
            <Volume2 className="h-6 w-6 text-black" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
}

// Audio Controls Component
interface AudioControlsProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

export function AudioControls({ 
  position = "bottom-right",
  className = ""
}: AudioControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4", 
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4"
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex items-end gap-2 ${className}`}>
      <VolumeSlider isVisible={showVolumeSlider} />
      
      <SettingsButton 
        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
        isActive={showVolumeSlider}
      />
      
      <MuteButton />
    </div>
  );
}
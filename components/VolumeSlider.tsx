"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/use-audio";

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
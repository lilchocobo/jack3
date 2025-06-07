"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/hooks/use-audio";

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
            ? `
                0 0 25px rgba(255, 20, 147, 0.8),
                inset 0 2px 0 rgba(255, 255, 255, 0.3),
                inset 0 -2px 0 rgba(0, 0, 0, 0.3)
              `
            : `
                0 0 25px rgba(255, 215, 0, 0.8),
                inset 0 2px 0 rgba(255, 255, 255, 0.3),
                inset 0 -2px 0 rgba(0, 0, 0, 0.3)
              `
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
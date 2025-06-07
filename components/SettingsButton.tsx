"use client";

import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          boxShadow: `
            0 0 15px rgba(255, 215, 0, 0.6),
            inset 0 1px 0 rgba(255, 215, 0, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
          `
        }}
      >
        <Settings className="h-4 w-4 casino-text-gold" />
      </Button>
    </motion.div>
  );
} 
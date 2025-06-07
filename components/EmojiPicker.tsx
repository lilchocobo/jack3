"use client";

import { useState, useRef, useEffect } from "react";
import { emojiMap } from "@/lib/emoji-map";
import { SmileIcon, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export function EmojiPicker({ onEmojiSelect, isOpen: controlledIsOpen, setIsOpen: setControlledIsOpen }: EmojiPickerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  const isControlled = controlledIsOpen !== undefined && setControlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? setControlledIsOpen : setInternalIsOpen;

  const togglePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={togglePicker}
        className="p-2 rounded-full hover:bg-[#FFD70020] transition-colors border border-[#FFD700]"
        aria-label="Open emoji picker"
      >
        <SmileIcon className="h-5 w-5 casino-text-gold" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full left-0 mb-2 casino-box casino-box-gold rounded-md shadow-lg p-3 z-20 w-64"
          >
            <div className="flex items-center gap-2 mb-3 border-b-2 border-[#FFD700] pb-2">
              <Star className="h-4 w-4 casino-text-gold" fill="currentColor" />
              <span className="font-black casino-text-gold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>Emojis</span>
              <Star className="h-4 w-4 casino-text-gold" fill="currentColor" />
            </div>
            <div className="p-1 flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {Object.entries(emojiMap).map(([code, url]) => (
                <button
                  key={code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onEmojiSelect(`:${code}:`);
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-[#FFD70020] rounded cursor-pointer transition-colors flex items-center justify-center border border-transparent hover:border-[#FFD700]"
                  title={`:${code}:`}
                >
                  <img 
                    src={url} 
                    alt={code} 
                    className="h-6 w-auto"
                    title={`:${code}:`}
                  />
                </button>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t-2 border-[#FFD700] text-xs text-center">
              <span className="casino-text-gold font-black">Tip: </span>
              <span className="casino-text-yellow font-bold">Type <code>:code:</code> to add an emoji</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
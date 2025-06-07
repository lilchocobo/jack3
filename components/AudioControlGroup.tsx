"use client";

import { useState } from "react";
import { VolumeSlider } from "./VolumeSlider";
import { SettingsButton } from "./SettingsButton";
import { MuteButton } from "./MuteButton";

interface AudioControlGroupProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

export function AudioControlGroup({ 
  position = "bottom-right",
  className = ""
}: AudioControlGroupProps) {
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
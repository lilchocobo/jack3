'use client';

import JackpotDonutChart from "@/components/JackpotDonutChart";
import PastDraws from "@/components/PastDraws";
import { CurrentDeposits } from "@/components/CurrentDeposits";
import { ChatSection } from "@/components/ChatSection";
import { FloatingTokens } from "@/components/FloatingTokens";
import { UserStats } from "@/components/UserStats";
import { HeaderRow } from "@/components/HeaderRow";
import { SunburstBackground } from "@/components/SunburstBackground";
import { AudioControls } from "@/components/AudioControls";
import { pastDraws, chatMessages, totalPotAmount } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { ThirdRow } from "@/components/ThirdRow";
import { useState } from "react";

interface Deposit {
  id: string;
  user: string;
  token: string;
  amount: number;
  timestamp: Date;
}


export default function Home() {
  // State for current round deposits - shared between donut chart and deposits table
  const [currentRoundDeposits, setCurrentRoundDeposits] = useState<Deposit[]>([]);
  
  // Calculate total from current round deposits
  const total = currentRoundDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);

  return (
    <main className="h-screen w-screen relative overflow-hidden">
      {/* Grid Background */}
      <SunburstBackground /> 

      <FloatingTokens />

      <div className="w-full h-full grid grid-rows-[auto_1fr_auto] gap-1 p-2">
        {/* Row 1: UserStats */}
        <HeaderRow />

        {/* Row 2: Main content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full h-full min-h-0 py-2">
          {/* Left Column - Split into two cards */}
          <div className="md:col-span-1 h-full flex flex-col gap-2">
            {/* Top Card: Current Deposits */}
            <div className="flex-1 min-h-[50%]">
              <CurrentDeposits 
                deposits={currentRoundDeposits}
                onDepositsChange={setCurrentRoundDeposits}
              />
            </div>
            
            {/* Bottom Card: Past Draws */}
            <div className="flex-1 min-h-[40%]">
              <PastDraws draws={pastDraws} />
            </div>
          </div>
          
          {/* Center Column */}
          <div className="md:col-span-2 w-full max-w-full min-w-0 h-full flex flex-col">
            <JackpotDonutChart
              deposits={currentRoundDeposits}
              totalAmount={total}
              simulateData={true}
              onDepositsChange={setCurrentRoundDeposits}
            />
          </div>
          
          {/* Right Column */}
          <div className="md:col-span-1 w-full max-w-full min-w-0 overflow-hidden h-full flex flex-col">
            <ChatSection messages={chatMessages} />
          </div>
        </div>

        {/* Row 3 User Stats */}
        <ThirdRow />

        {/* Row 3: Footer */}
        {/* <footer className="text-center text-sm neon-text-pink pb-4 pt-2 mt-2">
          <p>© 2025 JACKPOT. All rights reserved.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="#" className="hover:text-[#00ffff] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#00ffff] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#00ffff] transition-colors">FAQ</a>
          </div>
        </footer> */}
      </div>

      {/* Audio Controls - Fixed position in bottom right */}
      {/* <AudioControls /> */}
    </main>
  );
}
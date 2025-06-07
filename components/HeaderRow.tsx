"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useState, useEffect } from "react";
import { Header } from "./Header";

export function HeaderRow() {
  const [totalDeposits, setTotalDeposits] = useState(7961280);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalDeposits(prev => prev + Math.floor(Math.random() * (1000 - 100) + 100));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
      {/* Total Deposits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 * 0.1 }}
      >
        <Card className="casino-box casino-box-gold overflow-hidden h-28 flex flex-col">
          <CardContent className="bg-gradient-to-b from-[#4A0E4E] to-[#2D0A30] p-2 flex-1 flex flex-col justify-center items-center">
            <p className="text-l sm:text-xl md:text-2xl lg:text-3xl uppercase font-bold text-center tracking-wider casino-text-yellow mb-2"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Total Deposits
            </p>
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black casino-text-gold flex items-center"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              $<SlidingNumber value={totalDeposits} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header - spans 2 columns in the middle */}
      <div className="col-span-2 flex items-center justify-center h-14 relative z-50">
        <Header />
      </div>

      {/* Largest Win */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3 * 0.1 }}
      >
        <Card className="casino-box casino-box-gold overflow-hidden h-28 flex flex-col">
          <CardContent className="bg-gradient-to-b from-[#4A0E4E] to-[#2D0A30] p-2 flex-1 flex flex-col justify-center items-center">
            <p className="text-l sm:text-xl md:text-2xl lg:text-3xl uppercase font-bold text-center tracking-wider casino-text-yellow mb-2"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Largest Win
            </p>
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black casino-text-gold flex items-center"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              $<SlidingNumber value={28400} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
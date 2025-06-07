"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useState, useEffect } from "react";

export function UserStats() {
  const [totalDeposits, setTotalDeposits] = useState(7961280);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalDeposits(prev => prev + Math.floor(Math.random() * (1000 - 100) + 100));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Total Deposits", value: totalDeposits, prefix: "$" },
    { label: "Winners", value: 384, prefix: "" },
    { label: "Average Pot", value: 1250, prefix: "$" },
    { label: "Largest Win", value: 28400, prefix: "$" }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="casino-box casino-box-gold overflow-hidden h-28 flex flex-col">
            {/* Single content area with both label and value */}
            <CardContent className="bg-gradient-to-b from-[#4A0E4E] to-[#2D0A30] p-2 flex-1 flex flex-col justify-center items-center">
              {/* Larger label text */}
              <p className="text-l sm:text-xl md:text-2xl lg:text-3xl uppercase font-bold text-center tracking-wider casino-text-yellow mb-2" 
                 style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                {stat.label}
              </p>
              
              {/* Larger value numbers */}
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black casino-text-gold flex items-center" 
                   style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                {stat.prefix}<SlidingNumber value={stat.value} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
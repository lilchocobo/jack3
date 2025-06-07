"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CircleDollarSignIcon, Dice5Icon, TrendingUpIcon, ShieldIcon, Star } from "lucide-react";

interface TokenInfoItem {
  name: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

export function TokenInfo() {
  const tokenInfoItems: TokenInfoItem[] = [
    { 
      name: "Token", 
      value: "$JACKPOT", 
      description: "Lottery governance token", 
      icon: <CircleDollarSignIcon className="h-4 w-4" />
    },
    { 
      name: "Odds", 
      value: "1:500", 
      description: "For every 500 tickets, 1 winner", 
      icon: <Dice5Icon className="h-4 w-4" />
    },
    { 
      name: "Price", 
      value: "$0.028", 
      description: "+15.4% in last 24h", 
      icon: <TrendingUpIcon className="h-4 w-4" />
    },
    { 
      name: "Security", 
      value: "Audited", 
      description: "By OtterSec & Halborn", 
      icon: <ShieldIcon className="h-4 w-4" />
    },
  ];

  return (
    <div className="h-full w-full">
      <Card className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative">
        {/* Corner stars */}
        <div className="absolute top-2 left-2 z-10">
          <Star className="h-4 w-4 casino-star" fill="currentColor" />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Star className="h-4 w-4 casino-star" fill="currentColor" />
        </div>
        
        <CardContent className="p-4 flex-1 min-w-0">
          {/* Title integrated into content - matching deposits style */}
          <h2 className="text-xl font-black uppercase text-center tracking-wide mb-4 casino-text-gold truncate" 
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            Tokenomics
          </h2>
          
          <div className="grid grid-rows-4 gap-2 h-full min-w-0">
            {tokenInfoItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-2 border-[#FFD700] rounded-xl bg-gradient-to-r from-[#4A0E4E] to-[#2D0A30] p-2 flex flex-col relative overflow-hidden min-w-0"
                style={{ boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)" }}
              >
                <div className="absolute top-1 right-1">
                  <Star className="h-3 w-3 casino-star" fill="currentColor" />
                </div>
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  <div className="casino-text-gold flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="font-bold casino-text-white truncate text-sm" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>{item.name}</span>
                </div>
                <div className="font-bold casino-text-gold truncate text-sm" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>{item.value}</div>
                <div className="text-xs casino-text-yellow font-semibold truncate">{item.description}</div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
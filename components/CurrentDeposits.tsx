"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Activity } from "lucide-react";

interface Deposit {
  id: string;
  user: string;
  token: string;
  amount: number;
  timestamp: Date;
}

interface CurrentDepositsProps {
  deposits: Deposit[];
  onDepositsChange?: (deposits: Deposit[]) => void;
}

const casinoColors = ['#FF69B4', '#FF1493', '#FF8C00', '#FFD700', '#FFFF00', '#00FFFF', '#9932CC', '#32CD32'];

export function CurrentDeposits({ deposits }: CurrentDepositsProps) {
  // Reverse deposits so latest appears at the top
  const reversedDeposits = [...deposits].reverse();

  return (
    <Card className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative max-h-[500px]">
      {/* Corner stars */}
      <div className="absolute top-2 left-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      <div className="absolute top-2 right-2 z-10">
        <Star className="h-4 w-4 casino-star" fill="currentColor" />
      </div>
      
      <CardContent className="p-4 h-full flex flex-col min-w-0">
        {/* Title */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-5 w-5 casino-text-gold" />
            <h2 className="text-xl font-black uppercase text-center tracking-wide casino-text-gold truncate" 
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Current Round
            </h2>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              <Activity className="h-5 w-5 casino-text-pink" />
            </motion.div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-2 mb-3 px-2 flex-shrink-0">
          <div className="col-span-5">
            <span className="text-sm font-black uppercase casino-text-yellow"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              User
            </span>
          </div>
          <div className="col-span-3">
            <span className="text-sm font-black uppercase casino-text-yellow text-center"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Token
            </span>
          </div>
          <div className="col-span-4">
            <span className="text-sm font-black uppercase casino-text-yellow text-right"
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Amount
            </span>
          </div>
        </div>
        
        {/* Deposits List - Fixed height with scroll */}
        <div className="flex-1 overflow-hidden min-w-0 min-h-0">
          <ScrollArea className="h-full custom-scrollbar">
            <div className="space-y-1 pr-2">
              <AnimatePresence mode="popLayout">
                {reversedDeposits.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <motion.div
                        animate={{
                          rotate: 360
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <Activity className="h-8 w-8 casino-text-gold" />
                      </motion.div>
                      <span className="text-sm casino-text-gold font-bold">
                        Waiting for deposits...
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  reversedDeposits.map((deposit, i) => {
                    // Calculate index for color based on original position
                    const originalIndex = deposits.findIndex(d => d.id === deposit.id);
                    
                    return (
                      <motion.div
                        key={deposit.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 200,
                            damping: 20
                          }
                        }}
                        exit={{ 
                          opacity: 0, 
                          x: 20, 
                          scale: 0.8,
                          transition: {
                            duration: 0.3
                          }
                        }}
                        layout
                        className="py-1 px-2 rounded-xl overflow-hidden relative"
                        style={{
                          background: originalIndex % 2 === 0
                            ? 'linear-gradient(to right, #4A0E4E, #2D0A30)'
                            : 'linear-gradient(to right, #3A0A3E, #1D051A)',
                          borderRadius: '12px',
                          border: i === 0 ? '1px solid rgba(255, 215, 0, 0.6)' : '1px solid rgba(255, 215, 0, 0.2)'
                        }}
                      >
                        {/* Special glow for newest deposit */}
                        {i === 0 && (
                          <motion.div
                            initial={{ opacity: 0.8 }}
                            animate={{ 
                              opacity: [0.8, 0.3, 0.8],
                              boxShadow: [
                                '0 0 0px rgba(255, 215, 0, 0)',
                                '0 0 15px rgba(255, 215, 0, 0.8)',
                                '0 0 0px rgba(255, 215, 0, 0)'
                              ]
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: 3
                            }}
                            className="absolute inset-0 rounded-xl"
                          />
                        )}
                        
                        <div className="grid grid-cols-12 gap-2 items-center relative z-10">
                          {/* User */}
                          <div className="col-span-5 flex items-center">
                            <motion.div
                              className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
                              style={{
                                background: casinoColors[originalIndex % casinoColors.length]
                              }}
                              animate={i === 0 ? {
                                scale: [1, 1.3, 1],
                                boxShadow: [
                                  `0 0 0px ${casinoColors[originalIndex % casinoColors.length]}`,
                                  `0 0 12px ${casinoColors[originalIndex % casinoColors.length]}`,
                                  `0 0 0px ${casinoColors[originalIndex % casinoColors.length]}`
                                ]
                              } : {}}
                              transition={{
                                duration: 1,
                                repeat: i === 0 ? 2 : 0
                              }}
                            />
                            <span className="font-bold casino-text-gold text-sm truncate"
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                              {deposit.user}
                            </span>
                          </div>
                          
                          {/* Token */}
                          <div className="col-span-3 text-center">
                            <span className="font-bold casino-text-yellow text-sm"
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                              {deposit.token}
                            </span>
                          </div>
                          
                          {/* Amount */}
                          <div className="col-span-4 text-right">
                            <motion.span 
                              className="font-bold casino-text-gold text-sm"
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
                              initial={i === 0 ? { scale: 1.2, color: '#FFFF00' } : { scale: 1 }}
                              animate={i === 0 ? { 
                                scale: 1,
                                color: '#FFD700'
                              } : {}}
                              transition={{ 
                                duration: 0.5
                              }}
                            >
                              ${deposit.amount.toFixed(0)}
                            </motion.span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
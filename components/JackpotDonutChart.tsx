'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WalletTokensTable from '@/components/WalletTokensTable';
import { toast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';

// Privy
import {
  useWallets,
  usePrivy,
} from '@privy-io/react-auth';
import { WalletConnect } from './WalletConnect';
import { useAudioContext } from './AudioProvider';

// Add TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: {
      signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
      isPhantom?: boolean;
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */
interface JackpotDonutChartProps {
  deposits: Deposit[];
  totalAmount: number;
  simulateData?: boolean;
  onRoundEnd?: (winner: string, amount: number) => void;
  onNewRound?: () => void;
  onDepositsChange?: (deposits: Deposit[] | ((prevDeposits: Deposit[]) => Deposit[])) => void;
}

interface Deposit {
  id: string;
  user: string;
  token: string;
  amount: number;
  timestamp: Date;
}

interface TokenRow {
  mint: string;
  amount: number;
  decimals: number;
  symbol: string;
  name: string;
  image: string;
  selected?: boolean;
  selectedAmount?: number;
}

interface ChartDataItem {
  value: number;
  color: string;
  deposit?: Deposit;
  isRemaining?: boolean;
}

// Round states
type RoundState = 'active' | 'ending' | 'ended' | 'starting';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;
  
  const data = payload[0].payload as ChartDataItem;
  
  if (data.isRemaining) {
    return (
      <div className="casino-box casino-box-gold p-3 shadow-lg border-2 border-yellow-400 z-[99999] relative">
        <div className="text-center">
          <p className="text-yellow-300 font-bold text-sm\" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            REMAINING CAPACITY
          </p>
          <p className="text-gold-400 text-lg font-black" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            ${data.value.toFixed(0)}
          </p>
        </div>
      </div>
    );
  }
  
  if (!data.deposit) return null;
  
  const timeAgo = Math.floor((Date.now() - data.deposit.timestamp.getTime()) / 1000);
  const timeString = timeAgo < 60 ? `${timeAgo}s ago` : 
                   timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` : 
                   `${Math.floor(timeAgo / 3600)}h ago`;
  
  return (
    <div className="casino-box casino-box-gold p-3 shadow-lg border-2 border-yellow-400 min-w-[200px] z-[99999] relative">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-yellow-300 font-bold text-xs uppercase" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            Deposit
          </span>
          <span className="text-pink-400 font-bold text-xs" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            {timeString}
          </span>
        </div>
        
        <div className="text-center border-t border-yellow-400/30 pt-2">
          <p className="text-gold-400 text-xl font-black" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            ${data.deposit.amount.toFixed(0)}
          </p>
          <p className="text-yellow-300 text-sm font-bold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            {data.deposit.token}
          </p>
        </div>
        
        <div className="border-t border-yellow-400/30 pt-2">
          <p className="text-cyan-300 text-sm font-semibold" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            {data.deposit.user}
          </p>
          <p className="text-gray-400 text-xs" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            ID: {data.deposit.id.slice(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               CONFETTI FUNCTIONS                           */
/* -------------------------------------------------------------------------- */

// Epic jackpot confetti celebration
const triggerJackpotConfetti = () => {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Multiple confetti bursts
  const interval: NodeJS.Timeout = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Gold confetti from left
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFFF00', '#FFA500', '#FF8C00']
    });

    // Pink confetti from right
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FF1493', '#FF69B4', '#DC143C', '#FF6347']
    });

    // Center burst
    confetti({
      ...defaults,
      particleCount: particleCount * 2,
      origin: { x: 0.5, y: 0.3 },
      colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFF00', '#FF69B4']
    });
  }, 250);

  // Initial big burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFF00', '#FF69B4']
  });

  // Side cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FFD700', '#FFFF00', '#FFA500']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#FF1493', '#FF69B4', '#DC143C']
    });
  }, 500);

  // Final celebration burst
  setTimeout(() => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFF00', '#FF69B4', '#32CD32']
    });
  }, 2000);
};

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */
export default function JackpotDonutChart({
  deposits,
  totalAmount,
  simulateData = false,
  onRoundEnd,
  onNewRound,
  onDepositsChange,
}: JackpotDonutChartProps) {
  /* -------------------------------- context ------------------------------ */
  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const connectedWallet = wallets[0];
  const walletAddress = user?.wallet?.address;
  const jackpotAddr = new PublicKey(process.env.NEXT_PUBLIC_JACKPOT_ADDRESS!);
  
  // Audio context
  const { playSound } = useAudioContext();

  /* -------------------------------- state -------------------------------- */
  const [selectedTokens, setSelectedTokens] = useState<TokenRow[]>([]);
  const [depositing, setDepositing] = useState(false);
  
  // Round management state
  const [roundState, setRoundState] = useState<RoundState>('active');
  const [winner, setWinner] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  /* ------------------------ data simulation ------------------------ */
  useEffect(() => {
    if (!simulateData || roundState !== 'active') return;

    // Simulate new deposits coming in every 3-8 seconds during active rounds
    const interval = setInterval(() => {
      const isUserDeposit = Math.random() < 0.2; // 20% chance it's the user
      const newDeposit: Deposit = {
        id: Math.random().toString(36).substr(2, 9),
        user: isUserDeposit ? 'You' : `User${Math.floor(Math.random() * 9999)}`,
        token: Math.random() > 0.7 ? 'USDC' : 'SOL',
        amount: Math.floor(Math.random() * 500) + 50, // $50-$550
        timestamp: new Date(),
      };

      // Update deposits through parent component
      onDepositsChange?.(prevDeposits => [...prevDeposits, newDeposit]);
      
      // 🎵 PLAY AUDIO BASED ON DEPOSIT TYPE
      if (isUserDeposit) {
        playSound('userDeposit');
      } else {
        playSound('deposit');
      }
      
      // Toast notification for new deposit
      toast({
        title: '🎰 New Deposit!',
        description: `${newDeposit.user} deposited $${newDeposit.amount} ${newDeposit.token}`,
        duration: 2000,
      });
    }, Math.random() * 5000 + 3000); // Random interval 3-8 seconds

    return () => clearInterval(interval);
  }, [simulateData, roundState, onDepositsChange, playSound]);

  /* ------------------------ responsive ring sizing ------------------------ */
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartDims, setChartDims] = useState({ inner: 140, outer: 200 });
  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      const r = Math.min(w, h) * 0.48;
      setChartDims({ inner: r * 0.72, outer: r });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ------------------------------ countdown ------------------------------ */
  const [seconds, setSeconds] = useState(54);
  const [newRoundCountdown, setNewRoundCountdown] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      if (roundState === 'active') {
        setSeconds((s) => {
          if (s <= 1) {
            // Round is ending
            setRoundState('ending');
            return 0;
          }
          return s - 1;
        });
      } else if (roundState === 'ended') {
        setNewRoundCountdown((s) => {
          if (s <= 1) {
            // Start new round
            startNewRound();
            return 10;
          }
          return s - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundState]);

  // Handle round ending sequence
  useEffect(() => {
    if (roundState === 'ending') {
      // Simulate winner selection
      setTimeout(() => {
        if (deposits.length > 0) {
          const randomWinner = deposits[Math.floor(Math.random() * deposits.length)];
          setWinner(randomWinner.user);
          setWinAmount(totalAmount);
          
          // 🎵 PLAY WIN SOUND
          playSound('win');
          
          // 🎉 TRIGGER CONFETTI CELEBRATION! 🎉
          triggerJackpotConfetti();
          
          // Call parent callback if provided
          onRoundEnd?.(randomWinner.user, totalAmount);
          
          toast({
            title: '🎉 JACKPOT WINNER! 🎉',
            description: `${randomWinner.user} won $${totalAmount.toFixed(0)}!`,
            duration: 5000,
          });
        }
        
        setRoundState('ended');
      }, 2000); // 2 second delay for dramatic effect
    }
  }, [roundState, deposits, totalAmount, onRoundEnd, playSound]);

  const startNewRound = () => {
    setRoundState('starting');
    
    // Reset all round data
    onDepositsChange?.([]);
    setWinner(null);
    setWinAmount(0);
    setSeconds(54);
    setNewRoundCountdown(10);
    
    // Call parent callback if provided
    onNewRound?.();
    
    toast({
      title: '🎰 NEW ROUND STARTED!',
      description: 'Place your deposits now!',
      duration: 3000,
    });
    
    // Start the new round after a brief moment
    setTimeout(() => {
      setRoundState('active');
    }, 1000);
  };

  /* ------------------------------ chart data ----------------------------- */
  const remainingCap = Math.max(2000 - totalAmount, 0);
  const sorted = [...deposits].sort((a, b) => b.amount - a.amount);

  const chartColors = [
    '#FFD700', '#FF1493', '#FF8C00', '#FFFF00', '#FF69B4',
    '#00FFFF', '#9932CC', '#32CD32', '#FF4500', '#1E90FF',
    '#FF6347', '#8A2BE2', '#00FA9A', '#DC143C', '#40E0D0',
    '#FFA500', '#DA70D6', '#98FB98', '#F0E68C', '#DDA0DD'
  ];
  const bgColor = '#1A0B2E';

  const chartData: ChartDataItem[] = [
    { value: remainingCap, color: bgColor, isRemaining: true },
    ...sorted.map((d, i) => ({
      value: d.amount,
      color: chartColors[i % chartColors.length],
      deposit: d
    })),
  ];

  /* -------------------------------- tx builder --------------------------- */
  const buildTx = async () => {
    if (!walletAddress) throw new Error('Wallet not connected');
    const publicKey = new PublicKey(walletAddress);
    const tx = new Transaction();

    for (const tok of selectedTokens) {
      const amt = tok.selectedAmount ?? 0;
      if (amt <= 0) continue;

      if (tok.mint === 'So11111111111111111111111111111111111111112') {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: jackpotAddr,
            lamports: Math.round(amt * LAMPORTS_PER_SOL),
          }),
        );
      } else {
        const mint = new PublicKey(tok.mint);
        const fromAta = getAssociatedTokenAddressSync(mint, publicKey);
        const toAta = getAssociatedTokenAddressSync(mint, jackpotAddr, true);
        if (!(await connection.getAccountInfo(toAta))) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              toAta,
              jackpotAddr,
              mint,
            ),
          );
        }
        tx.add(
          createTransferInstruction(
            fromAta,
            toAta,
            publicKey,
            BigInt(Math.round(amt * 10 ** tok.decimals)),
          ),
        );
      }
    }

    tx.feePayer = publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return tx;
  };

  const onDeposit = async () => {
    if (!authenticated || !walletAddress || !connectedWallet) {
      return toast({ title: 'Connect wallet', variant: 'destructive' });
    }
    
    if (!selectedTokens.length) {
      return;
    }
    
    if (roundState !== 'active') {
      return toast({ title: 'Round not active', description: 'Wait for the next round to start', variant: 'destructive' });
    }
    
    try {
      setDepositing(true);
      const tx = await buildTx();
      
      if (window.solana && window.solana.signAndSendTransaction) {
        const signature = await window.solana.signAndSendTransaction(tx);
        await connection.confirmTransaction(signature.signature, 'confirmed');
        
        // Add deposits to current round through parent
        const newDeposits = selectedTokens.map(token => ({
          id: Math.random().toString(36).substr(2, 9),
          user: 'You',
          token: token.symbol,
          amount: token.selectedAmount ?? 0,
          timestamp: new Date(),
        }));
        
        onDepositsChange?.(prevDeposits => [...prevDeposits, ...newDeposits]);
        
        // 🎵 PLAY USER DEPOSIT SOUND
        playSound('userDeposit');
        
        toast({ title: 'Deposit successful', description: signature.signature });
      } else {
        throw new Error('Solana wallet not found or does not support signAndSendTransaction');
      }
      
      setSelectedTokens([]);
    } catch (e: any) {
      console.error('Error during deposit:', e);
      toast({
        title: 'Deposit failed',
        description: e?.message ?? '',
        variant: 'destructive',
      });
    } finally {
      setDepositing(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    return `0:${timeInSeconds.toString().padStart(2, '0')}`;
  };

  /* --------------------------------- UI ---------------------------------- */
  return (
    <Card className="casino-box flex flex-col items-center py-6 relative">
      {/* corner stars */}
      <Star className="absolute top-3 left-3 h-4 w-4 text-yellow-300" />
      <Star className="absolute top-3 right-3 h-4 w-4 text-yellow-300" />

      <CardContent className="w-full flex flex-col items-center gap-6">
        {/* ------------------------------- RING ------------------------------ */}
        <div
          ref={containerRef}
          className="relative w-full h-[340px] md:h-[420px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter
                  id="dropShadow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="6"
                    floodColor="#000000"
                    floodOpacity="0.3"
                  />
                </filter>
              </defs>

              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                startAngle={90}
                endAngle={450}
                innerRadius={chartDims.inner}
                outerRadius={chartDims.outer}
                paddingAngle={0.5}
                dataKey="value"
                stroke="#000000"
                strokeWidth={3}
                filter="url(#dropShadow)"
              >
                {chartData.map((slice, i) => (
                  <Cell
                    key={i}
                    fill={slice.color}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* ------------------------- CENTER TEXT ------------------------- */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {roundState === 'active' && (
                <motion.div
                  key="active"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <motion.span
                    key={totalAmount}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="block text-6xl sm:text-7xl md:text-8xl font-extrabold"
                    style={{
                      fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                      color: '#FFD700',
                      textShadow:
                        '3px 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 15px #FFD700, 0 0 25px #FFFF00',
                    }}
                  >
                    ${totalAmount.toFixed(0)}
                  </motion.span>
                  <span
                    className="text-sm uppercase font-bold tracking-wider mt-1"
                    style={{
                      fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                      color: '#FFD700',
                      textShadow: '1px 1px 0 #000000, 0 0 5px #FFD700',
                    }}
                  >
                    Round ends in
                  </span>
                  <span
                    className="text-3xl sm:text-4xl font-extrabold"
                    style={{
                      fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                      color: '#FF1493',
                      textShadow:
                        '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 10px #FF1493, 0 0 20px #FF69B4',
                    }}
                  >
                    {formatTime(seconds)}
                  </span>
                </motion.div>
              )}

              {roundState === 'ending' && (
                <motion.div
                  key="ending"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-4xl sm:text-5xl md:text-6xl font-extrabold"
                    style={{
                      fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                      color: '#FF1493',
                      textShadow:
                        '3px 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 20px #FF1493, 0 0 40px #FF69B4',
                    }}
                  >
                    DRAWING...
                  </motion.div>
                </motion.div>
              )}

              {roundState === 'ended' && winner && (
                <motion.div
                  key="ended"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <div
                      className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2"
                      style={{
                        fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                        color: '#FFD700',
                        textShadow:
                          '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 15px #FFD700',
                      }}
                    >
                      🎉 {winner} WINS! 🎉
                    </div>
                    <div
                      className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2"
                      style={{
                        fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                        color: '#00FFFF',
                        textShadow:
                          '2px 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 15px #00FFFF',
                      }}
                    >
                      ${winAmount.toFixed(0)}
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{
                        fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                        color: '#FF1493',
                        textShadow: '1px 1px 0 #000000, 0 0 5px #FF1493',
                      }}
                    >
                      New round in {newRoundCountdown}s
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {roundState === 'starting' && (
                <motion.div
                  key="starting"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ 
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold"
                    style={{
                      fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
                      color: '#00FFFF',
                      textShadow:
                        '3px 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 0 0 20px #00FFFF, 0 0 40px #00FFFF',
                    }}
                  >
                    NEW ROUND!
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
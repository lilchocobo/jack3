/* components/WalletTokensTable.tsx */
'use client';

import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ArrowLeftRight, Star, Edit, Check, X } from 'lucide-react';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import useSWR from 'swr';

/* ---------- env ---------- */
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC!;
const API_KEY = RPC_ENDPOINT.split('api-key=')[1] ?? '';

/* ---------- TypeScript Interfaces ---------- */
interface JupiterBalance {
  amount: string;
  uiAmount: number;
  slot: number;
  isFrozen: boolean;
}

interface JupiterBalanceResponse {
  [mintAddress: string]: JupiterBalance;
}

interface TokenMetadata {
  symbol: string;
  name: string;
  image: string;
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

interface HeliusAsset {
  id: string;
  token_info?: {
    symbol?: string;
    decimals?: number;
  };
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
    links?: {
      image?: string;
    };
    files?: Array<{
      cdn_uri?: string;
      uri?: string;
    }>;
  };
}

/* ---------- Custom Hook for Token Data ---------- */
function useTokenBalances(publicKey: string | undefined) {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setTokens([]);
      setLoading(false);
      return;
    }

    const fetchTokenData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1️⃣ Fetch balances from Jupiter API
        const balanceResponse = await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${publicKey}`);
        if (!balanceResponse.ok) {
          throw new Error('Failed to fetch balances');
        }
        const balances: JupiterBalanceResponse = await balanceResponse.json();

        // 2️⃣ Extract non-zero balances and prepare for metadata fetch
        const nonZeroTokens = Object.entries(balances).filter(([_, balance]: [string, JupiterBalance]) => 
          balance.uiAmount > 0
        );

        if (nonZeroTokens.length === 0) {
          setTokens([]);
          setLoading(false);
          return;
        }

        // 3️⃣ Get token mints (excluding SOL which we'll handle separately)
        const tokenMints = nonZeroTokens
          .filter(([mint]) => mint !== 'SOL')
          .map(([mint]) => mint);

        // 4️⃣ Fetch metadata in chunks
        const metadataMap: Record<string, TokenMetadata> = {};
        
        if (tokenMints.length > 0) {
          const chunks: string[][] = [];
          for (let i = 0; i < tokenMints.length; i += 100) {
            chunks.push(tokenMints.slice(i, i + 100));
          }

          await Promise.all(
            chunks.map(async (mintChunk) => {
              try {
                const body = {
                  jsonrpc: '2.0',
                  id: 'asset-batch',
                  method: 'getAssetBatch',
                  params: { ids: mintChunk },
                };
                
                const response = await fetch(RPC_ENDPOINT, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                
                const { result } = await response.json();
                
                result?.forEach((asset: HeliusAsset) => {
                  if (asset) {
                    metadataMap[asset.id] = extractMetadata(asset);
                  }
                });
              } catch (chunkError) {
                console.warn('Failed to fetch metadata chunk:', chunkError);
              }
            })
          );
        }

        // 5️⃣ Build final token array
        const tokenRows: TokenRow[] = nonZeroTokens.map(([mint, balance]) => {
          if (mint === 'SOL') {
            return {
              mint: 'So11111111111111111111111111111111111111112',
              amount: balance.uiAmount,
              decimals: 9,
              symbol: 'SOL',
              name: 'Solana',
              image: 'https://solana.com/src/img/branding/solanaLogoMark.png',
            };
          }

          const metadata = metadataMap[mint] || {
            symbol: mint.slice(0, 4),
            name: mint.slice(0, 8),
            image: '/solana-logo.png',
          };

          return {
            mint,
            amount: balance.uiAmount,
            decimals: getTokenDecimals(mint), // You might want to fetch this from the metadata
            ...metadata,
          };
        });

        // Sort by amount (highest first)
        tokenRows.sort((a, b) => b.amount - a.amount);
        setTokens(tokenRows);

      } catch (err) {
        console.error('Token fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [publicKey]);

  return { tokens, loading, error };
}

/* ---------- Helper Functions ---------- */
function extractMetadata(asset: HeliusAsset): TokenMetadata {
  const symbol = 
    asset.token_info?.symbol ||
    asset.content?.metadata?.symbol ||
    asset.id.slice(0, 4);

  const name = 
    asset.content?.metadata?.name ||
    symbol;

  const image = 
    asset.content?.links?.image ||
    asset.content?.files?.[0]?.cdn_uri ||
    asset.content?.files?.[0]?.uri ||
    '/solana-logo.png';

  return { symbol, name, image };
}

function getTokenDecimals(mint: string): number {
  // Common token decimals - you might want to fetch this from metadata or keep a map
  const commonDecimals: Record<string, number> = {
    'So11111111111111111111111111111111111111112': 9, // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  };
  
  return commonDecimals[mint] || 6; // Default to 6 decimals
}

interface SelectedTokensTableProps {
  selectedTokens: TokenRow[];
  onRemoveToken: (mint: string) => void;
  onUpdateAmount: (mint: string, amount: number) => void;
  expandedToken: string | null;
  setExpandedToken: (mint: string | null) => void;
}

function SelectedTokensTable({ 
  selectedTokens, 
  onRemoveToken, 
  onUpdateAmount, 
  expandedToken, 
  setExpandedToken 
}: SelectedTokensTableProps) {
  const [tempAmounts, setTempAmounts] = useState<Record<string, number>>({});

  if (selectedTokens.length === 0) return null;

  const toggleExpanded = (mint: string) => {
    if (expandedToken === mint) {
      // Close current expanded token
      setExpandedToken(null);
      // Reset temp amount when collapsing
      const newTempAmounts = { ...tempAmounts };
      delete newTempAmounts[mint];
      setTempAmounts(newTempAmounts);
    } else {
      // Close any other expanded token and open this one
      setExpandedToken(mint);
      // Initialize temp amount with current selected amount
      const token = selectedTokens.find(t => t.mint === mint);
      if (token) {
        setTempAmounts(prev => ({
          ...prev,
          [mint]: token.selectedAmount ?? token.amount
        }));
      }
    }
  };

  const handleTempAmountChange = (mint: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const token = selectedTokens.find(t => t.mint === mint);
    if (!token) return;
    
    const maxAmount = token.amount;
    const clampedValue = Math.min(Math.max(0, numValue), maxAmount);
    setTempAmounts(prev => ({
      ...prev,
      [mint]: clampedValue
    }));
  };

  const handleTempSliderChange = (mint: string, value: number) => {
    const token = selectedTokens.find(t => t.mint === mint);
    if (!token) return;
    
    const maxAmount = token.amount;
    const percentage = value / maxAmount;
    
    // Define snap thresholds (within 1% of target)
    const snapThreshold = 0.01;
    const snapPoints = [0, 0.25, 0.5, 0.75, 1.0];
    
    // Find the closest snap point
    let snappedPercentage = percentage;
    for (const snapPoint of snapPoints) {
      if (Math.abs(percentage - snapPoint) <= snapThreshold) {
        snappedPercentage = snapPoint;
        break;
      }
    }
    
    const snappedValue = snappedPercentage * maxAmount;
    setTempAmounts(prev => ({
      ...prev,
      [mint]: snappedValue
    }));
  };

  const handleConfirm = (mint: string) => {
    const tempAmount = tempAmounts[mint];
    if (tempAmount !== undefined) {
      if (tempAmount === 0) {
        // Remove token if amount is 0
        onRemoveToken(mint);
        setExpandedToken(null);
      } else {
        // Update amount and collapse
        onUpdateAmount(mint, tempAmount);
        setExpandedToken(null);
      }
      // Clear temp amount
      setTempAmounts(prev => {
        const newTempAmounts = { ...prev };
        delete newTempAmounts[mint];
        return newTempAmounts;
      });
    }
  };

  const formatAmount = (amount: number, decimals: number) => {
    // Handle zero explicitly
    if (amount === 0) return '0';
    
    if (amount < 0.000001) {
      return amount.toExponential(Math.min(decimals, 3));
    }
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: Math.min(decimals, 6),
      minimumFractionDigits: 0,
    });
  };

  return (
    <div className="w-full mb-4 overflow-hidden rounded-lg casino-box casino-box-gold">
      {/* Header matching deposits style */}
      <div className="px-4 py-3">
        <h3 className="text-lg font-black uppercase text-center tracking-wide casino-text-gold" 
            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
          Selected Tokens
        </h3>
      </div>

      <ScrollArea className="max-h-[500px] custom-scrollbar">
        <div className="space-y-2 px-4 pb-4">
          <AnimatePresence>
            {selectedTokens.map((token, i) => {
              const isExpanded = expandedToken === token.mint;
              const tempAmount = tempAmounts[token.mint];
              const displayAmount = tempAmount !== undefined ? tempAmount : (token.selectedAmount ?? token.amount);
              const isZeroAmount = tempAmount === 0;
              
              return (
                <motion.div
                  key={token.mint}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-2 border-[#FFD700] rounded-xl bg-gradient-to-r from-[#4A0E4E] to-[#2D0A30] overflow-hidden"
                  style={{ boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)" }}
                >
                  {/* Collapsed Header - Always Visible */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6">
                        <Image
                          src={token.image}
                          alt={token.symbol}
                          fill
                          className="rounded-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).src = '/solana-logo.png')}
                        />
                      </div>
                      <div>
                        <span className="font-black casino-text-gold text-base" 
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {token.symbol}
                        </span>
                        <div className="text-xs casino-text-yellow font-bold">
                          Selected: {formatAmount(isExpanded ? displayAmount : (token.selectedAmount ?? token.amount), token.decimals)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(token.mint)}
                        className="casino-text-gold hover:text-[#FFFF00] hover:bg-[#FFD70020] border border-[#FFD700] hover:border-[#FFFF00] p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveToken(token.mint);
                        }}
                        className="casino-text-pink hover:text-[#FF1493] hover:bg-[#FF149320] border border-[#FF1493] hover:border-[#FF1493] p-2"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Content - Amount Selection */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t-2 border-[#FFD700] p-4 space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 casino-text-gold" />
                        <span className="text-sm font-black casino-text-yellow" 
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          Select Amount
                        </span>
                      </div>
                      
                      {/* Enhanced Slider with very visible track */}
                      <div className="px-2 py-2">
                        <div className="relative">
                          {/* Custom background track that's always visible */}
                          <div 
                            className="absolute top-1/2 left-0 right-0 h-3 bg-gradient-to-r from-[#FFD700] to-[#FFFF00] rounded-full border-2 border-[#000000] transform -translate-y-1/2"
                            style={{
                              boxShadow: `
                                inset 0 2px 4px rgba(0, 0, 0, 0.5),
                                0 0 8px rgba(255, 215, 0, 0.6)
                              `
                            }}
                          />
                          
                          {/* Snap point indicators */}
                          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-1">
                            {[0, 25, 50, 75, 100].map((percent) => (
                              <div
                                key={percent}
                                className="w-2 h-2 bg-[#000000] border border-[#FFD700] rounded-full"
                                style={{
                                  boxShadow: '0 0 4px rgba(255, 215, 0, 0.8)'
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Actual slider on top */}
                          <Slider
                            value={[displayAmount]}
                            min={0}
                            max={token.amount}
                            step={1 / Math.pow(10, Math.min(token.decimals, 6))}
                            onValueChange={([value]) => handleTempSliderChange(token.mint, value)}
                            className="relative z-10 custom-slider"
                          />
                        </div>
                        
                        {/* Percentage markers instead of range indicators */}
                        <div className="flex justify-between text-xs casino-text-yellow font-bold mt-2 px-1">
                          <span>0</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      {/* Amount Input and Range Display */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Input
                            type="number"
                            value={displayAmount.toFixed(Math.min(token.decimals, 6))}
                            onChange={(e) => handleTempAmountChange(token.mint, e.target.value)}
                            min={0}
                            max={token.amount}
                            step={1 / Math.pow(10, Math.min(token.decimals, 6))}
                            className="text-center font-black casino-input text-sm" 
                            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black casino-text-gold" 
                               style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                            {formatAmount(displayAmount, token.decimals)}
                          </div>
                          <div className="text-xs casino-text-yellow font-bold">Selected</div>
                        </div>
                      </div>

                      {/* Confirm/Remove Button */}
                      <div className="flex justify-center pt-2">
                        <Button
                          onClick={() => handleConfirm(token.mint)}
                          className={`px-6 py-2 font-black uppercase transition-all duration-200 ${
                            isZeroAmount
                              ? 'bg-gradient-to-r from-[#FF1493] to-[#DC143C] hover:from-[#DC143C] hover:to-[#B91C1C] border-2 border-[#FF1493] casino-text-white'
                              : 'casino-button border-2 border-[#FFD700]'
                          }`}
                          style={{ 
                            fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                            boxShadow: isZeroAmount 
                              ? '0 0 15px rgba(255, 20, 147, 0.6)' 
                              : '0 0 15px rgba(255, 215, 0, 0.6)'
                          }}
                        >
                          {isZeroAmount ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Remove Token
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Confirm Amount
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Enhanced slider styles with highly visible track */}
      <style jsx>{`
        :global(.custom-slider [data-radix-slider-track]) {
          background: transparent;
          height: 16px;
          position: relative;
        }
        
        :global(.custom-slider [data-radix-slider-range]) {
          background: linear-gradient(90deg, #FFD700, #FFFF00);
          height: 16px;
          border-radius: 8px;
          box-shadow: 
            0 0 12px rgba(255, 215, 0, 0.9),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3);
          border: 2px solid #000000;
          position: relative;
        }
        
        :global(.custom-slider [data-radix-slider-thumb]) {
          width: 28px;
          height: 28px;
          background: linear-gradient(145deg, #FFD700, #DAA520);
          border: 4px solid #FFFF00;
          border-radius: 50%;
          box-shadow: 
            0 0 0 3px #000000,
            0 0 20px rgba(255, 215, 0, 1),
            0 6px 12px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 20;
        }
        
        :global(.custom-slider [data-radix-slider-thumb]:hover) {
          background: linear-gradient(145deg, #FFFF00, #FFD700);
          transform: scale(1.2);
          box-shadow: 
            0 0 0 3px #000000,
            0 0 25px rgba(255, 215, 0, 1),
            0 8px 16px rgba(0, 0, 0, 0.5);
        }
        
        :global(.custom-slider [data-radix-slider-thumb]:focus) {
          outline: none;
          background: linear-gradient(145deg, #FFFF00, #FFD700);
          transform: scale(1.2);
        }
        
        :global(.custom-slider) {
          width: 100%;
          height: 28px;
          display: flex;
          align-items: center;
          position: relative;
        }
      `}</style>
    </div>
  );
}

interface WalletTokensTableProps {
  onTokensSelected: (tokens: TokenRow[]) => void;
}

export default function WalletTokensTable({ onTokensSelected }: WalletTokensTableProps) {
  const [selectedTokens, setSelectedTokens] = useState<TokenRow[]>([]);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const { authenticated, user } = usePrivy();
  const publicKey = user?.wallet?.address;
  
  // Use the new custom hook
  const { tokens: rows, loading, error } = useTokenBalances(publicKey);

  // Filter out selected tokens from the main token list
  const availableTokens = rows.filter(token => 
    !selectedTokens.some(selected => selected.mint === token.mint)
  );

  const handleSelectToken = (token: TokenRow) => {
    const newSelectedTokens = [...selectedTokens, { ...token, selected: true, selectedAmount: token.amount }];
    setSelectedTokens(newSelectedTokens);
    onTokensSelected(newSelectedTokens);
    
    // Automatically expand the newly added token for editing
    setExpandedToken(token.mint);
  };

  const handleSelectAll = () => {
    // Exclude SOL (native Solana) from select all
    const tokensToSelect = availableTokens.filter(token => 
      token.mint !== 'So11111111111111111111111111111111111111112'
    );
    
    const newSelectedTokens = [
      ...selectedTokens, 
      ...tokensToSelect.map(token => ({ ...token, selected: true, selectedAmount: token.amount }))
    ];
    setSelectedTokens(newSelectedTokens);
    onTokensSelected(newSelectedTokens);
  };

  const handleRemoveToken = (mint: string) => {
    const newSelectedTokens = selectedTokens.filter(t => t.mint !== mint);
    setSelectedTokens(newSelectedTokens);
    onTokensSelected(newSelectedTokens);
    
    // Close expanded state if removing the currently expanded token
    if (expandedToken === mint) {
      setExpandedToken(null);
    }
  };

  const handleUpdateAmount = (mint: string, amount: number) => {
    const newSelectedTokens = selectedTokens.map(t => 
      t.mint === mint ? { ...t, selectedAmount: amount } : t
    );
    setSelectedTokens(newSelectedTokens);
    onTokensSelected(newSelectedTokens);
  };

  const formatAmount = (amount: number, decimals: number) => {
    if (amount === 0) return '0';
    if (amount < 0.000001) {
      return amount.toExponential(Math.min(decimals, 3));
    }
    return amount.toLocaleString(undefined, {
      maximumFractionDigits: Math.min(decimals, 6),
      minimumFractionDigits: 0,
    });
  };

  if (!publicKey) return null;

  // Check if there are non-SOL tokens available for select all
  const hasNonSolTokens = availableTokens.some(token => 
    token.mint !== 'So11111111111111111111111111111111111111112'
  );

  /* ---------- UI ---------- */
  return (
    <>
      {/* Your Tokens Table */}
      <div className="w-full mb-4 overflow-hidden rounded-lg casino-box casino-box-gold">
        {/* Header matching deposits style */}
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black uppercase text-center tracking-wide casino-text-gold flex-1" 
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Your Tokens
            </h3>
            {hasNonSolTokens && (
              <Button
                onClick={handleSelectAll}
                className="casino-button text-xs px-3 py-1 font-black uppercase"
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
              >
                Select All
              </Button>
            )}
          </div>
          
          {/* Column Headers - matching deposits style */}
          <div className="grid grid-cols-12 gap-2 mb-3 px-2">
            <div className="col-span-5">
              <span className="text-sm font-black uppercase casino-text-yellow" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                Token
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-sm font-black uppercase casino-text-yellow text-center" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                Balance
              </span>
            </div>
            <div className="col-span-3">
              <span className="text-sm font-black uppercase casino-text-yellow text-right" 
                    style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                Action
              </span>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[200px] custom-scrollbar">
          <div className="space-y-1 px-4 pb-4">
            {loading ? (
              <div className="text-center py-8">
                <span className="text-sm casino-text-gold font-bold">Loading tokens...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <span className="text-sm text-red-400 font-bold">Error: {error}</span>
              </div>
            ) : availableTokens.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-sm casino-text-gold font-bold">
                  {selectedTokens.length > 0 ? "All tokens selected" : "No tokens found"}
                </span>
              </div>
            ) : (
              <AnimatePresence>
                {availableTokens.map((t, i) => (
                  <motion.div
                    key={t.mint}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="py-2 px-2 rounded-xl overflow-hidden"
                    style={{
                      background: i % 2 === 0 
                        ? 'linear-gradient(to right, #4A0E4E, #2D0A30)' 
                        : 'linear-gradient(to right, #3A0A3E, #1D051A)',
                      borderRadius: '12px'
                    }}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Token */}
                      <div className="col-span-5 flex items-center">
                        <div className="relative w-6 h-6 mr-2">
                          <Image
                            src={t.image}
                            alt={t.symbol}
                            fill
                            className="rounded-full object-cover"
                            onError={(e) =>
                              ((e.target as HTMLImageElement).src =
                                '/solana-logo.png')
                            }
                          />
                        </div>
                        <span className="font-bold casino-text-gold text-sm" 
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {t.symbol}
                        </span>
                      </div>
                      
                      {/* Balance */}
                      <div className="col-span-4 text-center">
                        <span className="font-bold casino-text-yellow text-sm" 
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {formatAmount(t.amount, t.decimals)}
                        </span>
                      </div>
                      
                      {/* Action */}
                      <div className="col-span-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectToken(t)}
                          className="casino-text-gold hover:text-[#FFFF00] hover:bg-[#FFD70020] border border-[#FFD700] p-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Tokens Table - Now below the main tokens table */}
      <SelectedTokensTable
        selectedTokens={selectedTokens}
        onRemoveToken={handleRemoveToken}
        onUpdateAmount={handleUpdateAmount}
        expandedToken={expandedToken}
        setExpandedToken={setExpandedToken}
      />
    </>
  );
}

const fetcher = (url: string) => fetch(url, {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
}).then(res => {
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
});

export function useWalletBalances() {
  const { authenticated, user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  const { data, error } = useSWR(
    authenticated && walletAddress ? `https://lite-api.jup.ag/ultra/v1/balances/${walletAddress}` : null,
    fetcher
  );

  const balanceMessage = data ? Object.entries(data as JupiterBalanceResponse).reduce((message, [token, balance]) => {
    if (balance.amount !== "0") {
      message += `${token}: ${balance.uiAmount.toFixed(4)}\n`;
    }
    return message;
  }, 'Wallet Balance:\n\n') : null;

  return { balanceMessage, error: error ? 'Error fetching wallet balances' : null };
}
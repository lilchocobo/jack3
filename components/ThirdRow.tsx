"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Minus, Star, Coins, ArrowRight, Zap, X, Wallet } from "lucide-react";
import Image from "next/image";
import { usePrivy } from '@privy-io/react-auth';
import { WalletConnect } from './WalletConnect';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { toast } from '@/hooks/use-toast';
import { jackpotAddr } from "@/lib/constants";

// Types
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

// Custom hook for token balances
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

        // Fetch balances from Jupiter API
        const balanceResponse = await fetch(`https://lite-api.jup.ag/ultra/v1/balances/${publicKey}`);
        if (!balanceResponse.ok) {
          throw new Error('Failed to fetch balances');
        }
        const balances: JupiterBalanceResponse = await balanceResponse.json();

        // Extract non-zero balances
        const nonZeroTokens = Object.entries(balances).filter(([_, balance]: [string, JupiterBalance]) => 
          balance.uiAmount > 0
        );

        if (nonZeroTokens.length === 0) {
          setTokens([]);
          setLoading(false);
          return;
        }

        // Get token mints (excluding SOL)
        const tokenMints = nonZeroTokens
          .filter(([mint]) => mint !== 'SOL')
          .map(([mint]) => mint);

        // Fetch metadata
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
                
                const response = await fetch(process.env.NEXT_PUBLIC_HELIUS_RPC!, {
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

        // Build final token array
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
            decimals: getTokenDecimals(mint),
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

// Helper functions
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
  const commonDecimals: Record<string, number> = {
    'So11111111111111111111111111111111111111112': 9, // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
  };
  
  return commonDecimals[mint] || 6;
}

function formatAmount(amount: number, decimals: number) {
  if (amount === 0) return '0';
  if (amount < 0.000001) {
    return amount.toExponential(Math.min(decimals, 3));
  }
  return amount.toLocaleString(undefined, {
    maximumFractionDigits: Math.min(decimals, 6),
    minimumFractionDigits: 0,
  });
}

export function ThirdRow() {
  const { authenticated, user, logout } = usePrivy();
  const publicKey = user?.wallet?.address;
  const { tokens, loading, error } = useTokenBalances(publicKey);
  
  // FIXED: Only selectedTokens (plural) - no more selectedToken (singular)
  const [selectedTokens, setSelectedTokens] = useState<TokenRow[]>([]);
  const [editingToken, setEditingToken] = useState<string | null>(null); // Which token we're editing amount for
  const [tempAmount, setTempAmount] = useState(0);
  const [depositing, setDepositing] = useState(false);

  const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
  
  console.log({jackpotAddr});

  // Add a token to selection (with default 50% amount)
  const handleAddToken = (token: TokenRow) => {
    const alreadySelected = selectedTokens.find(t => t.mint === token.mint);
    if (alreadySelected) return; // Already selected
    
    const newToken = { ...token, selectedAmount: token.amount * 0.5 }; // Default 50%
    setSelectedTokens([...selectedTokens, newToken]);
  };

  // Remove a token from selection
  const handleRemoveToken = (mint: string) => {
    setSelectedTokens(selectedTokens.filter(t => t.mint !== mint));
    if (editingToken === mint) {
      setEditingToken(null);
    }
  };

  // Start editing a token's amount
  const handleEditAmount = (mint: string) => {
    const token = selectedTokens.find(t => t.mint === mint);
    if (token) {
      setEditingToken(mint);
      setTempAmount(token.selectedAmount || token.amount);
    }
  };

  // Update amount with percentage
  const handlePercentageAmount = (percentage: number) => {
    if (!editingToken) return;
    
    const token = selectedTokens.find(t => t.mint === editingToken);
    if (token) {
      const newAmount = token.amount * (percentage / 100);
      setTempAmount(newAmount);
    }
  };

  // Confirm the amount change
  const handleConfirmAmount = () => {
    if (!editingToken) return;
    
    const newSelectedTokens = selectedTokens.map(t => 
      t.mint === editingToken ? { ...t, selectedAmount: tempAmount } : t
    );
    setSelectedTokens(newSelectedTokens);
    setEditingToken(null);
  };

  const buildTransaction = async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    const pubKey = new PublicKey(publicKey);
    const tx = new Transaction();

    for (const token of selectedTokens) {
      const amount = token.selectedAmount ?? 0;
      if (amount <= 0) continue;

      if (token.mint === 'So11111111111111111111111111111111111111112') {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: pubKey,
            toPubkey: new PublicKey(jackpotAddr),
            lamports: Math.round(amount * LAMPORTS_PER_SOL),
          }),
        );
      } else {
        const mint = new PublicKey(token.mint);
        const fromAta = getAssociatedTokenAddressSync(mint, pubKey);
        const toAta = getAssociatedTokenAddressSync(mint, new PublicKey(jackpotAddr), true);
        
        if (!(await connection.getAccountInfo(toAta))) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              pubKey,
              toAta,
              new PublicKey(jackpotAddr),
              mint,
            ),
          );
        }
        
        tx.add(
          createTransferInstruction(
            fromAta,
            toAta,
            pubKey,
            BigInt(Math.round(amount * 10 ** token.decimals)),
          ),
        );
      }
    }

    tx.feePayer = pubKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return tx;
  };

  const handleEnterRound = async () => {
    if (!authenticated || !publicKey || selectedTokens.length === 0) {
      toast({ title: 'Please select tokens to deposit', variant: 'destructive' });
      return;
    }

    try {
      setDepositing(true);
      const tx = await buildTransaction();
      
      if (window.solana && window.solana.signAndSendTransaction) {
        const signature = await window.solana.signAndSendTransaction(tx);
        await connection.confirmTransaction(signature.signature, 'confirmed');
        toast({ title: 'Successfully entered the round!', description: signature.signature });
        setSelectedTokens([]);
      } else {
        throw new Error('Solana wallet not found');
      }
    } catch (e: any) {
      console.error('Deposit error:', e);
      toast({
        title: 'Deposit failed',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDepositing(false);
    }
  };

  const totalDepositValue = selectedTokens.reduce((sum, token) => sum + (token.selectedAmount ?? 0), 0);

  console.log({totalDepositValue, selectedTokens});

  // Get available tokens (not already selected)
  const availableTokens = tokens.filter(token => 
    !selectedTokens.some(selected => selected.mint === token.mint)
  );
  

  if (!authenticated) {
    return (
      <div className="flex justify-center items-center p-2">
        <div className="casino-box casino-box-gold p-3 rounded-lg">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 casino-text-gold" />
            <span className="text-sm font-black casino-text-gold" 
                  style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
              Connect Wallet to Play
            </span>
            <div className="ml-2">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Logout Button - Bottom Left */}
      {authenticated && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-4 left-4 z-10"
        >
          <Button
            onClick={logout}
            variant="outline"
            className="casino-box casino-box-gold px-3 py-2 border-2 border-[#FFD700] hover:border-[#FFFF00] hover:bg-[#FFD70015] transition-all duration-200 group"
            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-4 w-4 casino-text-gold rotate-180" />
              </motion.div>
              <span className="text-xs font-black casino-text-gold uppercase">
                Logout
        </span>
            </div>
          </Button>
        </motion.div>
      )}
      
      <div className="flex items-center justify-center gap-4 p-4">
        {/* Centered Token Selection & Enter Button */}
        <div className="flex items-center gap-4">
          {/* Available Tokens - Clean Badge Style */}
        {loading ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Coins className="h-4 w-4 casino-text-gold" />
              </motion.div>
              <span className="text-sm casino-text-yellow font-bold">Loading...</span>
            </div>
        ) : availableTokens.length === 0 ? (
            <span className="text-sm casino-text-yellow font-bold">
              {selectedTokens.length > 0 ? "All tokens selected" : "No tokens available"}
            </span>
        ) : (
            <div className="flex items-center gap-2">
              {availableTokens.slice(0, 6).map((token) => (
            <motion.div
              key={token.mint}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                  className="cursor-pointer"
                onClick={() => handleAddToken(token)}
              >
                  <div className="casino-box casino-box-gold px-3 py-2 rounded-lg border border-[#FFD700] hover:border-[#FFFF00] hover:bg-[#FFD70015] transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6">
                        <Image
                          src={token.image}
                          alt={token.symbol}
                          fill
                          className="rounded-full object-cover"
                          onError={(e) => ((e.target as HTMLImageElement).src = '/solana-logo.png')}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black casino-text-gold leading-none" 
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {token.symbol}
                        </span>
                        <span className="text-[10px] casino-text-yellow opacity-80 leading-none truncate max-w-[60px]" 
                              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                          {formatAmount(token.amount, token.decimals)}
                        </span>
                      </div>
                      <Plus className="h-3 w-3 casino-text-gold opacity-60" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Separator */}
          {availableTokens.length > 0 && (
            <div className="w-px h-8 bg-[#FFD700]/30"></div>
          )}
          
          {/* Selected Tokens Display */}
          {selectedTokens.length > 0 && (
            <>
              <div className="w-px h-8 bg-[#FF1493]/30"></div>
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {selectedTokens.map((token) => (
                    <motion.div
                      key={token.mint}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="casino-box px-3 py-2 rounded-lg border border-[#FF1493] bg-gradient-to-br from-[#FF1493]/20 to-[#DC143C]/20 hover:border-[#FF69B4] transition-all duration-200 group relative"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveToken(token.mint)}
                        className="absolute -top-1 -right-1 text-[#FF69B4] hover:text-red-300 hover:bg-red-500/20 p-1 h-auto w-auto rounded-full bg-black/30"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6">
                    <Image
                      src={token.image}
                      alt={token.symbol}
                      fill
                      className="rounded-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).src = '/solana-logo.png')}
                    />
                  </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white leading-none" 
                                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
                            {token.symbol}
                          </span>
                          <span 
                            className="text-[10px] text-[#FF69B4] cursor-pointer hover:text-yellow-200 font-bold leading-none"
                            onClick={() => handleEditAmount(token.mint)}
                            title="Click to edit amount"
                            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
                          >
                            {formatAmount(token.selectedAmount ?? 0, token.decimals)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                </div>
              <div className="w-px h-8 bg-[#FFD700]/30"></div>
            </>
          )}

          {/* Enter Round Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={handleEnterRound}
              disabled={depositing || selectedTokens.length === 0}
              className="casino-button text-sm font-black uppercase tracking-wider px-6 py-3 border-2 border-[#FFD700] relative overflow-hidden group"
              style={{ 
                fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
                background: 'linear-gradient(145deg, #FFD700, #DAA520)',
                boxShadow: `
                  0 0 20px rgba(255, 215, 0, 0.6),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3)
                `
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <div className="flex items-center gap-2 relative z-10">
                {depositing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="h-4 w-4" fill="currentColor" />
            </motion.div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" fill="currentColor" />
                    <span>ENTER ROUND</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </div>
            </Button>
          </motion.div>
      </div>

      {/* Amount Editing - Only show when editing a specific token */}
      {editingToken && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1"
        >
          <span className="text-xs font-black casino-text-gold" 
                style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            AMOUNT:
          </span>
          {[25, 50, 75, 100].map((percentage) => (
            <Button
              key={percentage}
              variant="outline"
              size="sm"
              onClick={() => handlePercentageAmount(percentage)}
              className={`text-xs font-black px-2 py-1 h-7 border ${
                Math.abs((tempAmount / (selectedTokens.find(t => t.mint === editingToken)?.amount || 1)) * 100 - percentage) < 1
                  ? 'bg-[#FFD700] text-black border-[#FFFF00]'
                  : 'casino-box-gold casino-text-gold border-[#FFD700] hover:bg-[#FFD70020]'
              }`}
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
            >
              {percentage}%
            </Button>
          ))}
          <Button
            onClick={handleConfirmAmount}
            size="sm"
            className="casino-button text-xs font-black px-3 py-1 h-7"
            style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}
          >
            ✓
          </Button>
        </motion.div>
      )}




          </div>
    </div>
  );
}
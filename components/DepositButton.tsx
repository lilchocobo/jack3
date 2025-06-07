'use client';

import {
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface DepositButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
}

export default function DepositButton({ onClick, disabled }: DepositButtonProps) {
  const handleDeposit = useCallback(async () => {
    const recipient = new PublicKey(
      'Fp6Pe7oLc4c1CkwufHapLfHgzk25bZVhVX9D2ZEF2bx2',
    );

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipient,
        lamports: 0.1 * LAMPORTS_PER_SOL,
      }),
    );

    const sig = await sendTransaction(tx, connection);
    console.log('Signature:', sig);
    await connection.confirmTransaction(sig, 'confirmed');
    alert('Deposited 0.1 SOL ✔️');
  }, [publicKey, sendTransaction, connection]);

  return (
    <div className="flex flex-col gap-4">
      {/* your deposit button */}
      <Button
        onClick={handleDeposit}
        disabled={!publicKey || disabled}
        className="w-full bg-[#D50000] text-[#FFD700] hover:bg-[#B71C1C]"
      >
        Deposit 0.1 SOL
      </Button>
    </div>
  );
}

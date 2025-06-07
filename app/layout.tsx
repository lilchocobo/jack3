import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers'; // Import the new Providers

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JACKPOT - Solana Token Lottery',
  description: 'Deposit any SOL token and win the jackpot!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload Visby Round font files */}
        <link rel="preload" href="/fonts/VisbyRoundCF-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/VisbyRoundCF-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/VisbyRoundCF-Heavy.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers> {/* Use the new Privy-based Providers component */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
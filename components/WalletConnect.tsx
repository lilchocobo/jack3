import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { WalletIcon, Star } from 'lucide-react';

export function WalletConnect() {
  const { login, authenticated, user, logout } = usePrivy();

  return (
    <div className="flex items-center justify-center">
      {!authenticated ? (
        <Button
          onClick={login}
          className="flex items-center justify-center gap-1 px-3 py-1 rounded-md border-2 border-[#FFD700] text-white font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 text-xs"
          style={{
            background: 'linear-gradient(145deg, #4A0E4E, #2D0A30)',
            fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.5px',
            boxShadow: `
              0 0 10px rgba(255, 215, 0, 0.4),
              inset 0 1px 0 rgba(255, 215, 0, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2)
            `,
            textShadow: `
              1px 1px 0 #000000,
              0 0 3px #FFD700
            `,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#FFD700'
          }}
        >
          <Star className="h-3 w-3 casino-text-pink" fill="currentColor" />
          <WalletIcon className="h-3 w-3 casino-text-yellow" />
          <span className="casino-text-gold">CONNECT</span>
          <Star className="h-3 w-3 casino-text-pink" fill="currentColor" />
        </Button>
      ) : (
        <div className="text-center flex items-center gap-2">
          <div className="text-xs casino-text-yellow font-bold">
            {user?.wallet?.address.slice(0, 4)}...{user?.wallet?.address.slice(-3)}
          </div>
          <Button
            onClick={logout}
            className="px-2 py-1 rounded-md border border-[#FF1493] text-[#FF1493] font-black uppercase tracking-wider transition-all duration-200 hover:bg-[#FF1493] hover:text-white text-xs"
            style={{
              fontFamily: "Visby Round CF, SF Pro Display, sans-serif",
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '0.5px',
            }}
          >
            LOGOUT
          </Button>
        </div>
      )}
    </div>
  );
}
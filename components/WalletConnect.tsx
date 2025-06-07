import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

export function WalletConnect() {
  const { login, authenticated, logout } = usePrivy();

  const handleClick = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
        <Button
      onClick={handleClick}
      className="px-4 py-2 rounded-md font-black uppercase tracking-wider text-white text-sm shadow-md border-2 border-yellow-400 hover:scale-105 transition-all duration-200"
          style={{
        background: '#FFD700',
        fontFamily: 'Visby Round CF, SF Pro Display, sans-serif',
            fontWeight: 900,
            letterSpacing: '0.5px',
        boxShadow: '0 0 10px rgba(255, 215, 0, 0.4)',
        borderColor: '#FFD700',
          }}
        >
      Connect Wallet to Play
          </Button>
  );
}
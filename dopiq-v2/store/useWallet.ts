import { useStorage } from '@/hooks/useStorage';
import { PlacedBet } from './types';

const STARTING_BALANCE = 1000.0;

export function useWallet() {
  const { value: balance, set: setBalance } = useStorage<number>('wallet_balance', STARTING_BALANCE);
  const { value: bets, set: setBets } = useStorage<PlacedBet[]>('placed_bets', []);

  const placeBet = (bet: PlacedBet) => {
    setBalance((prev) => Math.max(0, prev - bet.stake));
    setBets((prev) => [bet, ...prev]);
  };

  const resolveBet = (betId: string, status: 'won' | 'lost' | 'push') => {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== betId) return b;
        const profit =
          status === 'won'
            ? b.potentialPayout - b.stake
            : status === 'push'
            ? 0
            : -b.stake;
        if (status === 'won') {
          setBalance((bal) => bal + b.potentialPayout);
        } else if (status === 'push') {
          setBalance((bal) => bal + b.stake);
        }
        return { ...b, status, resolvedAt: new Date().toISOString(), profit };
      })
    );
  };

  const pendingBets = bets.filter((b) => b.status === 'pending');
  const resolvedBets = bets.filter((b) => b.status !== 'pending');

  return { balance, placeBet, resolveBet, bets, pendingBets, resolvedBets };
}

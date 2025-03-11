import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useBalanceStore } from '../../../store/balanceStore';
import SlotSymbol, { SymbolType, symbolMultipliers } from './SlotSymbol';
import Button from '../../ui/Button';
import { supabase } from '../../../lib/supabase';
import { BetHistory } from '../BetHistory';
import { Card } from '../../ui/Card';

const SYMBOLS: SymbolType[] = ['crown', 'star', 'diamond', 'heart', 'club', 'clover'];
const GRID_SIZE = 3;

interface WinningLine {
  positions: number[];
  symbol: SymbolType;
}

const SlotMachine: React.FC = () => {
  const [grid, setGrid] = useState<SymbolType[][]>(Array(GRID_SIZE).fill(Array(GRID_SIZE).fill('diamond')));
  const [isSpinning, setIsSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [winningLines, setWinningLines] = useState<WinningLine[]>([]);
  const [balance, setBalance] = useState(1000);
  const [gameHistory, setGameHistory] = useState<Array<{
    id: string;
    bet_amount: number;
    payout: number;
    created_at: string;
  }>>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchGameHistory();
    }
  }, [user]);

  const fetchBalance = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('balance')
      .eq('user_id', user?.id)
      .single();

    if (data && !error) {
      setBalance(data.balance);
    }
  };

  const fetchGameHistory = async () => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('game_type', 'slots')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && !error) {
      setGameHistory(data);
    }
  };

  const generateSecureSymbol = (): SymbolType => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return SYMBOLS[array[0] % SYMBOLS.length];
  };

  const spin = async () => {
    if (isSpinning || betAmount > balance) return;

    setIsSpinning(true);
    setWinningLines([]);

    // Deduct bet amount
    const newBalance = balance - betAmount;
    setBalance(newBalance);

    // Generate new grid with cryptographically secure random numbers
    const newGrid: SymbolType[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => generateSecureSymbol())
    );

    // Animate spinning
    setTimeout(() => {
      setGrid(newGrid);
      setIsSpinning(false);
      const lines = checkWinningLines(newGrid);
      setWinningLines(lines);
      
      // Calculate winnings
      const winAmount = calculateWinnings(lines, betAmount);
      if (winAmount > 0) {
        setBalance(newBalance + winAmount);
        updateBalanceInDatabase(newBalance + winAmount);
      } else {
        updateBalanceInDatabase(newBalance);
      }

      // Record game session
      recordGameSession(betAmount, winAmount);
    }, 2000);
  };

  const recordGameSession = async (bet: number, payout: number) => {
    await supabase.from('game_sessions').insert({
      user_id: user?.id,
      game_type: 'slots',
      bet_amount: bet,
      outcome_amount: payout
    });
    fetchGameHistory();
  };

  const updateBalanceInDatabase = async (newBalance: number) => {
    await supabase
      .from('user_profiles')
      .update({ balance: newBalance })
      .eq('user_id', user?.id);
  };

  const checkWinningLines = (currentGrid: SymbolType[][]): WinningLine[] => {
    const lines: WinningLine[] = [];

    // Check rows
    for (let i = 0; i < GRID_SIZE; i++) {
      if (currentGrid[i][0] === currentGrid[i][1] && currentGrid[i][1] === currentGrid[i][2]) {
        lines.push({
          positions: [i * 3, i * 3 + 1, i * 3 + 2],
          symbol: currentGrid[i][0]
        });
      }
    }

    // Check columns
    for (let j = 0; j < GRID_SIZE; j++) {
      if (currentGrid[0][j] === currentGrid[1][j] && currentGrid[1][j] === currentGrid[2][j]) {
        lines.push({
          positions: [j, j + 3, j + 6],
          symbol: currentGrid[0][j]
        });
      }
    }

    // Check diagonals
    if (currentGrid[0][0] === currentGrid[1][1] && currentGrid[1][1] === currentGrid[2][2]) {
      lines.push({
        positions: [0, 4, 8],
        symbol: currentGrid[0][0]
      });
    }
    if (currentGrid[0][2] === currentGrid[1][1] && currentGrid[1][1] === currentGrid[2][0]) {
      lines.push({
        positions: [2, 4, 6],
        symbol: currentGrid[0][2]
      });
    }

    return lines;
  };

  const calculateWinnings = (lines: WinningLine[], bet: number): number => {
    return lines.reduce((total, line) => {
      const multiplier = symbolMultipliers[line.symbol];
      return total + (bet * multiplier);
    }, 0);
  };

  const isPositionHighlighted = (rowIndex: number, colIndex: number): boolean => {
    const position = rowIndex * GRID_SIZE + colIndex;
    return winningLines.some(line => line.positions.includes(position));
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-2 bg-surface/50 p-4 rounded-lg">
              {grid.map((row, rowIndex) => (
                row.map((symbol, colIndex) => (
                  <SlotSymbol
                    key={`${rowIndex}-${colIndex}`}
                    symbol={symbol}
                    isSpinning={isSpinning}
                    highlighted={isPositionHighlighted(rowIndex, colIndex)}
                  />
                ))
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm mb-2">Bet Amount</label>
                  <input
                    type="number"
                    min="1"
                    max={balance}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, Math.min(balance, Number(e.target.value))))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg"
                    disabled={isSpinning}
                  />
                </div>
                <Button
                  onClick={spin}
                  disabled={isSpinning || betAmount > balance}
                  className="flex-1 py-3"
                >
                  {isSpinning ? 'Spinning...' : 'Spin!'}
                </Button>
              </div>

              {winningLines.length > 0 && (
                <div className="text-green-400 font-bold text-center text-xl">
                  You won ${calculateWinnings(winningLines, betAmount).toFixed(2)}!
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Bet History</h2>
            <BetHistory
              history={gameHistory}
              gameType="slots"
            />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Paytable</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(symbolMultipliers).map(([symbol, multiplier]) => (
                <div
                  key={symbol}
                  className="bg-surface/50 p-4 rounded-lg text-center"
                >
                  <div className="text-4xl mb-2">{symbol}</div>
                  <div className="text-sm text-gray-400">
                    {multiplier}x Multiplier
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;
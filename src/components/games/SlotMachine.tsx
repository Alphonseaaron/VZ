import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../lib/utils';

const SYMBOLS = ['🍒', '🍊', '🍋', '🍇', '💎', '7️⃣', '🎰'];
const PAYLINES = [
  // Horizontal lines
  [[0,0], [0,1], [0,2]],
  [[1,0], [1,1], [1,2]],
  [[2,0], [2,1], [2,2]],
  // Diagonal lines
  [[0,0], [1,1], [2,2]],
  [[2,0], [1,1], [0,2]],
];

const SYMBOL_MULTIPLIERS = {
  '🍒': 2,
  '🍊': 3,
  '🍋': 4,
  '🍇': 5,
  '💎': 10,
  '7️⃣': 15,
  '🎰': 20,
};

const SlotMachine = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { createGame, processGameResult } = useGameStore();
  
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState<string[][]>([
    [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]],
    [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]],
    [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]],
  ]);
  const [winnings, setWinnings] = useState(0);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const spinTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const generateRandomGrid = () => {
    return Array(3).fill(null).map(() =>
      Array(3).fill(null).map(() =>
        SYMBOLS[Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * SYMBOLS.length)]
      )
    );
  };

  const checkWinningLines = (newGrid: string[][]) => {
    const wins: number[] = [];
    let totalWinnings = 0;

    PAYLINES.forEach((line, index) => {
      const symbols = line.map(([row, col]) => newGrid[row][col]);
      if (symbols.every(symbol => symbol === symbols[0])) {
        wins.push(index);
        totalWinnings += betAmount * SYMBOL_MULTIPLIERS[symbols[0] as keyof typeof SYMBOL_MULTIPLIERS];
      }
    });

    return { wins, totalWinnings };
  };

  const spin = async () => {
    if (spinning) return;
    
    try {
      setError(null);
      
      if (!profile) {
        throw new Error('Profile not loaded');
      }
      
      if (profile.balance < betAmount) {
        throw new Error('Insufficient balance');
      }
      
      setSpinning(true);
      setWinningLines([]);
      setWinnings(0);
      
      const game = await createGame('slots');

      // Animate spinning
      const spinDuration = 2000;
      const intervalTime = 100;
      const iterations = spinDuration / intervalTime;

      for (let i = 0; i < iterations; i++) {
        setGrid(generateRandomGrid());
        await new Promise(resolve => setTimeout(resolve, intervalTime));
      }

      // Final result
      const finalGrid = generateRandomGrid();
      setGrid(finalGrid);

      // Check for wins
      const { wins, totalWinnings } = checkWinningLines(finalGrid);
      setWinningLines(wins);
      setWinnings(totalWinnings);

      // Process game result
      await processGameResult(game.id, {
        winner_id: totalWinnings > 0 ? user?.id : null,
        participants: [{
          user_id: user?.id,
          result: totalWinnings > 0 ? 'win' : 'loss',
          score: totalWinnings - betAmount
        }]
      });

    } catch (error) {
      console.error('Error spinning slots:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSpinning(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Slot Machine</h2>
          <div className="text-gray-400">
            Balance: {formatCurrency(profile.balance)}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Slot Grid */}
          <div className="relative bg-gray-900 p-8 rounded-lg">
            <div className="grid grid-rows-3 gap-4 text-center">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-4">
                  {row.map((symbol, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`text-6xl bg-gray-800 p-4 rounded-lg transition-all duration-100 ${
                        spinning ? 'animate-bounce' : ''
                      }`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Winning Lines */}
            {winningLines.map((lineIndex) => (
              <div
                key={lineIndex}
                className="absolute inset-0 pointer-events-none"
              >
                <svg className="w-full h-full">
                  {PAYLINES[lineIndex].map(([row, col], i, line) => {
                    if (i === line.length - 1) return null;
                    const [nextRow, nextCol] = line[i + 1];
                    const x1 = (col + 0.5) * (100 / 3);
                    const y1 = (row + 0.5) * (100 / 3);
                    const x2 = (nextCol + 0.5) * (100 / 3);
                    const y2 = (nextRow + 0.5) * (100 / 3);
                    return (
                      <line
                        key={i}
                        x1={`${x1}%`}
                        y1={`${y1}%`}
                        x2={`${x2}%`}
                        y2={`${y2}%`}
                        stroke="rgba(59, 130, 246, 0.5)"
                        strokeWidth="4"
                      />
                    );
                  })}
                </svg>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Bet Amount:</label>
              <input
                type="number"
                min="1"
                max={profile.balance}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-gray-700 rounded-md px-3 py-2"
                disabled={spinning}
              />
            </div>

            <button
              onClick={spin}
              disabled={spinning || profile.balance < betAmount}
              className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-md font-semibold disabled:opacity-50"
            >
              {spinning ? 'Spinning...' : 'Spin'}
            </button>

            {winnings > 0 && (
              <div className="text-center text-2xl font-bold text-green-500">
                You won {formatCurrency(winnings)}!
              </div>
            )}
          </div>

          {/* Paytable */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Paytable</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(SYMBOL_MULTIPLIERS).map(([symbol, multiplier]) => (
                <div
                  key={symbol}
                  className="bg-gray-700 p-4 rounded-lg text-center"
                >
                  <div className="text-4xl mb-2">{symbol}</div>
                  <div className="text-sm text-gray-400">
                    {multiplier}x Multiplier
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;
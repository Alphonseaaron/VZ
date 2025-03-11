import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { generateRandomNumber, calculateWinProbability, formatCurrency } from '../../lib/utils';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceGame = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createGame, processGameResult } = useGameStore();
  
  const [targetNumber, setTargetNumber] = useState(50);
  const [betAmount, setBetAmount] = useState(10);
  const [isOver, setIsOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | null>(null);
  const [history, setHistory] = useState<Array<{ number: number; result: 'win' | 'loss' }>>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const winProbability = calculateWinProbability(targetNumber, isOver);
  const multiplier = (99 / winProbability).toFixed(2);

  const DiceIcon = ({ number }: { number: number }) => {
    const icons = {
      1: Dice1,
      2: Dice2,
      3: Dice3,
      4: Dice4,
      5: Dice5,
      6: Dice6,
    };
    const Icon = icons[number as keyof typeof icons] || Dice1;
    return <Icon className="w-12 h-12" />;
  };

  const handleRoll = async () => {
    try {
      setRolling(true);
      const game = await createGame('dice');
      
      // Simulate dice roll with animation
      for (let i = 0; i < 10; i++) {
        setResult(generateRandomNumber(1, 100));
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Final result
      const finalNumber = generateRandomNumber(1, 100);
      setResult(finalNumber);
      
      // Determine win/loss
      const hasWon = isOver ? finalNumber > targetNumber : finalNumber < targetNumber;
      const newResult = hasWon ? 'win' : 'loss';
      setGameResult(newResult);
      
      // Update history
      setHistory(prev => [...prev, { number: finalNumber, result: newResult }].slice(-10));
      
      // Process game result
      await processGameResult(game.id, {
        winner_id: hasWon ? user?.id : null,
        participants: [{
          user_id: user?.id,
          result: newResult,
          score: hasWon ? betAmount * Number(multiplier) : -betAmount
        }]
      });
      
    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setRolling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dice Game</h2>
          <div className="text-gray-400">
            Win Chance: {winProbability.toFixed(2)}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Target Number</label>
              <input
                type="range"
                min="1"
                max="99"
                value={targetNumber}
                onChange={(e) => setTargetNumber(Number(e.target.value))}
                className="w-full"
                disabled={rolling}
              />
              <div className="flex justify-between text-sm mt-1">
                <span>1</span>
                <span>{targetNumber}</span>
                <span>99</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                disabled={rolling}
              />
            </div>

            <div className="flex gap-4">
              <button
                className={`flex-1 py-2 px-4 rounded-md ${
                  isOver ? 'bg-green-500' : 'bg-gray-700'
                }`}
                onClick={() => setIsOver(true)}
                disabled={rolling}
              >
                Over
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md ${
                  !isOver ? 'bg-red-500' : 'bg-gray-700'
                }`}
                onClick={() => setIsOver(false)}
                disabled={rolling}
              >
                Under
              </button>
            </div>

            <button
              className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-md font-semibold disabled:opacity-50"
              onClick={handleRoll}
              disabled={rolling}
            >
              {rolling ? 'Rolling...' : 'Roll Dice'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4">
                {result !== null ? result : '?'}
              </div>
              {gameResult && (
                <div
                  className={`text-xl font-semibold ${
                    gameResult === 'win' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {gameResult === 'win' ? 'You Won!' : 'You Lost'}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">History</h3>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded-md ${
                      item.result === 'win' ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}
                  >
                    <span>Roll: {item.number}</span>
                    <span
                      className={
                        item.result === 'win' ? 'text-green-500' : 'text-red-500'
                      }
                    >
                      {item.result === 'win' ? 'Won' : 'Lost'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;
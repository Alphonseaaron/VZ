import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { db } from '../../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, runTransaction, doc, onSnapshot } from 'firebase/firestore';
import Button from '../../ui/Button';
import { TrendingUp, History, Users, Timer, Rocket } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../../hooks/useTheme';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerBet {
  user_id: string;
  username: string;
  bet_amount: number;
  auto_cashout: number | null;
  cashed_out: boolean;
  cashout_multiplier: number | null;
}

interface GameHistory {
  id: string;
  crash_point: number;
  created_at: any;
}

const CrashGame: React.FC = () => {
  const { theme } = useTheme();
  const [balance, setBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [autoCashout, setAutoCashout] = useState<number | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [playerBets, setPlayerBets] = useState<PlayerBet[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [hasPlacedBet, setHasPlacedBet] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const gameInterval = useRef<number | null>(null);
  const { user } = useAuthStore();

  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchGameHistory();
      subscribeToGameUpdates();
    }
    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
    };
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;

    const userDoc = await getDocs(
      query(collection(db, 'profiles'), where('id', '==', user.uid))
    );

    if (userDoc.docs[0]) {
      setBalance(userDoc.docs[0].data().balance || 0);
    }
  };

  const fetchGameHistory = async () => {
    if (!user) return;

    const historyQuery = query(
      collection(db, 'crash_games'),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(historyQuery);
    setGameHistory(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GameHistory[]);
  };

  const subscribeToGameUpdates = () => {
    if (!user) return;

    const gameUpdatesQuery = query(collection(db, 'crash_game_updates'));
    const unsubscribe = onSnapshot(gameUpdatesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          setCurrentMultiplier(data.multiplier);
          setGameActive(data.active);
          setPlayerBets(data.bets || []);
          
          if (data.active) {
            setChartData(prev => [...prev, data.multiplier]);
          }
        }
      });
    });

    return unsubscribe;
  };

  const generateCrashPoint = (): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Use the random value to generate a crash point with house edge
    const e = Math.pow(2, 32);
    const h = 0.99; // House edge of 1%
    return Math.max(1, Math.floor(100 * h * e / (array[0] + 1)) / 100);
  };

  const startGame = async () => {
    if (!hasPlacedBet || betAmount > balance || !user) return;

    setIsPlaying(true);
    setGameActive(true);
    setHasCashedOut(false);
    setChartData([1]);

    const crashPoint = generateCrashPoint();
    let currentTime = 0;
    const updateInterval = 50; // 50ms updates for smooth animation

    gameInterval.current = setInterval(() => {
      currentTime += updateInterval;
      const timeInSeconds = currentTime / 1000;
      const multiplier = Math.pow(Math.E, timeInSeconds * 0.1);

      setCurrentMultiplier(multiplier);
      setChartData(prev => [...prev, multiplier]);

      if (multiplier >= crashPoint) {
        endGame();
      } else if (autoCashout && multiplier >= autoCashout && !hasCashedOut) {
        handleCashout();
      }
    }, updateInterval);
  };

  const endGame = async () => {
    if (gameInterval.current) {
      clearInterval(gameInterval.current);
    }
    setGameActive(false);
    setIsPlaying(false);
    setHasPlacedBet(false);

    // Record game result
    if (user) {
      await addDoc(collection(db, 'crash_games'), {
        crash_point: currentMultiplier,
        created_at: serverTimestamp()
      });
    }

    fetchGameHistory();
  };

  const placeBet = async () => {
    if (betAmount > balance || hasPlacedBet || !user) return;

    try {
      const userRef = doc(db, 'profiles', user.uid);
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User document does not exist!');
        }
        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < betAmount) {
          throw new Error('Insufficient balance');
        }
        transaction.update(userRef, { balance: currentBalance - betAmount });
      });

      await addDoc(collection(db, 'crash_bets'), {
        user_id: user.uid,
        bet_amount: betAmount,
        auto_cashout: autoCashout,
        created_at: serverTimestamp()
      });

      setBalance(prev => prev - betAmount);
      setHasPlacedBet(true);
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || hasCashedOut || !user) return;

    try {
      const winAmount = betAmount * currentMultiplier;
      const userRef = doc(db, 'profiles', user.uid);
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User document does not exist!');
        }
        const currentBalance = userDoc.data().balance || 0;
        transaction.update(userRef, { balance: currentBalance + winAmount });
      });

      await addDoc(collection(db, 'crash_cashouts'), {
        user_id: user.uid,
        bet_id: user.uid, // You might want to store the original bet ID
        multiplier: currentMultiplier,
        payout: winAmount,
        created_at: serverTimestamp()
      });

      setBalance(prev => prev + winAmount);
      setHasCashedOut(true);
    } catch (error) {
      console.error('Error processing cashout:', error);
    }
  };

  const chartOptions = {
    responsive: true,
    animation: false,
    scales: {
      x: {
        type: 'linear' as const,
        display: true,
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#4B5563',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: theme === 'dark' ? '#9CA3AF' : '#4B5563',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: theme === 'dark' ? '#F3F4F6' : '#1F2937',
        bodyColor: theme === 'dark' ? '#F3F4F6' : '#1F2937',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className={`
      flex flex-col space-y-8 p-8 rounded-xl shadow-lg max-w-6xl mx-auto
      ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
      transition-colors duration-200
    `}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Rocket className={`w-8 h-8 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Crash Game
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={`
            relative h-96 rounded-lg p-4
            ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}
          `}>
            {chartData.length > 0 && (
              <Line
                ref={chartRef}
                data={{
                  labels: chartData.map((_, i) => i),
                  datasets: [{
                    data: chartData,
                    borderColor: theme === 'dark' ? '#818CF8' : '#4F46E5',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true,
                    backgroundColor: (context) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                      if (theme === 'dark') {
                        gradient.addColorStop(0, 'rgba(129, 140, 248, 0.2)');
                        gradient.addColorStop(1, 'rgba(129, 140, 248, 0)');
                      } else {
                        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
                        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
                      }
                      return gradient;
                    },
                  }]
                }}
                options={chartOptions}
              />
            )}
            <div className={`
              absolute top-4 right-4 text-4xl font-bold
              ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}
            `}>
              {currentMultiplier.toFixed(2)}x
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={`
                block text-sm font-medium
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
              `}>
                Bet Amount
              </label>
              <input
                type="number"
                min="1"
                max={balance}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Math.min(balance, Number(e.target.value))))}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                `}
                disabled={isPlaying || hasPlacedBet}
              />
            </div>
            <div className="space-y-2">
              <label className={`
                block text-sm font-medium
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
              `}>
                Auto Cashout
              </label>
              <input
                type="number"
                min="1.01"
                step="0.01"
                value={autoCashout || ''}
                onChange={(e) => setAutoCashout(e.target.value ? Number(e.target.value) : null)}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                `}
                disabled={isPlaying || hasPlacedBet}
                placeholder="Enter multiplier"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={placeBet}
              disabled={isPlaying || hasPlacedBet || betAmount > balance}
              className="flex-1 py-3"
              variant={theme === 'dark' ? 'primary-dark' : 'primary'}
            >
              Place Bet
            </Button>
            <Button
              onClick={handleCashout}
              disabled={!isPlaying || hasCashedOut || !hasPlacedBet}
              variant={theme === 'dark' ? 'secondary-dark' : 'secondary'}
              className="flex-1 py-3"
            >
              Cash Out
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`
            rounded-lg p-4 space-y-4
            ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}
          `}>
            <div className="flex items-center space-x-2">
              <Users className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} size={20} />
              <h2 className={`
                text-lg font-semibold
                ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Live Bets
              </h2>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {playerBets.map((bet, index) => (
                <div
                  key={index}
                  className={`
                    flex justify-between items-center p-2 rounded
                    ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
                  `}
                >
                  <span className={`
                    font-medium
                    ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}
                  `}>
                    {bet.username}
                  </span>
                  <div className="text-right">
                    <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
                      ${bet.bet_amount.toFixed(2)}
                    </div>
                    {bet.cashed_out && (
                      <div className="text-green-500">
                        {bet.cashout_multiplier?.toFixed(2)}x
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`
            rounded-lg p-4 space-y-4
            ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}
          `}>
            <div className="flex items-center space-x-2">
              <History className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} size={20} />
              <h2 className={`
                text-lg font-semibold
                ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                Game History
              </h2>
            </div>
            <div className="space-y-2">
              {gameHistory.map((game) => (
                <div
                  key={game.id}
                  className={`
                    flex justify-between items-center p-2 rounded
                    ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
                  `}
                >
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    {new Date(game.created_at.seconds * 1000).toLocaleTimeString()}
                  </span>
                  <span className={
                    game.crash_point >= 2
                      ? 'text-green-500'
                      : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }>
                    {game.crash_point.toFixed(2)}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrashGame;
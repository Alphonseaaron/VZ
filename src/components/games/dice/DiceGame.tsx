import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { db } from '../../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, runTransaction, doc } from 'firebase/firestore';
import Button from '../../ui/Button';
import { Dice1, Dice6, TrendingUp, TrendingDown, History } from 'lucide-react';

interface RollHistory {
  id: string;
  target_number: number;
  roll_result: number;
  bet_amount: number;
  is_over: boolean;
  won: boolean;
  created_at: any;
}

const DiceGame: React.FC = () => {
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [isOver, setIsOver] = useState<boolean>(true);
  const [balance, setBalance] = useState<number>(1000);
  const [rollHistory, setRollHistory] = useState<RollHistory[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchRollHistory();
    }
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

  const fetchRollHistory = async () => {
    if (!user) return;

    const historyQuery = query(
      collection(db, 'dice_rolls'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(historyQuery);
    setRollHistory(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RollHistory[]);
  };

  const calculateWinProbability = (): number => {
    if (isOver) {
      return ((100 - targetNumber) / 100) * 100;
    }
    return (targetNumber / 100) * 100;
  };

  const calculateMultiplier = (): number => {
    const probability = calculateWinProbability() / 100;
    return (0.99 / probability).toFixed(4) as unknown as number;
  };

  const generateSecureRoll = (): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % 100) + 1;
  };

  const updateBalanceInDatabase = async (newBalance: number) => {
    if (!user) return;

    const userRef = doc(db, 'profiles', user.uid);
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User document does not exist!');
      }
      transaction.update(userRef, { balance: newBalance });
    });
  };

  const handleRoll = async () => {
    if (isRolling || betAmount > balance || !user) return;

    setIsRolling(true);
    const newBalance = balance - betAmount;
    setBalance(newBalance);

    // Generate roll result using cryptographically secure RNG
    const rollResult = generateSecureRoll();
    setLastRoll(rollResult);

    // Determine if won
    const won = isOver ? rollResult > targetNumber : rollResult < targetNumber;
    const winAmount = won ? betAmount * calculateMultiplier() : 0;
    const finalBalance = newBalance + winAmount;

    try {
      // Record roll in database
      await addDoc(collection(db, 'dice_rolls'), {
        user_id: user.uid,
        target_number: targetNumber,
        roll_result: rollResult,
        bet_amount: betAmount,
        is_over: isOver,
        won: won,
        payout: winAmount,
        created_at: serverTimestamp()
      });

      // Update user's balance
      await updateBalanceInDatabase(finalBalance);
      setBalance(finalBalance);
      await fetchRollHistory();
    } catch (error) {
      console.error('Error processing roll:', error);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 p-8 bg-white rounded-xl shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dice Game</h1>
        <div className="text-xl font-bold text-gray-800">Balance: ${balance.toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Target Number: {targetNumber}</span>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setIsOver(true)}
                  variant={isOver ? 'primary' : 'outline'}
                  className="flex items-center space-x-1"
                >
                  <TrendingUp size={16} />
                  <span>Over</span>
                </Button>
                <Button
                  onClick={() => setIsOver(false)}
                  variant={!isOver ? 'primary' : 'outline'}
                  className="flex items-center space-x-1"
                >
                  <TrendingDown size={16} />
                  <span>Under</span>
                </Button>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="99"
              value={targetNumber}
              onChange={(e) => setTargetNumber(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bet Amount
            </label>
            <input
              type="number"
              min="1"
              max={balance}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, Math.min(balance, Number(e.target.value))))}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isRolling}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Win Probability</div>
              <div className="text-lg font-bold text-gray-800">
                {calculateWinProbability().toFixed(2)}%
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Multiplier</div>
              <div className="text-lg font-bold text-gray-800">
                {calculateMultiplier()}x
              </div>
            </div>
          </div>

          <Button
            onClick={handleRoll}
            disabled={isRolling || betAmount > balance}
            className="w-full py-3 text-lg"
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </Button>

          {lastRoll !== null && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Last Roll</div>
              <div className="text-3xl font-bold text-gray-800">{lastRoll}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <History size={20} />
            <h2 className="text-lg font-semibold">Roll History</h2>
          </div>
          <div className="space-y-2">
            {rollHistory.map((roll) => (
              <div
                key={roll.id}
                className={`p-3 rounded-lg ${
                  roll.won ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {roll.is_over ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="font-medium">
                      {roll.is_over ? '>' : '<'} {roll.target_number}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">Result: {roll.roll_result}</span>
                    <span className={roll.won ? 'text-green-600' : 'text-red-600'}>
                      {roll.won ? '+' : '-'}${roll.bet_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;
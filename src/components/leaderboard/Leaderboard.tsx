import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Trophy, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
}

export const Leaderboard: React.FC = () => {
  const [period, setPeriod] = useState<Period>('daily');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          user_id,
          score,
          profiles (username)
        `)
        .eq('period', period)
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedEntries = data.map((entry, index) => ({
        username: entry.profiles.username,
        score: entry.score,
        rank: index + 1
      }));

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods: { value: Period; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'all_time', label: 'All Time' }
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        <div className="flex space-x-2">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === value
                  ? 'bg-primary text-secondary'
                  : 'bg-surface hover:bg-surface/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center p-4 rounded-lg ${
                index === 0
                  ? 'bg-primary/20'
                  : index === 1
                  ? 'bg-surface/80'
                  : index === 2
                  ? 'bg-surface/60'
                  : 'bg-surface/40'
              }`}
            >
              <span className="w-8 text-lg font-bold">#{entry.rank}</span>
              <span className="flex-1 font-medium">{entry.username}</span>
              <span className="font-bold text-primary">${entry.score.toFixed(2)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </Card>
  );
};
import React from 'react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BetHistoryProps {
  history: Array<{
    id: string;
    bet_amount: number;
    payout: number;
    created_at: string;
    result?: string;
    multiplier?: number;
    target_number?: number;
    roll_result?: number;
    is_over?: boolean;
  }>;
  gameType: 'slots' | 'dice' | 'crash';
}

export const BetHistory: React.FC<BetHistoryProps> = ({ history, gameType }) => {
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {history.map((bet, index) => (
        <motion.div
          key={bet.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-lg ${
            bet.payout > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {gameType === 'dice' && (
                  <>
                    {bet.is_over ? (
                      <TrendingUp className="w-4 h-4 text-primary" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-primary" />
                    )}
                    <span>{bet.is_over ? '>' : '<'} {bet.target_number}</span>
                  </>
                )}
                {gameType === 'crash' && (
                  <span>
                    {bet.multiplier?.toFixed(2)}x
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {format(new Date(bet.created_at), 'HH:mm:ss')}
              </div>
            </div>
            <div className="text-right">
              <div className={bet.payout > 0 ? 'text-green-400' : 'text-red-400'}>
                {bet.payout > 0 ? '+' : ''}{formatCurrency(bet.payout)}
              </div>
              <div className="text-sm text-gray-400">
                Bet: {formatCurrency(bet.bet_amount)}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
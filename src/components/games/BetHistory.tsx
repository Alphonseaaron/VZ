import React from 'react';
import { formatCurrency } from '../../lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card';

interface BetHistoryProps {
  history: Array<{
    id: string;
    bet_amount: number;
    payout_amount: number;
    created_at: string;
    multiplier?: number;
    metadata?: any;
  }>;
  gameType: 'slots' | 'dice' | 'crash' | 'chess';
}

export const BetHistory: React.FC<BetHistoryProps> = ({ history, gameType }) => {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Bet History</h2>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {history.map((bet, index) => (
          <motion.div
            key={bet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg ${
              bet.payout_amount > bet.bet_amount ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {bet.multiplier && (
                    <span className="text-primary">{bet.multiplier.toFixed(2)}x</span>
                  )}
                  {gameType === 'dice' && bet.metadata?.is_over !== undefined && (
                    <>
                      {bet.metadata.is_over ? (
                        <TrendingUp className="w-4 h-4 text-primary" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-primary" />
                      )}
                      <span>{bet.metadata.is_over ? '>' : '<'} {bet.metadata.target_number}</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-text/60">
                  {format(new Date(bet.created_at), 'HH:mm:ss')}
                </div>
              </div>
              <div className="text-right">
                <div className={bet.payout_amount > bet.bet_amount ? 'text-green-400' : 'text-red-400'}>
                  {bet.payout_amount > bet.bet_amount ? '+' : ''}{formatCurrency(bet.payout_amount - bet.bet_amount)}
                </div>
                <div className="text-sm text-text/60">
                  Bet: {formatCurrency(bet.bet_amount)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
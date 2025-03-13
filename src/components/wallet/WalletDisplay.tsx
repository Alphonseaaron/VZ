import React from 'react';
import { Wallet } from 'lucide-react';
import { useBalanceStore } from '../../store/balanceStore';
import { motion } from 'framer-motion';

export const WalletDisplay: React.FC = () => {
  const { balance } = useBalanceStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-2 bg-surface px-4 py-2 rounded-lg border border-border"
    >
      <Wallet className="w-5 h-5 text-primary" />
      <motion.span
        key={balance}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-medium"
      >
        ${balance.toFixed(2)}
      </motion.span>
    </motion.div>
  );
};
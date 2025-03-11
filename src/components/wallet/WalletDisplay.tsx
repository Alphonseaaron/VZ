import React, { useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useBalanceStore } from '../../store/balanceStore';

export const WalletDisplay: React.FC = () => {
  const { user } = useAuthStore();
  const { balance, fetchBalance } = useBalanceStore();

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchBalance();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchBalance();
        }
      )
      .subscribe();

    // Poll for balance updates every 10 seconds as backup
    const interval = setInterval(fetchBalance, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, fetchBalance]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
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
    </AnimatePresence>
  );
};
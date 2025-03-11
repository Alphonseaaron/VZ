import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface BalanceStore {
  balance: number;
  loading: boolean;
  error: string | null;
  updateBalance: (amount: number) => Promise<void>;
  fetchBalance: () => Promise<void>;
}

export const useBalanceStore = create<BalanceStore>((set, get) => ({
  balance: 0,
  loading: false,
  error: null,

  updateBalance: async (amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_amount: amount
      });

      if (error) throw error;
      await get().fetchBalance();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchBalance: async () => {
    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ balance: data.balance, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  }
}));
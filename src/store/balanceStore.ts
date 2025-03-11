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

      // Broadcast balance update to all subscribers
      const channel = supabase.channel('balance_update');
      channel.send({
        type: 'broadcast',
        event: 'balance_change',
        payload: { user_id: user.id }
      });
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

// Subscribe to real-time balance updates
supabase
  .channel('balance_changes')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}` },
    () => {
      useBalanceStore.getState().fetchBalance();
    }
  )
  .subscribe();
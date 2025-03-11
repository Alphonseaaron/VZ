import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AdminState {
  users: any[];
  transactions: any[];
  gameStats: any;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  fetchUsers: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchGameStats: () => Promise<void>;
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  checkAdminStatus: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  transactions: [],
  gameStats: null,
  loading: false,
  error: null,
  isAdmin: false,

  checkAdminStatus: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ isAdmin: data?.is_admin || false });
    } catch (error) {
      console.error('Error checking admin status:', error);
      set({ isAdmin: false });
    }
  },

  fetchUsers: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ users: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchTransactions: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles (username)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      set({ transactions: data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchGameStats: async () => {
    try {
      set({ loading: true });
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('game_type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (gamesError) throw gamesError;

      const stats = {
        totalGames: games.length,
        gamesByType: games.reduce((acc: any, game: any) => {
          acc[game.game_type] = (acc[game.game_type] || 0) + 1;
          return acc;
        }, {}),
        recentActivity: games.slice(0, 10)
      };

      set({ gameStats: stats, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  banUser: async (userId: string) => {
    try {
      set({ loading: true });
      const { error } = await supabase
        .from('profiles')
        .update({ banned: true })
        .eq('id', userId);

      if (error) throw error;
      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  unbanUser: async (userId: string) => {
    try {
      set({ loading: true });
      const { error } = await supabase
        .from('profiles')
        .update({ banned: false })
        .eq('id', userId);

      if (error) throw error;
      await get().fetchUsers();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
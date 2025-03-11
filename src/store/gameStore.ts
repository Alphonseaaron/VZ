import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Game, GameParticipant, Transaction } from '../lib/supabase';

interface GameState {
  currentGame: Game | null;
  gameHistory: Game[];
  loading: boolean;
  error: string | null;
  createGame: (gameType: string) => Promise<Game>;
  joinGame: (gameId: string) => Promise<void>;
  processGameResult: (gameId: string, result: any) => Promise<void>;
  fetchGameHistory: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  gameHistory: [],
  loading: false,
  error: null,

  createGame: async (gameType) => {
    set({ loading: true, error: null });
    try {
      const { data: game, error } = await supabase
        .from('games')
        .insert([{ game_type: gameType }])
        .select()
        .single();

      if (error) throw error;
      set({ currentGame: game, loading: false });
      return game;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  joinGame: async (gameId) => {
    set({ loading: true, error: null });
    try {
      const { data: participant, error } = await supabase
        .from('game_participants')
        .insert([{
          game_id: gameId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  processGameResult: async (gameId, result) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.rpc('process_game_result', {
        p_game_id: gameId,
        p_winner_id: result.winner_id,
        p_participants: result.participants
      });

      if (error) throw error;
      set({ loading: false });
      await get().fetchGameHistory();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  fetchGameHistory: async () => {
    set({ loading: true, error: null });
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      set({ gameHistory: games, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
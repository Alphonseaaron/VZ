import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const supabaseUrl = 'https://bikextkcrfiidihkeirv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpa2V4dGtjcmZpaWRpaGtlaXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NTg5MjQsImV4cCI6MjA1NzMzNDkyNH0.TatCuVsITsynWjbRuY_BO7OtKxzHaTHONTvh82geRhY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Initialize Supabase connection and auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user.id);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});

// Helper functions for common Supabase operations
export const supabaseHelper = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBetHistory(userId: string, gameType: string) {
    const { data, error } = await supabase
      .from('betting_history')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  },

  async updateUserBalance(userId: string, amount: number) {
    const { error } = await supabase.rpc('update_user_balance', {
      p_user_id: userId,
      p_amount: amount
    });
    
    if (error) throw error;
  },

  async createGameSession(gameType: string, metadata: any = {}) {
    const { data, error } = await supabase
      .from('games')
      .insert([{ game_type: gameType, metadata }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async processGameResult(gameId: string, winnerId: string | null, participants: any[]) {
    const { error } = await supabase.rpc('process_game_result', {
      p_game_id: gameId,
      p_winner_id: winnerId,
      p_participants: participants
    });
    
    if (error) throw error;
  },

  async recordBet(userId: string, gameType: string, betAmount: number, payoutAmount: number, multiplier: number = 1) {
    const { error } = await supabase
      .from('betting_history')
      .insert([{
        user_id: userId,
        game_type: gameType,
        bet_amount: betAmount,
        payout_amount: payoutAmount,
        multiplier: multiplier
      }]);

    if (error) throw error;
  }
};
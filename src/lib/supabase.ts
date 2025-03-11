import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const supabaseUrl = 'https://qnpztvrljsqxlgllvxmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucHp0dnJsanNxeGxnbGx2eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2ODgzOTIsImV4cCI6MjA1NzI2NDM5Mn0.nT5mnUuwyZLIp9srEQggbNkjecfBfNGpzbxmCkJl2ns';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Tables = Database['public']['Tables'];
export type GameType = Tables['games']['Row']['game_type'];
export type GameStatus = Tables['games']['Row']['status'];
export type Profile = Tables['profiles']['Row'];
export type Game = Tables['games']['Row'];
export type GameParticipant = Tables['game_participants']['Row'];
export type Transaction = Tables['transactions']['Row'];
export type Leaderboard = Tables['leaderboards']['Row'];
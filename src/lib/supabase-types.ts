export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          balance: number
          created_at: string
          updated_at: string
          is_admin: boolean
          banned: boolean
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          banned?: boolean
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          banned?: boolean
        }
      }
      games: {
        Row: {
          id: string
          game_type: string
          status: string
          created_at: string
          ended_at: string | null
          winner_id: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          game_type: string
          status?: string
          created_at?: string
          ended_at?: string | null
          winner_id?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          game_type?: string
          status?: string
          created_at?: string
          ended_at?: string | null
          winner_id?: string | null
          metadata?: Json
        }
      }
      game_participants: {
        Row: {
          id: string
          game_id: string
          user_id: string
          joined_at: string
          left_at: string | null
          result: string | null
          score: number
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          joined_at?: string
          left_at?: string | null
          result?: string | null
          score?: number
        }
        Update: {
          id?: string
          game_id?: string
          user_id?: string
          joined_at?: string
          left_at?: string | null
          result?: string | null
          score?: number
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          game_id: string
          amount: number
          type: string
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          amount: number
          type: string
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          amount?: number
          type?: string
          created_at?: string
          metadata?: Json
        }
      }
      leaderboards: {
        Row: {
          id: string
          user_id: string
          game_type: string
          score: number
          period: string
          period_start: string
          period_end: string
        }
        Insert: {
          id?: string
          user_id: string
          game_type: string
          score?: number
          period: string
          period_start: string
          period_end: string
        }
        Update: {
          id?: string
          user_id?: string
          game_type?: string
          score?: number
          period?: string
          period_start?: string
          period_end?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          created_at: string
          profiles: {
            username: string
          }
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      game_settings: {
        Row: {
          id: string
          game_type: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          game_type: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          game_type?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string
        }
      }
    }
    Functions: {
      update_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_game_result: {
        Args: {
          p_game_id: string
          p_winner_id: string
          p_participants: Json
        }
        Returns: undefined
      }
      update_user_balance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
  }
}
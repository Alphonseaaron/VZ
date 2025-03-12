/*
  # Schema Updates for Gaming Platform

  1. Changes
    - Add missing columns to profiles table
    - Add game statistics tables
    - Add tournament rewards table
    - Add betting history table
    - Update existing tables with missing columns

  2. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add missing columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_bets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_wagered DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_won DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;

-- Create game_statistics table
CREATE TABLE IF NOT EXISTS game_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type TEXT NOT NULL,
    total_games INTEGER DEFAULT 0,
    total_bets DECIMAL(10,2) DEFAULT 0,
    total_payouts DECIMAL(10,2) DEFAULT 0,
    house_edge DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_game_type CHECK (
        game_type IN ('slots', 'dice', 'crash', 'chess')
    )
);

-- Create tournament_rewards table
CREATE TABLE IF NOT EXISTS tournament_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES chess_tournaments(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    reward_type TEXT NOT NULL,
    reward_amount DECIMAL(10,2),
    reward_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_reward_type CHECK (
        reward_type IN ('cash', 'points', 'item')
    )
);

-- Create betting_history table
CREATE TABLE IF NOT EXISTS betting_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    game_type TEXT NOT NULL,
    bet_amount DECIMAL(10,2) NOT NULL,
    payout_amount DECIMAL(10,2),
    multiplier DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_game_type CHECK (
        game_type IN ('slots', 'dice', 'crash', 'chess')
    )
);

-- Add missing columns to chess_games
ALTER TABLE chess_games
ADD COLUMN IF NOT EXISTS spectator_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_bets DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payouts DECIMAL(10,2) DEFAULT 0;

-- Enable RLS
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE betting_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view game statistics"
    ON game_statistics FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage game statistics"
    ON game_statistics
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    ));

CREATE POLICY "Anyone can view tournament rewards"
    ON tournament_rewards FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage tournament rewards"
    ON tournament_rewards
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    ));

CREATE POLICY "Users can view their betting history"
    ON betting_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to update game statistics
CREATE OR REPLACE FUNCTION update_game_statistics(
    p_game_type TEXT,
    p_bet_amount DECIMAL,
    p_payout_amount DECIMAL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO game_statistics (game_type, total_games, total_bets, total_payouts)
    VALUES (p_game_type, 1, p_bet_amount, p_payout_amount)
    ON CONFLICT (game_type)
    DO UPDATE SET
        total_games = game_statistics.total_games + 1,
        total_bets = game_statistics.total_bets + p_bet_amount,
        total_payouts = game_statistics.total_payouts + p_payout_amount,
        house_edge = CASE 
            WHEN (game_statistics.total_bets + p_bet_amount) > 0 
            THEN (1 - (game_statistics.total_payouts + p_payout_amount) / (game_statistics.total_bets + p_bet_amount)) * 100
            ELSE 0
        END,
        updated_at = now();
END;
$$;

-- Create function to update user statistics
CREATE OR REPLACE FUNCTION update_user_statistics(
    p_user_id UUID,
    p_bet_amount DECIMAL,
    p_payout_amount DECIMAL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles
    SET total_bets = total_bets + 1,
        total_wins = CASE WHEN p_payout_amount > p_bet_amount THEN total_wins + 1 ELSE total_wins END,
        total_losses = CASE WHEN p_payout_amount < p_bet_amount THEN total_losses + 1 ELSE total_losses END,
        total_wagered = total_wagered + p_bet_amount,
        total_won = total_won + GREATEST(p_payout_amount - p_bet_amount, 0),
        loyalty_points = loyalty_points + (p_bet_amount * 0.01)::INTEGER,
        last_active = now()
    WHERE id = p_user_id;
END;
$$;
/*
  # Chess Game Enhancements

  1. New Tables and Columns
    - Add ELO rating to profiles
    - Add chess_spectators table for spectator mode
    - Add chess_bets table for spectator betting
    - Add chess_tournaments table for tournaments
    - Add chess_tournament_participants table
    - Add AI difficulty levels and rewards configuration

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add ELO rating to profiles
ALTER TABLE profiles
ADD COLUMN chess_elo INTEGER DEFAULT 1200,
ADD COLUMN chess_games_played INTEGER DEFAULT 0,
ADD COLUMN chess_games_won INTEGER DEFAULT 0;

-- Create chess_spectators table
CREATE TABLE chess_spectators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES chess_games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    left_at TIMESTAMPTZ,
    UNIQUE(game_id, user_id)
);

-- Create chess_bets table
CREATE TABLE chess_bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES chess_games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    bet_amount DECIMAL(10,2) NOT NULL,
    bet_on_player_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending',
    payout_multiplier DECIMAL(10,2) DEFAULT 1.0,
    payout_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_bet_status CHECK (status IN ('pending', 'won', 'lost'))
);

-- Create chess_tournaments table
CREATE TABLE chess_tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    entry_fee DECIMAL(10,2) DEFAULT 0,
    prize_pool DECIMAL(10,2) NOT NULL,
    max_participants INTEGER,
    min_elo INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_tournament_status CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled'))
);

-- Create chess_tournament_participants table
CREATE TABLE chess_tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES chess_tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    registration_date TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'registered',
    final_rank INTEGER,
    prize_amount DECIMAL(10,2),
    CONSTRAINT valid_participant_status CHECK (status IN ('registered', 'active', 'eliminated', 'winner'))
);

-- Add AI configuration to game_settings
INSERT INTO game_settings (game_type, setting_key, setting_value, updated_at)
VALUES (
    'chess',
    'ai_levels',
    '{
        "beginner": {"elo": 800, "max_stake": 100, "house_edge": 0.4},
        "intermediate": {"elo": 1200, "max_stake": 250, "house_edge": 0.4},
        "advanced": {"elo": 1600, "max_stake": 500, "house_edge": 0.4},
        "expert": {"elo": 2000, "max_stake": 1000, "house_edge": 0.4}
    }'::jsonb,
    now()
);

-- Enable RLS
ALTER TABLE chess_spectators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_tournament_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view spectators"
    ON chess_spectators FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can become spectators"
    ON chess_spectators FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all bets"
    ON chess_bets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can place bets"
    ON chess_bets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view tournaments"
    ON chess_tournaments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage tournaments"
    ON chess_tournaments
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    ));

CREATE POLICY "Anyone can view tournament participants"
    ON chess_tournament_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can join tournaments"
    ON chess_tournament_participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create function to update ELO ratings
CREATE OR REPLACE FUNCTION update_chess_elo(
    player1_id UUID,
    player2_id UUID,
    player1_won BOOLEAN
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    k CONSTANT INTEGER := 32;
    player1_elo INTEGER;
    player2_elo INTEGER;
    expected_score1 FLOAT;
    expected_score2 FLOAT;
    new_elo1 INTEGER;
    new_elo2 INTEGER;
BEGIN
    -- Get current ELO ratings
    SELECT chess_elo INTO player1_elo FROM profiles WHERE id = player1_id;
    SELECT chess_elo INTO player2_elo FROM profiles WHERE id = player2_id;

    -- Calculate expected scores
    expected_score1 := 1.0 / (1.0 + power(10.0, (player2_elo - player1_elo) / 400.0));
    expected_score2 := 1.0 / (1.0 + power(10.0, (player1_elo - player2_elo) / 400.0));

    -- Calculate new ratings
    IF player1_won THEN
        new_elo1 := player1_elo + (k * (1 - expected_score1))::INTEGER;
        new_elo2 := player2_elo + (k * (0 - expected_score2))::INTEGER;
    ELSE
        new_elo1 := player1_elo + (k * (0 - expected_score1))::INTEGER;
        new_elo2 := player2_elo + (k * (1 - expected_score2))::INTEGER;
    END IF;

    -- Update ratings
    UPDATE profiles
    SET chess_elo = new_elo1,
        chess_games_played = chess_games_played + 1,
        chess_games_won = CASE WHEN player1_won THEN chess_games_won + 1 ELSE chess_games_won END
    WHERE id = player1_id;

    UPDATE profiles
    SET chess_elo = new_elo2,
        chess_games_played = chess_games_played + 1,
        chess_games_won = CASE WHEN NOT player1_won THEN chess_games_won + 1 ELSE chess_games_won END
    WHERE id = player2_id;
END;
$$;

-- Create function to process chess bets
CREATE OR REPLACE FUNCTION process_chess_bets(
    game_id UUID,
    winner_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update winning bets
    UPDATE chess_bets
    SET status = 'won',
        payout_amount = bet_amount * payout_multiplier
    WHERE game_id = game_id
    AND bet_on_player_id = winner_id;

    -- Update losing bets
    UPDATE chess_bets
    SET status = 'lost',
        payout_amount = 0
    WHERE game_id = game_id
    AND bet_on_player_id != winner_id;

    -- Process payouts
    UPDATE profiles
    SET balance = balance + cb.payout_amount
    FROM chess_bets cb
    WHERE profiles.id = cb.user_id
    AND cb.game_id = game_id
    AND cb.status = 'won';
END;
$$;
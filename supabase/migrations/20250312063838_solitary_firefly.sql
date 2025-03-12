/*
  # Gaming Platform Database Schema

  1. New Tables
    - `games`
      - Game sessions and results
    - `game_participants`
      - Player participation in games
    - `transactions`
      - Financial transactions
    - `leaderboards`
      - Player rankings
    - `chat_messages`
      - In-game chat system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  winner_id uuid REFERENCES profiles(id),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read games"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create games"
  ON games FOR INSERT
  TO authenticated
  USING (true);

-- Game participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id),
  user_id uuid REFERENCES profiles(id),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  result text,
  score numeric DEFAULT 0
);

ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read game participants"
  ON game_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join games"
  ON game_participants FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  game_id uuid REFERENCES games(id),
  amount numeric NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  game_type text NOT NULL,
  score numeric DEFAULT 0,
  period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL
);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboards"
  ON leaderboards FOR SELECT
  TO authenticated
  USING (true);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  game_id uuid REFERENCES games(id),
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_system boolean DEFAULT false,
  is_deleted boolean DEFAULT false
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

-- Process game result function
CREATE OR REPLACE FUNCTION process_game_result(
  p_game_id uuid,
  p_winner_id uuid,
  p_participants jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update game status
  UPDATE games
  SET status = 'completed',
      ended_at = now(),
      winner_id = p_winner_id
  WHERE id = p_game_id;

  -- Process participants
  FOR participant IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    -- Update participant record
    INSERT INTO game_participants (game_id, user_id, result, score)
    VALUES (
      p_game_id,
      (participant->>'user_id')::uuid,
      participant->>'result',
      (participant->>'score')::numeric
    );

    -- Update user balance
    UPDATE profiles
    SET balance = balance + (participant->>'score')::numeric,
        updated_at = now()
    WHERE id = (participant->>'user_id')::uuid;

    -- Record transaction
    INSERT INTO transactions (user_id, game_id, amount, type)
    VALUES (
      (participant->>'user_id')::uuid,
      p_game_id,
      (participant->>'score')::numeric,
      CASE WHEN (participant->>'score')::numeric > 0 THEN 'win' ELSE 'loss' END
    );
  END LOOP;
END;
$$;
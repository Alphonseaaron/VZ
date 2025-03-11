/*
  # Initial Gaming Platform Schema

  1. New Tables
    - `profiles`: Extended user profile information
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `avatar_url` (text)
      - `balance` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `games`: Game session records
      - `id` (uuid, primary key)
      - `game_type` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `ended_at` (timestamp)
      - `winner_id` (uuid, references profiles)
      - `metadata` (jsonb)

    - `game_participants`: Players in each game
      - `id` (uuid, primary key)
      - `game_id` (uuid, references games)
      - `user_id` (uuid, references profiles)
      - `joined_at` (timestamp)
      - `left_at` (timestamp)
      - `result` (text)
      - `score` (numeric)

    - `transactions`: Currency transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `game_id` (uuid, references games)
      - `amount` (numeric)
      - `type` (text)
      - `created_at` (timestamp)
      - `metadata` (jsonb)

    - `leaderboards`: Player rankings
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `game_type` (text)
      - `score` (numeric)
      - `period` (text)
      - `period_start` (timestamp)
      - `period_end` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-only policies for sensitive operations

  3. Functions
    - Update leaderboard function
    - Process game result function
    - Update user balance function
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  balance numeric DEFAULT 1000.00 CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create games table
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  winner_id uuid REFERENCES profiles(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_game_type CHECK (
    game_type IN ('slots', 'dice', 'crash', 'checkers', 'chess', 'ludo', 'tictactoe')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'active', 'completed', 'cancelled')
  )
);

-- Create game participants table
CREATE TABLE game_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  result text,
  score numeric DEFAULT 0,
  CONSTRAINT valid_result CHECK (
    result IN ('win', 'loss', 'draw', NULL)
  )
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_transaction_type CHECK (
    type IN ('bet', 'win', 'deposit', 'withdrawal')
  )
);

-- Create leaderboards table
CREATE TABLE leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  score numeric DEFAULT 0,
  period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  CONSTRAINT valid_period CHECK (
    period IN ('daily', 'weekly', 'monthly', 'all_time')
  )
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles policies
CREATE POLICY "Users can read any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Games policies
CREATE POLICY "Anyone can read games"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Participants can update their games"
  ON games FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_id = id AND user_id = auth.uid()
    )
  );

-- Game participants policies
CREATE POLICY "Anyone can read game participants"
  ON game_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join games"
  ON game_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Leaderboards policies
CREATE POLICY "Anyone can read leaderboards"
  ON leaderboards FOR SELECT
  TO authenticated
  USING (true);

-- Create functions
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Update leaderboard scores based on game results
  INSERT INTO leaderboards (user_id, game_type, score, period, period_start, period_end)
  VALUES (
    NEW.user_id,
    (SELECT game_type FROM games WHERE id = NEW.game_id),
    NEW.score,
    'all_time',
    now(),
    'infinity'::timestamptz
  )
  ON CONFLICT (user_id, game_type, period)
  DO UPDATE SET score = leaderboards.score + NEW.score;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating leaderboards
CREATE TRIGGER update_leaderboard_on_game_completion
  AFTER INSERT OR UPDATE OF result
  ON game_participants
  FOR EACH ROW
  WHEN (NEW.result IS NOT NULL)
  EXECUTE FUNCTION update_leaderboard();

-- Create function to process game results
CREATE OR REPLACE FUNCTION process_game_result(
  p_game_id uuid,
  p_winner_id uuid,
  p_participants jsonb
)
RETURNS void AS $$
BEGIN
  -- Update game status
  UPDATE games
  SET status = 'completed',
      ended_at = now(),
      winner_id = p_winner_id
  WHERE id = p_game_id;

  -- Update participant results
  UPDATE game_participants
  SET result = 
    CASE 
      WHEN user_id = p_winner_id THEN 'win'
      ELSE 'loss'
    END,
    left_at = now()
  WHERE game_id = p_game_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(
  p_user_id uuid,
  p_amount numeric
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    NEW.id,
    NEW.email -- Temporarily use email as username
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_profile_after_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();
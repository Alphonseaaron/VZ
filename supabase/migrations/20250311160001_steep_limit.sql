/*
  # Initial Casino App Schema

  1. New Tables
    - users (handled by Supabase Auth)
    - user_profiles
      - user_id (references auth.users)
      - username
      - balance
      - created_at
    - game_sessions
      - id
      - user_id
      - game_type
      - bet_amount
      - outcome_amount
      - created_at
    - multiplayer_games
      - id
      - game_type
      - status
      - winner_id
      - created_at
    - game_participants
      - id
      - game_id
      - user_id
      - role (player/spectator)
      - bet_amount
      
  2. Security
    - Enable RLS on all tables
    - Add policies for user access
*/

-- Create user_profiles table
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create game_sessions table
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    game_type TEXT NOT NULL,
    bet_amount DECIMAL(10,2) NOT NULL,
    outcome_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create multiplayer_games table
CREATE TABLE multiplayer_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type TEXT NOT NULL,
    status TEXT DEFAULT 'waiting',
    winner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create game_participants table
CREATE TABLE game_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES multiplayer_games(id),
    user_id UUID REFERENCES auth.users(id),
    role TEXT DEFAULT 'player',
    bet_amount DECIMAL(10,2) DEFAULT 0.00
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own game sessions"
    ON game_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create game sessions"
    ON game_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read multiplayer games"
    ON multiplayer_games FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can read game participants"
    ON game_participants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can join games"
    ON game_participants FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
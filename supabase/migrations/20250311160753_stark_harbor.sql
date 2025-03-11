/*
  # Add Crash Game Tables

  1. New Tables
    - crash_games: Stores game sessions and crash points
      - id (uuid, primary key)
      - crash_point (numeric)
      - created_at (timestamp)
      - ended_at (timestamp)
      - seed (text)
      - hash (text)

    - crash_bets: Stores player bets and outcomes
      - id (uuid, primary key)
      - user_id (references auth.users)
      - game_id (references crash_games)
      - bet_amount (numeric)
      - auto_cashout (numeric, nullable)
      - cashed_out (boolean)
      - cashout_multiplier (numeric, nullable)
      - payout (numeric)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create crash_games table
CREATE TABLE IF NOT EXISTS public.crash_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    crash_point numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    seed text,
    hash text
);

-- Create crash_bets table
CREATE TABLE IF NOT EXISTS public.crash_bets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    game_id uuid REFERENCES crash_games,
    bet_amount numeric(10,2) NOT NULL,
    auto_cashout numeric(10,2),
    cashed_out boolean DEFAULT false,
    cashout_multiplier numeric(10,2),
    payout numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crash_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crash_bets ENABLE ROW LEVEL SECURITY;

-- Create policies for crash_games
CREATE POLICY "Anyone can view crash games"
    ON public.crash_games
    FOR SELECT
    TO public
    USING (true);

-- Create policies for crash_bets
CREATE POLICY "Users can view all crash bets"
    ON public.crash_bets
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own bets"
    ON public.crash_bets
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets"
    ON public.crash_bets
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
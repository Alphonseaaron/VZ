/*
  # Fix Missing Tables

  1. Changes
    - Create missing profiles table
    - Create missing crash_games table
    - Add necessary indexes and constraints
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  avatar_url text,
  balance numeric DEFAULT 1000.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  banned boolean DEFAULT false
);

-- Create crash_games table if it doesn't exist
CREATE TABLE IF NOT EXISTS crash_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crash_point numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  seed text,
  hash text
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crash_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view crash games"
  ON crash_games FOR SELECT
  TO authenticated
  USING (true);

-- Create trigger for new user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
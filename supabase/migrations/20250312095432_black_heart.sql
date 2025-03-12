/*
  # Fix Authentication Issues

  1. Changes
    - Add email column to profiles table
    - Fix trigger function for new user creation
    - Add proper constraints and defaults
*/

-- Add email column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, balance)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email, -- Initially use email as username
    1000.00    -- Starting balance
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure proper RLS policies
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Add proper indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
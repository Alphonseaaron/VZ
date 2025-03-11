/*
  # Add Admin Functionality

  1. Changes
    - Add admin role column to profiles
    - Add banned column to profiles
    - Add game settings table
    - Add admin policies
*/

-- Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Create game_settings table
CREATE TABLE IF NOT EXISTS game_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(game_type, setting_key)
);

-- Enable RLS
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for game_settings
CREATE POLICY "Admins can manage game settings"
    ON game_settings
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Create policy for admin access
CREATE POLICY "Admins can manage all profiles"
    ON profiles
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
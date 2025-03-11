/*
  # Add Dice Game Tables and Functions

  1. New Tables
    - dice_rolls: Stores history of dice game rolls
      - id (uuid, primary key)
      - user_id (references auth.users)
      - target_number (integer)
      - roll_result (integer)
      - bet_amount (numeric)
      - is_over (boolean)
      - won (boolean)
      - payout (numeric)
      - created_at (timestamp)

  2. Security
    - Enable RLS on dice_rolls table
    - Add policies for authenticated users
*/

-- Create dice_rolls table
CREATE TABLE IF NOT EXISTS public.dice_rolls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    target_number integer NOT NULL,
    roll_result integer NOT NULL,
    bet_amount numeric(10,2) NOT NULL,
    is_over boolean NOT NULL,
    won boolean NOT NULL,
    payout numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own rolls"
    ON public.dice_rolls
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rolls"
    ON public.dice_rolls
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
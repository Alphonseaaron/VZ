/*
  # Add Chess Game Tables

  1. New Tables
    - chess_games: Stores chess game states
      - id (uuid, primary key)
      - white_player_id (references profiles)
      - black_player_id (references profiles)
      - current_fen (text)
      - move_history (jsonb)
      - status (text)
      - created_at (timestamp)
      - updated_at (timestamp)
      - winner_id (references profiles)
      - time_control (jsonb)

  2. Security
    - Enable RLS on chess_games table
    - Add policies for authenticated users
*/

-- Create chess_games table
CREATE TABLE IF NOT EXISTS chess_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id uuid REFERENCES profiles(id),
    black_player_id uuid REFERENCES profiles(id),
    current_fen text NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    move_history jsonb DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    winner_id uuid REFERENCES profiles(id),
    time_control jsonb DEFAULT '{"initial": 600, "increment": 0}'::jsonb,
    CONSTRAINT valid_status CHECK (
        status IN ('active', 'completed', 'abandoned', 'draw')
    )
);

-- Enable RLS
ALTER TABLE chess_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Players can view their games"
    ON chess_games
    FOR SELECT
    USING (
        auth.uid() = white_player_id OR
        auth.uid() = black_player_id
    );

CREATE POLICY "Players can update their active games"
    ON chess_games
    FOR UPDATE
    USING (
        (auth.uid() = white_player_id OR auth.uid() = black_player_id) AND
        status = 'active'
    );

-- Create function to update game state
CREATE OR REPLACE FUNCTION update_chess_game(
    p_game_id uuid,
    p_fen text,
    p_move jsonb,
    p_status text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE chess_games
    SET
        current_fen = p_fen,
        move_history = move_history || p_move,
        status = COALESCE(p_status, status),
        updated_at = now()
    WHERE id = p_game_id;
END;
$$;

-- Create function to handle game completion
CREATE OR REPLACE FUNCTION complete_chess_game(
    p_game_id uuid,
    p_winner_id uuid,
    p_status text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE chess_games
    SET
        status = p_status,
        winner_id = p_winner_id,
        updated_at = now()
    WHERE id = p_game_id;

    -- Update player ratings
    -- TODO: Implement ELO rating updates
END;
$$;
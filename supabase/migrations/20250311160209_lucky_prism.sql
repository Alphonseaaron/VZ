/*
  # Add initial balance for new users

  1. Changes
    - Add trigger to set initial balance for new users
    - Add function to handle balance updates

  2. Security
    - Function is security definer to ensure proper balance management
*/

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, username, balance)
  VALUES (new.id, new.email, 1000.00);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
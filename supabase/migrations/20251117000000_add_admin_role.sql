-- Add admin role to users metadata
-- Admins can be set manually in Supabase dashboard under Authentication > Users > User > Raw user meta data
-- Add: { "role": "admin" }

-- Update RLS policies to allow admins to view all data

-- Teams: Admins can view all teams
CREATE POLICY "Admins can view all teams"
  ON public.teams FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Players: Admins can view all players
CREATE POLICY "Admins can view all players"
  ON public.players FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Scores: Admins can view all scores
CREATE POLICY "Admins can view all scores"
  ON public.scores FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

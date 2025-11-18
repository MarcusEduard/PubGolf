-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create players table
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  player_order int NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create scores table
CREATE TABLE public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  hole_number int NOT NULL,
  score int NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(player_id, hole_number)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view their own teams"
  ON public.teams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for players
CREATE POLICY "Users can view players in their teams"
  ON public.players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create players in their teams"
  ON public.players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update players in their teams"
  ON public.players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete players in their teams"
  ON public.players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.user_id = auth.uid()
    )
  );

-- RLS Policies for scores
CREATE POLICY "Users can view scores for their team players"
  ON public.scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      JOIN public.teams ON teams.id = players.team_id
      WHERE players.id = scores.player_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scores for their team players"
  ON public.scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      JOIN public.teams ON teams.id = players.team_id
      WHERE players.id = scores.player_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scores for their team players"
  ON public.scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      JOIN public.teams ON teams.id = players.team_id
      WHERE players.id = scores.player_id
      AND teams.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scores for their team players"
  ON public.scores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      JOIN public.teams ON teams.id = players.team_id
      WHERE players.id = scores.player_id
      AND teams.user_id = auth.uid()
    )
  );
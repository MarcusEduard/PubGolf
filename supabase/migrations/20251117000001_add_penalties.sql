-- Create penalties table
CREATE TABLE public.penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  points int NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

-- Admins can view all penalties
CREATE POLICY "Admins can view all penalties"
  ON public.penalties FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Admins can create penalties
CREATE POLICY "Admins can create penalties"
  ON public.penalties FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Users can view penalties for their own teams
CREATE POLICY "Users can view their team penalties"
  ON public.penalties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = penalties.team_id
      AND teams.user_id = auth.uid()
    )
  );

-- Create leaderboard table for tracking user shards and rankings
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  total_shards INTEGER NOT NULL DEFAULT 0,
  rooms_completed INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for leaderboard access
CREATE POLICY "Anyone can view leaderboard" 
ON public.leaderboard 
FOR SELECT 
USING (true); -- Public leaderboard data

CREATE POLICY "Users can insert their own leaderboard data" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leaderboard data" 
ON public.leaderboard 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_leaderboard_total_shards ON public.leaderboard(total_shards DESC);
CREATE INDEX idx_leaderboard_user_id ON public.leaderboard(user_id);
CREATE INDEX idx_leaderboard_last_played ON public.leaderboard(last_played DESC);

-- Function to update leaderboard when room is completed
CREATE OR REPLACE FUNCTION public.update_leaderboard(
  p_user_id UUID,
  p_email TEXT,
  p_shards_earned INTEGER,
  p_current_score INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_rank INTEGER;
  total_players INTEGER;
  result JSON;
BEGIN
  -- Upsert leaderboard data
  INSERT INTO public.leaderboard (user_id, email, total_shards, rooms_completed, best_score, last_played)
  VALUES (p_user_id, p_email, p_shards_earned, 1, p_current_score, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_shards = leaderboard.total_shards + p_shards_earned,
    rooms_completed = leaderboard.rooms_completed + 1,
    best_score = GREATEST(leaderboard.best_score, p_current_score),
    last_played = now(),
    updated_at = now();
  
  -- Get updated ranking info
  SELECT 
    rank_position,
    total_count
  INTO current_rank, total_players
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_shards DESC, best_score DESC, last_played ASC) as rank_position,
      COUNT(*) OVER () as total_count
    FROM public.leaderboard
  ) ranked_data
  WHERE user_id = p_user_id;
  
  -- Return ranking information
  SELECT json_build_object(
    'rank', current_rank,
    'total_players', total_players,
    'total_shards', (SELECT total_shards FROM public.leaderboard WHERE user_id = p_user_id),
    'rooms_completed', (SELECT rooms_completed FROM public.leaderboard WHERE user_id = p_user_id)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get leaderboard with user context
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_context(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  rank INTEGER,
  user_id UUID,
  email TEXT,
  total_shards INTEGER,
  rooms_completed INTEGER,
  best_score INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC)::INTEGER as rank,
    l.user_id,
    l.email,
    l.total_shards,
    l.rooms_completed,
    l.best_score,
    (l.user_id = p_user_id) as is_current_user
  FROM public.leaderboard l
  ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC;
END;
$$;
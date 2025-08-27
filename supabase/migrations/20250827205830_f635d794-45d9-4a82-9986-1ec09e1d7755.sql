-- Fix the remaining search path security warning

-- Update update_leaderboard function to set search_path properly  
CREATE OR REPLACE FUNCTION public.update_leaderboard(p_user_id uuid, p_email text, p_shards_earned integer, p_current_score integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_rank INTEGER;
  total_players INTEGER;
  result JSON;
BEGIN
  -- Upsert leaderboard data - we still need email for internal lookups but it won't be exposed in queries
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
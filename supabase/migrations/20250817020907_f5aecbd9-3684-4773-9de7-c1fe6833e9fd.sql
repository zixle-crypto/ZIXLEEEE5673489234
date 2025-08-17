-- Update the leaderboard function to exclude owner account
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_context(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(rank integer, user_id uuid, username text, total_shards integer, rooms_completed integer, best_score integer, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC)::INTEGER as rank,
    l.user_id,
    -- Use username from email (before @) instead of exposing full email
    split_part(l.email, '@', 1) as username,
    l.total_shards,
    l.rooms_completed,
    l.best_score,
    (l.user_id = p_user_id) as is_current_user
  FROM public.leaderboard l
  WHERE l.email != 'iarmaanindcode@gmail.com'  -- Exclude owner account
  ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC;
END;
$function$
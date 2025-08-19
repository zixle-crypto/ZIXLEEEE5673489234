-- Fix the search path security warning for the increment_user_shards function
CREATE OR REPLACE FUNCTION public.increment_user_shards(user_id_param UUID, shard_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update shards for the user, creating record if it doesn't exist
  INSERT INTO public.user_game_data (user_id, total_shards)
  VALUES (user_id_param, shard_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    total_shards = public.user_game_data.total_shards + shard_amount,
    updated_at = now();
END;
$$;
-- CRITICAL SECURITY FIXES

-- 1. Fix PII exposure in leaderboard - create sanitized version
DROP FUNCTION IF EXISTS public.get_leaderboard_with_context(uuid);

CREATE OR REPLACE FUNCTION public.get_leaderboard_with_context(p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(rank integer, user_id uuid, username text, total_shards integer, rooms_completed integer, best_score integer, is_current_user boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC;
END;
$$;

-- 2. Fix RLS on subscribers table - restrict to own records
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id OR auth.email() = email);

CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.email() = email);

-- Keep insert policy but make it more restrictive
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "Users can create their own subscription" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.email() = email);

-- 3. Add missing RLS on user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription data" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription data" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription data" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Add missing RLS on daily_usage table
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage data" 
ON public.daily_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage data" 
ON public.daily_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage data" 
ON public.daily_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Harden SECURITY DEFINER functions with search_path
CREATE OR REPLACE FUNCTION public.update_leaderboard(p_user_id uuid, p_email text, p_shards_earned integer, p_current_score integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, email, score, progress)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    0,
    0
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_special_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cube_ids TEXT[] := ARRAY[
        'copper_cube',
        'bronze_cube', 
        'silver_cube',
        'emerald_cube',
        'golden_cube',
        'diamond_cube',
        'ruby_cube',
        'sapphire_cube',
        'prismatic_cube',
        'void_cube'
    ];
    cube_id TEXT;
BEGIN
    -- Check if this is the special email
    IF NEW.email = 'iarmaanindcode@gmail.com' THEN
        -- Add all cubes with quantity 5 each
        FOREACH cube_id IN ARRAY cube_ids
        LOOP
            INSERT INTO public.user_inventory (user_id, cube_id, quantity)
            VALUES (NEW.user_id, cube_id, 5);
        END LOOP;
        
        -- Give extra shards
        UPDATE public.user_game_data 
        SET total_shards = 10000 
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 6. Create rate limiting table for verification codes
CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  attempt_count integer DEFAULT 1,
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempt data" 
ON public.verification_attempts 
FOR SELECT 
USING (email = auth.email());

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_verification_attempts_email ON public.verification_attempts(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_expires ON public.verification_codes(email, expires_at);
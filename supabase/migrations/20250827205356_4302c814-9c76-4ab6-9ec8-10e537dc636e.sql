-- First, let's update the handle_new_user function to generate unique usernames
-- and modify the leaderboard system to use usernames instead of emails

-- Function to generate unique username
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    base_name text;
    potential_username text;
    counter integer := 0;
    username_exists boolean;
BEGIN
    -- Extract base name from email (part before @)
    base_name := split_part(base_email, '@', 1);
    
    -- Clean the base name (remove special characters, convert to lowercase)
    base_name := regexp_replace(lower(base_name), '[^a-z0-9]', '', 'g');
    
    -- Ensure minimum length
    IF length(base_name) < 3 THEN
        base_name := 'player' || base_name;
    END IF;
    
    -- Try the base name first
    potential_username := base_name;
    
    LOOP
        -- Check if username already exists in profiles table
        SELECT EXISTS(
            SELECT 1 FROM public.profiles 
            WHERE username = potential_username
        ) INTO username_exists;
        
        -- If username doesn't exist, use it
        IF NOT username_exists THEN
            RETURN potential_username;
        END IF;
        
        -- If exists, try with a number suffix
        counter := counter + 1;
        potential_username := base_name || counter::text;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            potential_username := base_name || extract(epoch from now())::bigint::text;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN potential_username;
END;
$$;

-- Update the handle_new_user function to generate unique usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    generated_username text;
BEGIN
    -- Generate a unique username
    generated_username := public.generate_unique_username(NEW.email);
    
    INSERT INTO public.profiles (user_id, username, email, score, progress)
    VALUES (
        NEW.id,
        generated_username,
        NEW.email,
        0,
        0
    );
    RETURN NEW;
END;
$$;

-- Update the leaderboard function to use usernames from profiles table and NOT expose emails
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_context(p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(rank integer, user_id uuid, username text, total_shards integer, rooms_completed integer, best_score integer, is_current_user boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC)::INTEGER as rank,
    l.user_id,
    COALESCE(p.username, 'Player') as username, -- Use actual username from profiles, fallback to 'Player'
    l.total_shards,
    l.rooms_completed,
    l.best_score,
    (l.user_id = p_user_id) as is_current_user
  FROM public.leaderboard l
  LEFT JOIN public.profiles p ON l.user_id = p.user_id
  WHERE l.email != 'iarmaanindcode@gmail.com'  -- Exclude owner account
  ORDER BY l.total_shards DESC, l.best_score DESC, l.last_played ASC;
END;
$$;

-- Update the update_leaderboard function to not store emails in a way that exposes them
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
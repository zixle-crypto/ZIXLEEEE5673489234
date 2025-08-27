-- Fix the search path security warnings by updating the functions

-- Update generate_unique_username function to set search_path properly
CREATE OR REPLACE FUNCTION public.generate_unique_username(base_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update get_leaderboard_with_context function to set search_path properly
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
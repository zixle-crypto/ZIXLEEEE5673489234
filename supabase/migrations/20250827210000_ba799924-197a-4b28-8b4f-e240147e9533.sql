-- Fix all remaining functions to have proper search_path set

-- Update cleanup_expired_codes function
CREATE OR REPLACE FUNCTION public.cleanup_expired_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() OR verified = true;
END;
$$;

-- Update increment_user_shards function
CREATE OR REPLACE FUNCTION public.increment_user_shards(user_id_param uuid, shard_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update handle_special_user_signup function
CREATE OR REPLACE FUNCTION public.handle_special_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
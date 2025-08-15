-- Add all cubes to the specified user email when they exist
DO $$
DECLARE
    target_user_id UUID;
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
    -- Find user by email
    SELECT user_id INTO target_user_id 
    FROM profiles 
    WHERE email = 'iarmaanindcode@gmail.com';
    
    -- If user exists, add all cubes
    IF target_user_id IS NOT NULL THEN
        FOREACH cube_id IN ARRAY cube_ids
        LOOP
            INSERT INTO user_inventory (user_id, cube_id, quantity)
            VALUES (target_user_id, cube_id, 5)
            ON CONFLICT (user_id, cube_id) 
            DO UPDATE SET quantity = user_inventory.quantity + 5;
        END LOOP;
        
        -- Also give them lots of shards
        UPDATE user_game_data 
        SET total_shards = 10000 
        WHERE user_id = target_user_id;
        
        RAISE NOTICE 'Added all cubes to user iarmaanindcode@gmail.com';
    ELSE
        RAISE NOTICE 'User iarmaanindcode@gmail.com not found';
    END IF;
END $$;

-- Create a function to auto-give cubes to specific emails on signup
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

-- Create trigger to run after profile creation
CREATE TRIGGER special_user_cube_grant
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_special_user_signup();
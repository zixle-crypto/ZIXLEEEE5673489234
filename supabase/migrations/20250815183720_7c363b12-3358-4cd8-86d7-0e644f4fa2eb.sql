-- Manually add cubes for the specific user
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
    -- Try to find user by email in auth.users (using email from metadata)
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'iarmaanindcode@gmail.com';
    
    -- If user exists in auth but not in profiles, create profile first
    IF target_user_id IS NOT NULL THEN
        -- Insert into profiles if not exists
        INSERT INTO public.profiles (user_id, username, email, score, progress)
        VALUES (
            target_user_id,
            split_part('iarmaanindcode@gmail.com', '@', 1),
            'iarmaanindcode@gmail.com',
            0,
            0
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Insert into user_game_data if not exists
        INSERT INTO public.user_game_data (user_id, total_shards)
        VALUES (target_user_id, 10000)
        ON CONFLICT (user_id) DO UPDATE SET total_shards = 10000;
        
        -- Add all cubes
        FOREACH cube_id IN ARRAY cube_ids
        LOOP
            INSERT INTO public.user_inventory (user_id, cube_id, quantity)
            VALUES (target_user_id, cube_id, 5)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Added all cubes to user iarmaanindcode@gmail.com with user_id %', target_user_id;
    ELSE
        RAISE NOTICE 'User iarmaanindcode@gmail.com not found in auth.users';
    END IF;
END $$;
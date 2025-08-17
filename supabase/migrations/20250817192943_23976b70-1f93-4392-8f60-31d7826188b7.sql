-- Add equipped_cube_id column to user_game_data table
ALTER TABLE public.user_game_data 
ADD COLUMN equipped_cube_id TEXT DEFAULT NULL;
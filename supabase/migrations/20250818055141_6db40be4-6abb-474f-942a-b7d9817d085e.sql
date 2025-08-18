-- Remove preferred_device column from user_game_data table
ALTER TABLE public.user_game_data DROP COLUMN IF EXISTS preferred_device;
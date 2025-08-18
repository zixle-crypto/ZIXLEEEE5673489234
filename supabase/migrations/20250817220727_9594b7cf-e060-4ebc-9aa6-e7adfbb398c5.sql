-- Add preferred_device column to user_game_data table
ALTER TABLE public.user_game_data 
ADD COLUMN preferred_device TEXT CHECK (preferred_device IN ('desktop', 'mobile', 'tablet'));
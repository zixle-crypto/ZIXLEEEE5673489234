-- Fix syntax error in function

-- Add missing DELETE policy for user_game_data
CREATE POLICY "Users can delete their own game data" 
ON public.user_game_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix update_updated_at_column function with proper syntax
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
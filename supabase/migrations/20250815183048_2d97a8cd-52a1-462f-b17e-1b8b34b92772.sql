-- Fix function dependencies and security warnings

-- Add missing DELETE policy for user_game_data
CREATE POLICY "Users can delete their own game data" 
ON public.user_game_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update existing functions to have proper search_path
-- First drop the trigger, then the function, then recreate both
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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
  
  -- Also create initial game data for the user
  INSERT INTO public.user_game_data (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fix cleanup_expired_codes function
DROP FUNCTION IF EXISTS public.cleanup_expired_codes();
CREATE OR REPLACE FUNCTION public.cleanup_expired_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() OR verified = true;
END;
$$;

-- Fix update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
$$;

-- Recreate the triggers that use this function
CREATE TRIGGER update_user_inventory_updated_at
BEFORE UPDATE ON public.user_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_game_data_updated_at
BEFORE UPDATE ON public.user_game_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Fix email exposure security issue in leaderboard table
-- Remove the overly permissive "Anyone can view leaderboard" policy
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;

-- Create a more restrictive policy that prevents direct email access
-- Users can only see their own leaderboard entry directly
CREATE POLICY "Users can view their own leaderboard entry" 
ON public.leaderboard 
FOR SELECT 
USING (auth.uid() = user_id);

-- Public leaderboard data should only be accessed through the 
-- get_leaderboard_with_context RPC function which masks emails
-- and returns usernames instead
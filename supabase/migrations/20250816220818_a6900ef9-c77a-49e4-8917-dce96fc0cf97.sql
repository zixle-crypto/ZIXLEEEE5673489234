-- Fix critical security vulnerability in user_data table
-- Drop the insecure policy that allows public access
DROP POLICY IF EXISTS "Users can access own data" ON public.user_data;

-- Create secure RLS policies that restrict access to user's own data only
CREATE POLICY "Users can view their own data" 
ON public.user_data 
FOR SELECT 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own data" 
ON public.user_data 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own data" 
ON public.user_data 
FOR UPDATE 
USING (auth.uid()::text = user_id) 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own data" 
ON public.user_data 
FOR DELETE 
USING (auth.uid()::text = user_id);
-- Fix security vulnerability in verification_codes table
-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.verification_codes;

-- Create secure policies that actually restrict access
CREATE POLICY "Users can view their own verification codes" 
ON public.verification_codes 
FOR SELECT 
USING (email = auth.email());

CREATE POLICY "Users can update their own verification codes" 
ON public.verification_codes 
FOR UPDATE 
USING (email = auth.email());

-- Keep the insert policy as is since anyone needs to be able to request codes
-- But add a comment for clarity
COMMENT ON POLICY "Anyone can insert verification codes" ON public.verification_codes 
IS 'Allows anyone to request verification codes - needed for registration flow';
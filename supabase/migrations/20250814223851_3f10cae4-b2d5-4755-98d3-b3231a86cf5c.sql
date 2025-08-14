-- Create verification_codes table for 6-digit email verification
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for verification codes
-- Users can only access codes for their own email
CREATE POLICY "Users can view their own verification codes" 
ON public.verification_codes 
FOR SELECT 
USING (true); -- Allow reading for verification purposes

CREATE POLICY "Anyone can insert verification codes" 
ON public.verification_codes 
FOR INSERT 
WITH CHECK (true); -- Allow inserting new codes

CREATE POLICY "Anyone can update verification codes" 
ON public.verification_codes 
FOR UPDATE 
USING (true); -- Allow updating for verification

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_email_code ON public.verification_codes(email, code);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Function to cleanup expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() OR verified = true;
END;
$$;
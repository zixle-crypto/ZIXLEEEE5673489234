-- Create crate_purchases table to track successful purchases
CREATE TABLE public.crate_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  crate_type TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  cubes_awarded JSONB,
  bonus_shards INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crate_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for crate purchases
CREATE POLICY "Users can view their own crate purchases" 
ON public.crate_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crate purchases" 
ON public.crate_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can update crate purchases" 
ON public.crate_purchases 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_crate_purchases_updated_at
BEFORE UPDATE ON public.crate_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
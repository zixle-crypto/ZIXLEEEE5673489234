-- Create gifts table for tracking sent gifts
CREATE TABLE public.gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  cube_id TEXT NOT NULL,
  cube_name TEXT NOT NULL,
  cube_cost INTEGER NOT NULL,
  recipient TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('email', 'github')),
  message TEXT DEFAULT '',
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_by UUID DEFAULT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Create policies for gifts table
CREATE POLICY "Users can view gifts they sent" 
ON public.gifts 
FOR SELECT 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view gifts sent to their email" 
ON public.gifts 
FOR SELECT 
USING (auth.email() = recipient AND recipient_type = 'email');

CREATE POLICY "Users can create gifts" 
ON public.gifts 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update gifts they received" 
ON public.gifts 
FOR UPDATE 
USING (
  (auth.email() = recipient AND recipient_type = 'email') OR 
  auth.uid() = sender_id
);

-- Create trigger for updated_at
CREATE TRIGGER update_gifts_updated_at
BEFORE UPDATE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_gifts_recipient ON public.gifts(recipient);
CREATE INDEX idx_gifts_sender ON public.gifts(sender_id);
CREATE INDEX idx_gifts_claimed ON public.gifts(claimed) WHERE claimed = false;
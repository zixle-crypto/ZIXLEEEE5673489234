-- Create user inventory table for storing purchased cubes
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cube_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user game data table for storing shards, active power-ups, etc.
CREATE TABLE public.user_game_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_shards INTEGER NOT NULL DEFAULT 0,
  active_shard_multiplier DECIMAL NOT NULL DEFAULT 1.0,
  active_speed_boost DECIMAL NOT NULL DEFAULT 1.0,
  active_protection INTEGER NOT NULL DEFAULT 0,
  shard_multiplier_rooms_left INTEGER NOT NULL DEFAULT 0,
  speed_boost_rooms_left INTEGER NOT NULL DEFAULT 0,
  protection_rooms_left INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_inventory
CREATE POLICY "Users can view their own inventory" 
ON public.user_inventory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inventory items" 
ON public.user_inventory 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items" 
ON public.user_inventory 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items" 
ON public.user_inventory 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_game_data
CREATE POLICY "Users can view their own game data" 
ON public.user_game_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game data" 
ON public.user_game_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game data" 
ON public.user_game_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_inventory_updated_at
BEFORE UPDATE ON public.user_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_game_data_updated_at
BEFORE UPDATE ON public.user_game_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_cube_id ON public.user_inventory(cube_id);
CREATE INDEX idx_user_game_data_user_id ON public.user_game_data(user_id);
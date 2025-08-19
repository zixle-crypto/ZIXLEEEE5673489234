-- Create daily challenges system
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL, -- 'speed_run', 'cube_collector', 'streak_master', 'survival'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  reward_shards INTEGER NOT NULL,
  reward_cubes JSONB,
  difficulty TEXT NOT NULL DEFAULT 'easy', -- 'easy', 'medium', 'hard', 'expert'
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user challenge progress
CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create achievements system
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'progress', 'collection', 'speed', 'special'
  rarity TEXT NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  target_value INTEGER,
  reward_shards INTEGER NOT NULL DEFAULT 0,
  reward_cubes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create power-ups system
CREATE TABLE public.power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  power_up_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  effect_type TEXT NOT NULL, -- 'speed_boost', 'shield', 'magnet', 'double_shards', 'time_slow'
  effect_value NUMERIC NOT NULL,
  duration_seconds INTEGER NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  cost_shards INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user power-up inventory
CREATE TABLE public.user_power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  power_up_id UUID REFERENCES public.power_ups(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, power_up_id)
);

-- Create streak tracking
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  login_streak INTEGER NOT NULL DEFAULT 0,
  play_streak INTEGER NOT NULL DEFAULT 0,
  last_login DATE,
  last_play DATE,
  max_login_streak INTEGER NOT NULL DEFAULT 0,
  max_play_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bonus events
CREATE TABLE public.bonus_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'double_shards', 'cube_rain', 'lucky_hour'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1.0,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Daily challenges (everyone can read, only service can modify)
CREATE POLICY "Anyone can view daily challenges" ON public.daily_challenges FOR SELECT USING (true);
CREATE POLICY "Service can manage daily challenges" ON public.daily_challenges FOR ALL USING (true);

-- User challenge progress (users can manage their own)
CREATE POLICY "Users can manage their own challenge progress" ON public.user_challenge_progress
FOR ALL USING (auth.uid() = user_id);

-- Achievements (everyone can read, only service can modify)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Service can manage achievements" ON public.achievements FOR ALL USING (true);

-- User achievements (users can manage their own)
CREATE POLICY "Users can manage their own achievements" ON public.user_achievements
FOR ALL USING (auth.uid() = user_id);

-- Power-ups (everyone can read, only service can modify)
CREATE POLICY "Anyone can view power-ups" ON public.power_ups FOR SELECT USING (true);
CREATE POLICY "Service can manage power-ups" ON public.power_ups FOR ALL USING (true);

-- User power-ups (users can manage their own)
CREATE POLICY "Users can manage their own power-ups" ON public.user_power_ups
FOR ALL USING (auth.uid() = user_id);

-- User streaks (users can manage their own)
CREATE POLICY "Users can manage their own streaks" ON public.user_streaks
FOR ALL USING (auth.uid() = user_id);

-- Bonus events (everyone can read, only service can modify)
CREATE POLICY "Anyone can view bonus events" ON public.bonus_events FOR SELECT USING (true);
CREATE POLICY "Service can manage bonus events" ON public.bonus_events FOR ALL USING (true);

-- Add update triggers
CREATE TRIGGER update_user_power_ups_updated_at
BEFORE UPDATE ON public.user_power_ups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
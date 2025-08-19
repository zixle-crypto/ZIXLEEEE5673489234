-- Insert sample power-ups if they don't exist
INSERT INTO public.power_ups (power_up_key, name, description, icon, effect_type, effect_value, duration_seconds, rarity, cost_shards) VALUES
('speed_boost_basic', 'Speed Boost', 'Increases movement speed by 2x for 30 seconds', '⚡', 'speed_boost', 2.0, 30, 'common', 500),
('shard_multiplier_basic', 'Shard Multiplier', 'Doubles shard collection for 45 seconds', '💎', 'double_shards', 2.0, 45, 'rare', 800),
('shield_basic', 'Shield', 'Protects from 1 death', '🛡️', 'shield', 1.0, 60, 'epic', 1200)
ON CONFLICT (power_up_key) DO NOTHING;
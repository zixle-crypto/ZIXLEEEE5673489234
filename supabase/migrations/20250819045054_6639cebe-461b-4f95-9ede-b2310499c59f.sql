-- Insert initial achievements
INSERT INTO public.achievements (achievement_key, title, description, icon, category, rarity, target_value, reward_shards, reward_cubes) VALUES
-- Progress achievements
('first_steps', 'First Steps', 'Complete your first room', '🚀', 'progress', 'common', 1, 50, '[]'::jsonb),
('room_warrior', 'Room Warrior', 'Complete 100 rooms', '⚔️', 'progress', 'rare', 100, 500, '[{"cube_id": "basic_1", "quantity": 3}]'::jsonb),
('room_master', 'Room Master', 'Complete 500 rooms', '👑', 'progress', 'epic', 500, 2000, '[{"cube_id": "crystal_rare_1", "quantity": 2}]'::jsonb),
('room_legend', 'Room Legend', 'Complete 1000 rooms', '🌟', 'progress', 'legendary', 1000, 5000, '[{"cube_id": "ancient_legendary_1", "quantity": 1}]'::jsonb),

-- Collection achievements
('cube_collector', 'Cube Collector', 'Own 50 different cubes', '📦', 'collection', 'rare', 50, 300, '[]'::jsonb),
('cube_master', 'Cube Master', 'Own 100 different cubes', '💎', 'collection', 'epic', 100, 1000, '[{"cube_id": "void_epic_1", "quantity": 1}]'::jsonb),
('rare_hunter', 'Rare Hunter', 'Own 10 rare or higher cubes', '🎯', 'collection', 'rare', 10, 400, '[]'::jsonb),
('legendary_collector', 'Legendary Collector', 'Own 5 legendary cubes', '⭐', 'collection', 'epic', 5, 1500, '[]'::jsonb),

-- Speed achievements
('speed_demon', 'Speed Demon', 'Complete a room in under 30 seconds', '⚡', 'speed', 'rare', 30, 200, '[]'::jsonb),
('lightning_fast', 'Lightning Fast', 'Complete 10 rooms in under 1 minute each', '🌪️', 'speed', 'epic', 10, 800, '[]'::jsonb),

-- Special achievements
('shard_millionaire', 'Shard Millionaire', 'Earn 1,000,000 total shards', '💰', 'special', 'legendary', 1000000, 10000, '[{"cube_id": "cosmic_1", "quantity": 1}]'::jsonb),
('streak_master', 'Streak Master', 'Maintain a 30-day login streak', '🔥', 'special', 'epic', 30, 3000, '[]'::jsonb),
('gift_giver', 'Gift Giver', 'Send 10 gifts to friends', '🎁', 'special', 'rare', 10, 500, '[]'::jsonb);

-- Insert power-ups
INSERT INTO public.power_ups (power_up_key, name, description, icon, effect_type, effect_value, duration_seconds, rarity, cost_shards) VALUES
('speed_boost', 'Speed Boost', 'Move 50% faster for 30 seconds', '⚡', 'speed_boost', 1.5, 30, 'common', 150),
('mega_speed', 'Mega Speed', 'Move 100% faster for 20 seconds', '🌪️', 'speed_boost', 2.0, 20, 'rare', 300),
('shield', 'Shield', 'Become invincible for 15 seconds', '🛡️', 'shield', 1.0, 15, 'rare', 250),
('mega_shield', 'Mega Shield', 'Become invincible for 30 seconds', '🔰', 'shield', 1.0, 30, 'epic', 500),
('shard_magnet', 'Shard Magnet', 'Auto-collect shards from distance for 45 seconds', '🧲', 'magnet', 1.0, 45, 'common', 100),
('double_shards', 'Double Shards', 'Earn 2x shards for 60 seconds', '💎', 'double_shards', 2.0, 60, 'rare', 400),
('triple_shards', 'Triple Shards', 'Earn 3x shards for 30 seconds', '💰', 'double_shards', 3.0, 30, 'epic', 800),
('time_slow', 'Time Slow', 'Slow down time by 50% for 20 seconds', '⏰', 'time_slow', 0.5, 20, 'epic', 600);

-- Insert initial daily challenges
INSERT INTO public.daily_challenges (challenge_type, title, description, target_value, reward_shards, reward_cubes, difficulty) VALUES
('speed_run', 'Speed Runner', 'Complete 5 rooms in under 2 minutes each', 5, 300, '[{"cube_id": "basic_5", "quantity": 2}]'::jsonb, 'medium'),
('cube_collector', 'Daily Collector', 'Collect 20 cubes today', 20, 200, '[]'::jsonb, 'easy'),
('streak_master', 'Combo Master', 'Achieve a 10-room completion streak', 10, 500, '[{"cube_id": "crystal_rare_5", "quantity": 1}]'::jsonb, 'hard'),
('survival', 'Survival Expert', 'Complete 15 rooms without using power-ups', 15, 400, '[{"cube_id": "void_epic_3", "quantity": 1}]'::jsonb, 'expert');

-- Insert a sample bonus event (double shards for 1 hour)
INSERT INTO public.bonus_events (event_type, title, description, multiplier, start_time, end_time, active) VALUES
('double_shards', '🔥 Double Shards Hour!', 'Earn 2x shards for the next hour! Don''t miss out!', 2.0, now(), now() + interval '1 hour', true);
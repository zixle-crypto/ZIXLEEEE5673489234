import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'collection' | 'speed' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  target_value?: number;
  reward_shards: number;
  reward_cubes?: any[];
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at?: string;
  achievement?: Achievement;
}

export interface PowerUp {
  id: string;
  power_up_key: string;
  name: string;
  description: string;
  icon: string;
  effect_type: 'speed_boost' | 'shield' | 'magnet' | 'double_shards' | 'time_slow';
  effect_value: number;
  duration_seconds: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost_shards: number;
}

export interface UserPowerUp {
  id: string;
  power_up_id: string;
  quantity: number;
  power_up?: PowerUp;
}

export interface DailyChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  target_value: number;
  reward_shards: number;
  reward_cubes?: any[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  active_date: string;
}

export interface UserChallengeProgress {
  id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at?: string;
  challenge?: DailyChallenge;
}

export interface UserStreaks {
  login_streak: number;
  play_streak: number;
  last_login?: string;
  last_play?: string;
  max_login_streak: number;
  max_play_streak: number;
}

export interface BonusEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  multiplier: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface ActivePowerUp {
  power_up_key: string;
  effect_type: string;
  effect_value: number;
  expires_at: number;
}

interface EngagementState {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  powerUps: PowerUp[];
  userPowerUps: UserPowerUp[];
  dailyChallenges: DailyChallenge[];
  userChallengeProgress: UserChallengeProgress[];
  streaks: UserStreaks;
  bonusEvents: BonusEvent[];
  activePowerUps: ActivePowerUp[];
  
  // Actions
  loadAchievements: () => Promise<void>;
  loadUserAchievements: () => Promise<void>;
  loadPowerUps: () => Promise<void>;
  loadUserPowerUps: () => Promise<void>;
  loadDailyChallenges: () => Promise<void>;
  loadUserChallengeProgress: () => Promise<void>;
  loadStreaks: () => Promise<void>;
  loadBonusEvents: () => Promise<void>;
  
  updateAchievementProgress: (achievementKey: string, progress: number) => Promise<void>;
  updateChallengeProgress: (challengeId: string, progress: number) => Promise<void>;
  purchasePowerUp: (powerUpId: string) => Promise<boolean>;
  usePowerUp: (powerUpId: string) => Promise<boolean>;
  updateStreak: (type: 'login' | 'play') => Promise<void>;
  
  // Active power-ups management
  addActivePowerUp: (powerUp: ActivePowerUp) => void;
  removeExpiredPowerUps: () => void;
  getActivePowerUpBonus: (type: string) => number;
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      userAchievements: [],
      powerUps: [],
      userPowerUps: [],
      dailyChallenges: [],
      userChallengeProgress: [],
      streaks: {
        login_streak: 0,
        play_streak: 0,
        max_login_streak: 0,
        max_play_streak: 0
      },
      bonusEvents: [],
      activePowerUps: [],

      loadAchievements: async () => {
        try {
          const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('rarity', { ascending: true });
          
          if (error) throw error;
          set({ achievements: (data || []) as Achievement[] });
        } catch (error) {
          console.error('Error loading achievements:', error);
        }
      },

      loadUserAchievements: async () => {
        try {
          const { data, error } = await supabase
            .from('user_achievements')
            .select(`
              *,
              achievement:achievements(*)
            `);
          
          if (error) throw error;
          set({ userAchievements: (data || []) as UserAchievement[] });
        } catch (error) {
          console.error('Error loading user achievements:', error);
        }
      },

      loadPowerUps: async () => {
        try {
          const { data, error } = await supabase
            .from('power_ups')
            .select('*')
            .order('cost_shards', { ascending: true });
          
          if (error) throw error;
          set({ powerUps: (data || []) as PowerUp[] });
        } catch (error) {
          console.error('Error loading power-ups:', error);
        }
      },

      loadUserPowerUps: async () => {
        try {
          const { data, error } = await supabase
            .from('user_power_ups')
            .select(`
              *,
              power_up:power_ups(*)
            `);
          
          if (error) throw error;
          set({ userPowerUps: (data || []) as UserPowerUp[] });
        } catch (error) {
          console.error('Error loading user power-ups:', error);
        }
      },

      loadDailyChallenges: async () => {
        try {
          const { data, error } = await supabase
            .from('daily_challenges')
            .select('*')
            .eq('active_date', new Date().toISOString().split('T')[0])
            .order('difficulty', { ascending: true });
          
          if (error) throw error;
          set({ dailyChallenges: (data || []) as DailyChallenge[] });
        } catch (error) {
          console.error('Error loading daily challenges:', error);
        }
      },

      loadUserChallengeProgress: async () => {
        try {
          const { data, error } = await supabase
            .from('user_challenge_progress')
            .select(`
              *,
              challenge:daily_challenges(*)
            `);
          
          if (error) throw error;
          set({ userChallengeProgress: (data || []) as UserChallengeProgress[] });
        } catch (error) {
          console.error('Error loading user challenge progress:', error);
        }
      },

      loadStreaks: async () => {
        try {
          const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .single();
          
          if (error && error.code !== 'PGRST116') throw error;
          
          if (data) {
            set({ streaks: data });
          }
        } catch (error) {
          console.error('Error loading streaks:', error);
        }
      },

      loadBonusEvents: async () => {
        try {
          const { data, error } = await supabase
            .from('bonus_events')
            .select('*')
            .eq('active', true)
            .gte('end_time', new Date().toISOString())
            .order('start_time', { ascending: true });
          
          if (error) throw error;
          set({ bonusEvents: (data || []) as BonusEvent[] });
        } catch (error) {
          console.error('Error loading bonus events:', error);
        }
      },

      updateAchievementProgress: async (achievementKey: string, progress: number) => {
        try {
          const achievement = get().achievements.find(a => a.achievement_key === achievementKey);
          if (!achievement) return;

          const { data, error } = await supabase
            .from('user_achievements')
            .upsert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              achievement_id: achievement.id,
              progress: progress,
              unlocked: progress >= (achievement.target_value || 1),
              unlocked_at: progress >= (achievement.target_value || 1) ? new Date().toISOString() : null
            }, {
              onConflict: 'user_id,achievement_id'
            })
            .select();

          if (error) throw error;
          
          // Reload user achievements
          get().loadUserAchievements();
        } catch (error) {
          console.error('Error updating achievement progress:', error);
        }
      },

      updateChallengeProgress: async (challengeId: string, progress: number) => {
        try {
          const challenge = get().dailyChallenges.find(c => c.id === challengeId);
          if (!challenge) return;

          const { data, error } = await supabase
            .from('user_challenge_progress')
            .upsert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              challenge_id: challengeId,
              current_progress: progress,
              completed: progress >= challenge.target_value,
              completed_at: progress >= challenge.target_value ? new Date().toISOString() : null
            }, {
              onConflict: 'user_id,challenge_id'
            })
            .select();

          if (error) throw error;
          
          // Reload challenge progress
          get().loadUserChallengeProgress();
        } catch (error) {
          console.error('Error updating challenge progress:', error);
        }
      },

      purchasePowerUp: async (powerUpId: string) => {
        try {
          const powerUp = get().powerUps.find(p => p.id === powerUpId);
          if (!powerUp) return false;

          const { data, error } = await supabase
            .from('user_power_ups')
            .upsert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              power_up_id: powerUpId,
              quantity: 1
            }, {
              onConflict: 'user_id,power_up_id',
              ignoreDuplicates: false
            })
            .select();

          if (error) throw error;
          
          // Reload user power-ups
          get().loadUserPowerUps();
          return true;
        } catch (error) {
          console.error('Error purchasing power-up:', error);
          return false;
        }
      },

      usePowerUp: async (powerUpId: string) => {
        try {
          const userPowerUp = get().userPowerUps.find(up => up.power_up_id === powerUpId);
          if (!userPowerUp || userPowerUp.quantity <= 0) return false;

          // Decrease quantity
          const { error } = await supabase
            .from('user_power_ups')
            .update({
              quantity: userPowerUp.quantity - 1
            })
            .eq('id', userPowerUp.id);

          if (error) throw error;

          // Add to active power-ups
          if (userPowerUp.power_up) {
            const activePowerUp: ActivePowerUp = {
              power_up_key: userPowerUp.power_up.power_up_key,
              effect_type: userPowerUp.power_up.effect_type,
              effect_value: userPowerUp.power_up.effect_value,
              expires_at: Date.now() + (userPowerUp.power_up.duration_seconds * 1000)
            };
            
            get().addActivePowerUp(activePowerUp);
          }

          // Reload user power-ups
          get().loadUserPowerUps();
          return true;
        } catch (error) {
          console.error('Error using power-up:', error);
          return false;
        }
      },

      updateStreak: async (type: 'login' | 'play') => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const streaks = get().streaks;
          
          let newStreaks = { ...streaks };
          
          if (type === 'login') {
            if (streaks.last_login !== today) {
              newStreaks.login_streak = streaks.last_login === 
                new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                ? streaks.login_streak + 1 : 1;
              newStreaks.last_login = today;
              newStreaks.max_login_streak = Math.max(newStreaks.max_login_streak, newStreaks.login_streak);
            }
          } else {
            newStreaks.play_streak = streaks.play_streak + 1;
            newStreaks.last_play = today;
            newStreaks.max_play_streak = Math.max(newStreaks.max_play_streak, newStreaks.play_streak);
          }

          const { error } = await supabase
            .from('user_streaks')
            .upsert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              ...newStreaks
            }, {
              onConflict: 'user_id'
            });

          if (error) throw error;
          set({ streaks: newStreaks });
        } catch (error) {
          console.error('Error updating streak:', error);
        }
      },

      addActivePowerUp: (powerUp: ActivePowerUp) => {
        const activePowerUps = get().activePowerUps.filter(
          ap => ap.power_up_key !== powerUp.power_up_key
        );
        activePowerUps.push(powerUp);
        set({ activePowerUps });
      },

      removeExpiredPowerUps: () => {
        const now = Date.now();
        const activePowerUps = get().activePowerUps.filter(
          ap => ap.expires_at > now
        );
        set({ activePowerUps });
      },

      getActivePowerUpBonus: (type: string) => {
        get().removeExpiredPowerUps();
        const powerUp = get().activePowerUps.find(ap => ap.effect_type === type);
        return powerUp ? powerUp.effect_value : 1;
      },
    }),
    {
      name: 'engagement-store',
    }
  )
);
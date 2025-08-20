import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Target, Zap, Gift, Clock, Star, 
  ArrowLeft, Crown, Gem, Medal, Shield, Rocket 
} from 'lucide-react';
import { useEngagementStore } from '@/stores/engagementStore';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface EngagementHubProps {
  onBack: () => void;
  totalShards: number;
  onPurchase: (cost: number) => void;
}

export const EngagementHub: React.FC<EngagementHubProps> = ({ 
  onBack, 
  totalShards, 
  onPurchase 
}) => {
  const {
    achievements,
    userAchievements,
    powerUps,
    userPowerUps,
    dailyChallenges,
    userChallengeProgress,
    streaks,
    bonusEvents,
    activePowerUps,
    loadAchievements,
    loadUserAchievements,
    loadPowerUps,
    loadUserPowerUps,
    loadDailyChallenges,
    loadUserChallengeProgress,
    loadStreaks,
    loadBonusEvents,
    purchasePowerUp,
    usePowerUp,
    removeExpiredPowerUps
  } = useEngagementStore();

  const [selectedTab, setSelectedTab] = useState('challenges');
  const [celebrationAchievement, setCelebrationAchievement] = useState<any>(null);

  useEffect(() => {
    // Load all data with error handling
    const loadAllData = async () => {
      try {
        console.log('🔄 Loading engagement data...');
        await Promise.all([
          loadAchievements(),
          loadUserAchievements(),
          loadPowerUps(),
          loadUserPowerUps(),
          loadDailyChallenges(),
          loadUserChallengeProgress(),
          loadStreaks(),
          loadBonusEvents()
        ]);
        console.log('✅ All engagement data loaded');
      } catch (error) {
        console.error('❌ Failed to load engagement data:', error);
        toast({
          title: "Loading Error",
          description: "Failed to load some data. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    loadAllData();

    // Set up interval to clean expired power-ups
    const interval = setInterval(removeExpiredPowerUps, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'text-gray-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityBg = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500/20',
      rare: 'bg-blue-500/20',
      epic: 'bg-purple-500/20',
      legendary: 'bg-yellow-500/20'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const handlePowerUpPurchase = async (powerUp: any) => {
    console.log('🛒 Starting purchase for power-up:', powerUp.name, 'ID:', powerUp.id);
    console.log('💰 Current shards from props:', totalShards, 'Required:', powerUp.cost_shards);
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase power-ups",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 Attempting purchase...');
    const success = await purchasePowerUp(powerUp.id);
    console.log('🔄 Purchase result:', success);
    
    if (success) {
      // Trigger onPurchase callback to update totalShards in parent component
      onPurchase(powerUp.cost_shards);
      
      toast({
        title: "Power-Up Purchased!",
        description: `${powerUp.name} added to your inventory for ${powerUp.cost_shards} shards`,
      });
    } else {
      console.error('❌ Purchase failed - checking logs above for details');
      toast({
        title: "Purchase Failed", 
        description: "Could not complete the purchase. Please check if you have enough shards and try again.",
        variant: "destructive"
      });
    }
  };

  const handlePowerUpUse = async (userPowerUp: any) => {
    const success = await usePowerUp(userPowerUp.power_up_id);
    if (success) {
      toast({
        title: "Power-Up Activated!",
        description: `${userPowerUp.power_up?.name} is now active!`,
      });
    }
  };

  const getAchievementProgress = (achievement: any) => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
    return userAchievement || { progress: 0, unlocked: false };
  };

  const getChallengeProgress = (challenge: any) => {
    const progress = userChallengeProgress.find(cp => cp.challenge_id === challenge.id);
    return progress || { current_progress: 0, completed: false };
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-game-border text-game-text hover:bg-game-surface flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Button>
        
        <div className="text-center">
          <h1 className="text-4xl font-black text-perception font-orbitron tracking-wider">
            ENGAGEMENT HUB
          </h1>
          <p className="text-game-text-dim text-sm mt-2">
            Challenges • Achievements • Power-ups • Events
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-400">
              {totalShards.toLocaleString()}
            </div>
            <div className="text-xs text-game-text-dim">SHARDS</div>
          </div>
        </div>
      </div>

      {/* Active Events Banner */}
      {bonusEvents.length > 0 && (
        <div className="mb-6">
          <AnimatePresence>
            {bonusEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-4 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-400">{event.title}</h3>
                      <p className="text-game-text-dim text-sm">{event.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-400">
                      {event.multiplier}x
                    </div>
                    <div className="text-xs text-game-text-dim">
                      {formatTimeRemaining(event.end_time)} left
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Active Power-ups */}
      {activePowerUps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-perception mb-3">🔥 Active Power-ups</h3>
          <div className="flex gap-3 flex-wrap">
            {activePowerUps.map((powerUp, index) => (
              <motion.div
                key={`${powerUp.power_up_key}-${index}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-3"
              >
                <div className="text-sm font-bold text-green-400">
                  {powerUp.power_up_key.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-xs text-game-text-dim">
                  {Math.ceil((powerUp.expires_at - Date.now()) / 1000)}s left
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-game-surface border border-game-border">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            CHALLENGES
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            ACHIEVEMENTS
          </TabsTrigger>
          <TabsTrigger value="powerups" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            POWER-UPS
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            STREAKS
          </TabsTrigger>
        </TabsList>

        {/* Daily Challenges */}
        <TabsContent value="challenges" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dailyChallenges.map((challenge) => {
              const progress = getChallengeProgress(challenge);
              const progressPercent = Math.min(
                (progress.current_progress / challenge.target_value) * 100, 
                100
              );

              return (
                <Card key={challenge.id} className={`bg-game-surface border-2 ${
                  progress.completed ? 'border-green-500' : 'border-game-border'
                } relative overflow-hidden`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-perception">{challenge.title}</CardTitle>
                      <Badge className={getRarityBg(challenge.difficulty)}>
                        {challenge.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-game-text-dim text-sm">{challenge.description}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-game-text">Progress</span>
                          <span className="text-sm text-game-text">
                            {progress.current_progress}/{challenge.target_value}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gem className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold">
                            {challenge.reward_shards.toLocaleString()}
                          </span>
                        </div>
                        
                        {progress.completed ? (
                          <Badge className="bg-green-500/20 text-green-400">
                            ✓ COMPLETED
                          </Badge>
                        ) : (
                          <div className="text-perception font-bold">
                            {Math.ceil(progressPercent)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => {
              const userProgress = getAchievementProgress(achievement);
              const progressPercent = achievement.target_value ? 
                Math.min((userProgress.progress / achievement.target_value) * 100, 100) : 0;

              return (
                <Card key={achievement.id} className={`bg-game-surface border-2 ${
                  userProgress.unlocked ? 'border-yellow-500' : 'border-game-border'
                } relative overflow-hidden`}>
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <CardTitle className={`text-lg ${getRarityColor(achievement.rarity)}`}>
                      {achievement.title}
                    </CardTitle>
                    <p className="text-game-text-dim text-sm">{achievement.description}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {achievement.target_value && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-game-text">Progress</span>
                            <span className="text-sm text-game-text">
                              {userProgress.progress}/{achievement.target_value}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gem className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold">
                            {achievement.reward_shards.toLocaleString()}
                          </span>
                        </div>
                        
                        {userProgress.unlocked ? (
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            <Trophy className="w-3 h-3 mr-1" />
                            UNLOCKED
                          </Badge>
                        ) : (
                          <Badge className={getRarityBg(achievement.rarity)}>
                            {achievement.rarity.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Power-ups */}
        <TabsContent value="powerups" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {powerUps.map((powerUp) => {
              const userPowerUp = userPowerUps.find(up => up.power_up_id === powerUp.id);
              const owned = userPowerUp?.quantity || 0;

              return (
                <Card key={powerUp.id} className="bg-game-surface border-2 border-game-border">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{powerUp.icon}</div>
                    <CardTitle className={`text-lg ${getRarityColor(powerUp.rarity)}`}>
                      {powerUp.name}
                    </CardTitle>
                    <p className="text-game-text-dim text-sm">{powerUp.description}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-game-text">Duration:</span>
                        <span className="text-perception">{powerUp.duration_seconds}s</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-game-text">Effect:</span>
                        <span className="text-green-400">
                          {powerUp.effect_value > 1 ? `${powerUp.effect_value}x` : `${Math.round((1 - powerUp.effect_value) * 100)}%`}
                        </span>
                      </div>

                      {owned > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-game-text">Owned:</span>
                          <span className="text-blue-400 font-bold">{owned}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePowerUpPurchase(powerUp)}
                          disabled={totalShards < powerUp.cost_shards}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Gem className="w-3 h-3 mr-1" />
                          {powerUp.cost_shards.toLocaleString()}
                        </Button>
                        
                        {owned > 0 && (
                          <Button
                            onClick={() => handlePowerUpUse(userPowerUp)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            USE
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Streaks */}
        <TabsContent value="streaks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Login Streak */}
            <Card className="bg-game-surface border-2 border-game-border">
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">🔥</div>
                <CardTitle className="text-2xl text-orange-400">Login Streak</CardTitle>
                <p className="text-game-text-dim">Days in a row you've logged in</p>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                <div className="text-6xl font-black text-orange-400">
                  {streaks.login_streak}
                </div>
                <div className="text-game-text">Current Streak</div>
                
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="text-orange-300 font-bold">{streaks.max_login_streak}</div>
                    <div className="text-game-text-dim">Best Streak</div>
                  </div>
                  <div>
                    <div className="text-orange-300 font-bold">
                      {streaks.last_login || 'Never'}
                    </div>
                    <div className="text-game-text-dim">Last Login</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Play Streak */}
            <Card className="bg-game-surface border-2 border-game-border">
              <CardHeader className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <CardTitle className="text-2xl text-blue-400">Play Streak</CardTitle>
                <p className="text-game-text-dim">Consecutive rooms completed</p>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                <div className="text-6xl font-black text-blue-400">
                  {streaks.play_streak}
                </div>
                <div className="text-game-text">Current Streak</div>
                
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="text-blue-300 font-bold">{streaks.max_play_streak}</div>
                    <div className="text-game-text-dim">Best Streak</div>
                  </div>
                  <div>
                    <div className="text-blue-300 font-bold">
                      {streaks.last_play || 'Never'}
                    </div>
                    <div className="text-game-text-dim">Last Play</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Achievement Celebration Modal */}
      {celebrationAchievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setCelebrationAchievement(null)}
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            className="bg-game-surface border-2 border-yellow-500 rounded-lg p-8 text-center max-w-md mx-4"
          >
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              Achievement Unlocked!
            </h2>
            <h3 className="text-xl font-bold text-perception mb-2">
              {celebrationAchievement.title}
            </h3>
            <p className="text-game-text-dim mb-6">
              {celebrationAchievement.description}
            </p>
            <Button
              onClick={() => setCelebrationAchievement(null)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Awesome!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
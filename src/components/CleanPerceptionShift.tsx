/**
 * Clean main game component
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteGameCanvas } from './CompleteGameCanvas';
import { GameHUD } from './CleanGameHUD';
import { SplashScreen } from './SplashScreen';
import { Leaderboard } from './Leaderboard';
import { MainMenu } from './MainMenu';
import { Shop } from './Shop';
import { Inventory } from './Inventory';
import { useGameStore } from '@/stores/gameStore';
import { useUserDataStore } from '@/stores/userDataStore';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { Trophy, Crown, Target, ArrowLeft } from 'lucide-react';

type GameScreen = 'splash' | 'menu' | 'game' | 'leaderboard' | 'shop' | 'inventory';

export const CleanPerceptionShift = () => {
  const { initGame, isPlaying, currentRank, lastRoomReward } = useGameStore();
  const { user: authUser, gameData, setUser: setUserData, updateShards, addCubeToInventory } = useUserDataStore();
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Auto-sync user data when authenticated
        if (session?.user && event === 'SIGNED_IN') {
          console.log('User signed in, auto-syncing data...');
          
          // Give the user data store the authenticated user
          setUserData(session.user);
          
          // Also force a direct data load to ensure it works
          setTimeout(async () => {
            try {
              const userId = session.user.id;
              
              // Load game data
              const { data: gameData } = await supabase
                .from('user_game_data')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

              // Load inventory
              const { data: inventoryData } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', userId);

              // Update store directly if data exists
              if (gameData || inventoryData) {
                const { gameData: currentGameData, inventory: currentInventory } = useUserDataStore.getState();
                
                // Only update if store is empty
                if (!currentGameData && !currentInventory.length) {
                  useUserDataStore.setState({
                    gameData: gameData,
                    inventory: inventoryData || [],
                    loading: false,
                    error: null
                  });
                  console.log('Auto-synced data:', { shards: gameData?.total_shards, cubes: inventoryData?.length });
                }
              }
            } catch (error) {
              console.error('Auto-sync error:', error);
            }
          }, 500);
        } else if (!session?.user) {
          console.log('User signed out, clearing data...');
          setUserData(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Existing session found, auto-syncing data...');
        setUserData(session.user);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUserData]);

  useEffect(() => {
    if (currentScreen === 'game') {
      initGame();
    }
  }, [initGame, currentScreen]);

  const handleUserComplete = (userEmail: string) => {
    setCurrentScreen('menu');
  };

  const handleShopPurchase = async (itemId: string, cost: number) => {
    await updateShards(-cost);
    await addCubeToInventory(itemId);
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-8xl font-black text-black font-orbitron tracking-wider animate-fade-in">
            ZIXLE STUDIOS
          </h1>
          <div className="mt-8 w-32 h-1 bg-black mx-auto animate-scale-in"></div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'splash') {
    return <SplashScreen onComplete={handleUserComplete} user={user} />;
  }

  if (currentScreen === 'menu') {
    return (
      <MainMenu
        onPlay={() => setCurrentScreen('game')}
        onLeaderboard={() => setCurrentScreen('leaderboard')}
        onShop={() => setCurrentScreen('shop')}
        onInventory={() => setCurrentScreen('inventory')}
        totalShards={gameData?.total_shards || 0}
      />
    );
  }

  if (currentScreen === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg">
        <Leaderboard 
          isVisible={true} 
          onClose={() => setCurrentScreen('menu')} 
          currentUser={user}
        />
      </div>
    );
  }

  if (currentScreen === 'shop') {
    return (
      <Shop
        onBack={() => setCurrentScreen('menu')}
        totalShards={gameData?.total_shards || 0}
        onPurchase={handleShopPurchase}
      />
    );
  }

  if (currentScreen === 'inventory') {
    return (
      <Inventory 
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  // Game screen
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-4 font-mono">

      {/* Header with Game Title and Stats */}
      <div className="text-center mb-6 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          {/* Player Stats */}
          <div className="flex items-center gap-4">
            <div className="bg-game-surface border border-game-border rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-perception" />
                <span className="text-perception font-bold">{gameData?.total_shards || 0}</span>
                <span className="text-game-text-dim text-sm">⬟ Shards</span>
              </div>
            </div>
            {currentRank && (
              <div className="bg-game-surface border border-game-border rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-game-text font-bold">#{currentRank}</span>
                  <span className="text-game-text-dim text-sm">Rank</span>
                </div>
              </div>
            )}
            {lastRoomReward > 0 && (
              <div className="bg-perception/20 border border-perception rounded-lg px-3 py-1 animate-pulse">
                <span className="text-perception text-sm font-bold">+{lastRoomReward} ⬟</span>
              </div>
            )}
          </div>

          {/* Game Title */}
          <div className="text-center">
            <h1 className="text-4xl font-black text-perception mb-2 animate-perception-pulse font-orbitron tracking-wider">
              PERCEPTION SHIFT
            </h1>
            <p className="text-game-text-dim text-sm font-mono">
              Reality changes with your attention • Weekly Seed Challenge
            </p>
          </div>

          {/* Back to Menu Button */}
          <Button
            onClick={() => setCurrentScreen('menu')}
            className="bg-perception hover:bg-perception/90 text-white font-mono flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            MENU
          </Button>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative bg-game-surface border border-game-border rounded-lg p-4 shadow-2xl">
        <div style={{ width: '800px', height: '600px', position: 'relative' }}>
          <CompleteGameCanvas />
          <GameHUD />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-game-text-dim text-xs max-w-md mx-auto font-mono">
        <p>Move with WASD or arrow keys • Jump with W/Up/Space • Collect golden shards for currency</p>
        <p className="mt-2 text-perception text-xs">
          💡 Complete rooms to earn shards and climb the global leaderboard!
        </p>
      </div>
    </div>
  );
};
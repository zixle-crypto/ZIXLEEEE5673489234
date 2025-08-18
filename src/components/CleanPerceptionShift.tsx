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
import { GiftModal } from './GiftModal';
import { DeviceSelectionModal } from './DeviceSelectionModal';
import { useGameStore } from '@/stores/gameStore';
import { useUserDataStore } from '@/stores/userDataStore';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { Trophy, Crown, Target, ArrowLeft } from 'lucide-react';


type GameScreen = 'splash' | 'menu' | 'game' | 'leaderboard' | 'shop' | 'inventory';

export const CleanPerceptionShift = () => {
  const { initGame, isPlaying, currentRank, lastRoomReward, syncPowerUpsFromUserData, totalShards: gameStoreShards } = useGameStore();
  const { user: authUser, gameData, setUser: setUserData, updateShards, addCubeToInventory, loadUserData, showDeviceSelection, setDevicePreference, setShowDeviceSelection } = useUserDataStore();
  
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestDeviceSelection, setGuestDeviceSelection] = useState(false);

  useEffect(() => {
    let mounted = true;

    console.log('🚀 Setting up authentication...');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔔 Auth state change EVENT:', event);
        console.log('🔔 Auth state change SESSION:', session);
        console.log('🔔 Auth state change USER:', session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Safety redirect: If user authenticated but on wrong domain, redirect to game homepage
        if (session?.user && window.location.hostname !== 'perceptionshift.zixlestudios.com') {
          console.log('🔄 Redirecting to game homepage after authentication');
          window.location.href = 'https://perceptionshift.zixlestudios.com';
          return;
        }
        
        // Auto-sync user data when authenticated
        if (session?.user) {
          console.log('✅ User authenticated in auth state change:', session.user.email);
          console.log('📋 User ID:', session.user.id);
          console.log('🔄 Setting user in store...');
          
          // Give the user data store the authenticated user
          setUserData(session.user);
          
          // Force show device selection for all authenticated users (temporary for debugging)
          console.log('🎯 Forcing device selection modal to show...');
          setTimeout(() => {
            console.log('⏰ Timeout triggered - setting device selection to true');
            setShowDeviceSelection(true);
          }, 500);
          
          // Auto-navigate to menu after successful auth, with a small delay
          setTimeout(() => {
            if (currentScreen === 'splash') {
              setCurrentScreen('menu');
            }
          }, 200);
          
          // Additional safety check - try direct database query
          setTimeout(async () => {
            try {
              console.log('🔍 Safety check - querying database directly...');
              const userId = session.user.id;
              
              // Test if we can query the database at all
              const { data: testData, error: testError } = await supabase
                .from('user_game_data')
                .select('count')
                .eq('user_id', userId);
              
              console.log('🧪 Database test result:', testData, testError);
              
              if (testError) {
                console.error('❌ Database access failed:', testError);
                console.log('🔧 Possible RLS issue or user not in database');
              }
              
              // Load actual data
              const { data: gameData, error: gameError } = await supabase
                .from('user_game_data')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

              const { data: inventoryData, error: inventoryError } = await supabase
                .from('user_inventory')
                .select('*')
                .eq('user_id', userId);

              console.log('📊 Game data:', gameData, gameError);
              console.log('📦 Inventory data:', inventoryData?.length || 0, 'items', inventoryError);

              // Force update store if we got data
              if (gameData || inventoryData) {
                console.log('🔄 Force updating store with data...');
                useUserDataStore.setState({
                  user: session.user,
                  gameData: gameData,
                  inventory: inventoryData || [],
                  loading: false,
                  error: null
                });
                
                // Sync power-ups to game store
                syncPowerUpsFromUserData();
                console.log('✅ Store updated and power-ups synced!');
              } else {
                console.log('❌ No data found in database for user');
              }
            } catch (error) {
              console.error('💥 Safety check failed:', error);
            }
          }, 1000);
        } else {
          console.log('❌ No user in session');
          setUserData(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('🔍 Initial session check:', session?.user?.email || 'No user');
      console.log('🔍 Session details:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 Existing session found for:', session.user.email);
        console.log('🔄 Setting user data from existing session...');
        setUserData(session.user);
        
        // Force show device selection for authenticated users
        console.log('🎯 Forcing device selection from existing session...');
        setTimeout(() => {
          console.log('⏰ Device selection timeout from existing session');
          setShowDeviceSelection(true);
        }, 1000);
      } else {
        console.log('🚫 No existing session found');
      }
      
      setLoading(false);
    }).catch(error => {
      console.error('❌ Error checking session:', error);
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
    console.log('handleUserComplete called with:', userEmail, 'current user:', user?.email);
    
    if (userEmail === 'guest') {
      console.log('✅ Guest mode activated');
      setIsGuest(true);
      setCurrentScreen('menu');
      
      // Check if guest has device preference, if not show selection
      const guestDevicePreference = localStorage.getItem('guestDevicePreference');
      if (!guestDevicePreference) {
        setGuestDeviceSelection(true);
      }
    } else {
      // Regular authenticated user flow
      setCurrentScreen('menu');
    }
  };

  // Handle device selection for both authenticated and guest users
  const handleDeviceSelection = async (deviceType: 'desktop' | 'mobile' | 'tablet') => {
    if (isGuest) {
      // Store guest device preference in localStorage
      localStorage.setItem('guestDevicePreference', deviceType);
      setGuestDeviceSelection(false);
    } else {
      // Use the store method for authenticated users
      await setDevicePreference(deviceType);
    }
  };

  const handleShopPurchase = async (itemId: string, cost: number) => {
    try {
      console.log('💰 Purchasing cube:', itemId, 'for', cost, 'shards');
      
      // Get the functions from user data store
      const { updateShards, addCubeToInventory } = useUserDataStore.getState();
      
      // Deduct shards and add cube to inventory
      await updateShards(-cost);
      await addCubeToInventory(itemId);
      
      // Also update the game store shards to sync the UI
      const { totalShards: currentGameShards } = useGameStore.getState();
      useGameStore.setState({ 
        totalShards: Math.max(0, currentGameShards - cost) 
      });
      
      console.log('✅ Purchase successful!');
      
      // Force reload user data to update the display
      await loadUserData();
    } catch (error) {
      console.error('❌ Purchase failed:', error);
    }
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

  // If not authenticated and not guest, show splash screen for sign in
  if (!user && !isGuest) {
    return <SplashScreen onComplete={handleUserComplete} user={user} />;
  }

  if (currentScreen === 'splash') {
    return <SplashScreen onComplete={handleUserComplete} user={user} />;
  }

  // Show main menu for authenticated users or guests
  if (currentScreen === 'menu') {
    console.log('🔍 MENU SCREEN Debug:');
    console.log('  - showDeviceSelection:', showDeviceSelection);
    console.log('  - guestDeviceSelection:', guestDeviceSelection);
    console.log('  - user exists:', !!user);
    console.log('  - isGuest:', isGuest);
    console.log('  - user email:', user?.email);
    
    return (
      <>
        <MainMenu
          onPlay={() => setCurrentScreen('game')}
          onLeaderboard={() => setCurrentScreen('leaderboard')}
          onShop={() => setCurrentScreen('shop')}
          onInventory={() => setCurrentScreen('inventory')}
          totalShards={gameStoreShards || (isGuest ? 0 : (gameData?.total_shards || 0))}
        />
        
        {/* Device Selection Modal - Show for both authenticated and guest users */}
        <DeviceSelectionModal
          isOpen={showDeviceSelection || guestDeviceSelection}
          onDeviceSelect={handleDeviceSelection}
        />
      </>
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
        totalShards={gameStoreShards || (gameData?.total_shards || 0)}
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
          {/* Player Stats - Remove duplicate shard display since it's now in game HUD */}
          <div className="flex items-center gap-4">
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

      {/* Game Container - Responsive */}
      <div className="relative bg-game-surface border border-game-border rounded-lg p-2 md:p-4 shadow-2xl w-full max-w-6xl">
        <div className="w-full aspect-[4/3] max-w-[800px] max-h-[600px] mx-auto relative">
          <CompleteGameCanvas />
          <GameHUD />
        </div>
      </div>

      {/* Controls Instructions - Prominent and Easy */}
      <div className="mt-4 space-y-3 text-center max-w-2xl mx-auto px-4">
        {/* Desktop Controls */}
        <div className="hidden md:block bg-game-surface/80 border border-game-border rounded-lg p-4">
          <h3 className="text-perception font-bold text-lg mb-3 font-mono">HOW TO PLAY</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
                <span className="text-perception font-bold">MOVE:</span>
                <span className="text-game-text">WASD or Arrow Keys</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
                <span className="text-perception font-bold">JUMP:</span>
                <span className="text-game-text">W, ↑, or Space</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
                <span className="text-perception font-bold">AIM:</span>
                <span className="text-game-text">Move Mouse</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
                <span className="text-perception font-bold">GOAL:</span>
                <span className="text-game-text">Collect ⬟ Shards</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="block md:hidden bg-game-surface/80 border border-game-border rounded-lg p-4">
          <h3 className="text-perception font-bold text-lg mb-3 font-mono">HOW TO PLAY</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
              <span className="text-perception font-bold">MOVE & JUMP:</span>
              <span className="text-game-text">Use Joystick (Bottom Left)</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
              <span className="text-perception font-bold">AIM CURSOR:</span>
              <span className="text-game-text">Touch Anywhere on Screen</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-game-bg/50 rounded p-2">
              <span className="text-perception font-bold">GOAL:</span>
              <span className="text-game-text">Collect ⬟ Golden Shards</span>
            </div>
          </div>
        </div>

        <p className="text-perception text-sm font-mono animate-pulse">
          💡 Complete rooms to earn shards and climb the global leaderboard!
        </p>
      </div>

      {/* Device Selection Modal - Show for both authenticated and guest users */}
      <DeviceSelectionModal
        isOpen={showDeviceSelection || guestDeviceSelection}
        onDeviceSelect={handleDeviceSelection}
      />
    </div>
  );
};
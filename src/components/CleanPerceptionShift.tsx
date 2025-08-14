/**
 * Clean main game component
 */

import React, { useEffect, useState } from 'react';
import { CompleteGameCanvas } from './CompleteGameCanvas';
import { GameHUD } from './CleanGameHUD';
import { SplashScreen } from './SplashScreen';
import { useGameStore } from '@/stores/gameStore';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export const CleanPerceptionShift = () => {
  const { initGame, isPlaying } = useGameStore();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          toast({
            title: "Email confirmed!",
            description: "Welcome to Zixle Studios! Your account has been activated.",
          });
          setCurrentUser(session.user.email || '');
          setShowGame(true);
          // Store current user for future sessions
          localStorage.setItem('zixle-current-user', session.user.email || '');
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (showGame) {
      // Initialize game once and ensure it's playing
      console.log('Initializing game...');
      initGame();
      
      // Force a second initialization after a brief delay to ensure state is set
      setTimeout(() => {
        console.log('Ensuring game is initialized and playing...');
        initGame();
      }, 100);
    }
  }, [initGame, showGame]);

  const handleUserComplete = (userEmail: string) => {
    setCurrentUser(userEmail);
    setShowGame(true);
    
    // Store current user for future sessions
    localStorage.setItem('zixle-current-user', userEmail);
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

  if (!showGame) {
    return <SplashScreen onComplete={handleUserComplete} user={user} />;
  }

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-4 font-mono">
      {/* Game Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-perception mb-2 animate-perception-pulse font-orbitron tracking-wider">
          PERCEPTION SHIFT
        </h1>
        <p className="text-game-text-dim text-sm font-mono">
          Reality changes with your attention • Weekly Seed Challenge
        </p>
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
        <p>Move with WASD or arrow keys • Jump with W/Up/Space • Collect golden shards for points</p>
        <p className="mt-2 text-perception text-xs">
          💡 Aim your cursor around the game area to experience the attention mechanics
        </p>
      </div>
    </div>
  );
};
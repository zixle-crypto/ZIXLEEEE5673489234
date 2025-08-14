/**
 * Clean main game component
 */

import React, { useEffect } from 'react';
import { GameCanvas } from './CleanGameCanvas';
import { GameHUD } from './CleanGameHUD';
import { useGameStore } from '@/stores/gameStore';

export const CleanPerceptionShift = () => {
  const { initGame, isPlaying } = useGameStore();

  useEffect(() => {
    // Initialize game once and ensure it's playing
    console.log('Initializing game...');
    initGame();
    
    // Force a second initialization after a brief delay to ensure state is set
    setTimeout(() => {
      console.log('Ensuring game is initialized and playing...');
      initGame();
    }, 100);
  }, [initGame]);

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
          <GameCanvas />
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
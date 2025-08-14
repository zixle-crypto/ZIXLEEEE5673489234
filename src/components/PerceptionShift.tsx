/**
 * Main game component that combines canvas and HUD
 */

import React, { useEffect } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameHUD } from './GameHUD';
import { useGameStore } from '@/stores/useGameStore';

export const PerceptionShift = () => {
  const { initGame, isPlaying } = useGameStore();

  useEffect(() => {
    // Force initialize game on mount
    console.log('PerceptionShift mounting, initializing game...');
    initGame();
  }, [initGame]);

  console.log('PerceptionShift render - isPlaying:', isPlaying);

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

      {/* Game Container - Fixed size and explicit positioning */}
      <div className="relative bg-game-surface border border-game-border rounded-lg p-4 shadow-2xl">
        <div style={{ width: '800px', height: '600px', position: 'relative' }}>
          <GameCanvas />
          <GameHUD />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-game-text-dim text-xs max-w-md mx-auto font-mono">
        <p>Move with WASD or arrow keys • Aim cursor to shift reality • Collect shards for points</p>
        <p className="mt-2 text-perception text-xs">
          💡 Tiles change state based on your attention - use cursor position and movement direction
        </p>
      </div>
    </div>
  );
};
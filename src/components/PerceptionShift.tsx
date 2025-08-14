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
    // Initialize game on mount
    if (!isPlaying) {
      initGame();
    }
  }, [initGame, isPlaying]);

  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4">
      <div className="relative">
        {/* Game Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-perception mb-2 animate-perception-pulse">
            PERCEPTION SHIFT
          </h1>
          <p className="text-game-text-dim text-sm">
            Reality changes with your attention • Weekly Seed Challenge
          </p>
        </div>

        {/* Game Container */}
        <div className="relative bg-game-surface border border-game-border rounded-lg p-4 shadow-2xl">
          <GameCanvas />
          <GameHUD />
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-game-text-dim text-xs max-w-md mx-auto">
          <p>Move with WASD or arrow keys • Aim cursor to shift reality • Collect shards for points</p>
        </div>
      </div>
    </div>
  );
};
/**
 * Clean game HUD component
 */

import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';

export const GameHUD = () => {
  const {
    score,
    roomsCleared,
    weeklySeed,
    isPlaying,
    isPaused,
    isGameOver,
    pauseGame,
    resumeGame,
    restartGame
  } = useGameStore();

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none font-mono">
      {/* Top HUD Bar */}
      <div className="flex justify-between items-start p-4">
        {/* Left: Score */}
        <div className="bg-hud-bg/90 border border-hud-border rounded-lg p-3 backdrop-blur-sm pointer-events-auto">
          <div className="flex flex-col gap-1">
            <div className="text-perception text-sm font-mono">
              SCORE
            </div>
            <div className="text-game-text text-lg font-bold">
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right: Room Count & Weekly Seed */}
        <div className="bg-hud-bg/90 border border-hud-border rounded-lg p-3 backdrop-blur-sm text-right">
          <div className="text-perception text-sm font-mono">
            ROOM {roomsCleared + 1}
          </div>
          <div className="text-game-text-dim text-xs">
            SEED #{weeklySeed}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2 pointer-events-auto">
          {isPlaying && !isGameOver && (
            <Button
              variant="outline"
              size="sm"
              onClick={isPaused ? resumeGame : pauseGame}
              className="bg-hud-bg/90 border-hud-border text-game-text hover:bg-perception/20"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}
          
          {(isGameOver || !isPlaying) && (
            <Button
              variant="default"
              size="sm"
              onClick={restartGame}
              className="bg-perception text-game-bg hover:bg-perception-glow"
            >
              {isGameOver ? 'Retry' : 'Start Game'}
            </Button>
          )}
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-game-bg/80 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
          <div className="bg-hud-bg border border-hud-border rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-perception mb-2">PAUSED</h2>
            <p className="text-game-text-dim mb-4">
              Use WASD or arrow keys to move and jump
            </p>
            <p className="text-game-text-dim text-sm mb-4">
              Aim your cursor to shift tile states
            </p>
            <Button
              variant="default"
              onClick={resumeGame}
              className="bg-perception text-game-bg hover:bg-perception-glow"
            >
              Resume Game
            </Button>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-game-bg/90 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
          <div className="bg-hud-bg border border-hud-border rounded-lg p-8 text-center max-w-md font-mono">
            <h2 className="text-3xl font-black text-game-danger mb-4 font-orbitron">PERCEPTION LOST</h2>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-game-text">
                <span>Score:</span>
                <span className="text-perception">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-game-text">
                <span>Rooms:</span>
                <span>{roomsCleared}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Try Again clicked');
                  restartGame();
                }}
                className="bg-hud-bg border-hud-border text-game-text hover:bg-perception/20 pointer-events-auto"
              >
                Try Again
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  console.log('New Run clicked');
                  restartGame();
                }}
                className="bg-perception text-game-bg hover:bg-perception-glow pointer-events-auto"
              >
                New Run
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
/**
 * Main game canvas component with 60 FPS game loop
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { calculateAttentionScore, TilePosition } from '@/lib/perception';
import { Vector2 } from '@/lib/gameTypes';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const {
    player,
    currentRoom,
    cursor,
    isPlaying,
    isPaused,
    isGameOver,
    gameTime,
    score,
    dwellStartTime,
    updatePlayer,
    updateCursor,
    handleInput,
    collectShard,
    playerDie,
    updateTiles,
    nextRoom
  } = useGameStore();

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.code);
    e.preventDefault();
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
    e.preventDefault();
  }, []);

  // Handle mouse movement for attention tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateCursor(x, y);
  }, [updateCursor]);

  // Render function - MUST be defined before gameLoop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) {
      console.log('Canvas or context not available for rendering');
      return;
    }

    console.log('RENDERING - Player position:', player?.x || 0, player?.y || 0);

    // Clear and fill background
    ctx.fillStyle = '#1a1f2e'; // Dark blue
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw test rectangle
    ctx.fillStyle = '#20d4d4'; // Bright teal
    ctx.fillRect(50, 50, 100, 100);
    
    // Draw player as red square
    if (player) {
      ctx.fillStyle = '#ff0000'; // Bright red
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw ground
    ctx.fillStyle = '#2a2f3e';
    ctx.fillRect(0, 500, 800, 100);
    
    // Draw shards
    if (currentRoom?.shards) {
      currentRoom.shards.forEach((shard, index) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, 10, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw debug text
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('GAME WORKING!', 300, 100);
    if (player) {
      ctx.fillText(`Player: ${player.x}, ${player.y}`, 300, 130);
    }

    console.log('Render complete');
  }, [player, currentRoom]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    console.log('Game loop running - isPlaying:', isPlaying);

    if (isPlaying && !isPaused && !isGameOver) {
      // Update game state
      handleInput(keysRef.current);
      updatePlayer(deltaTime);
      updateTiles();

      // Check shard collection
      if (currentRoom?.shards) {
        currentRoom.shards.forEach((shard, index) => {
          if (player) {
            const distance = Math.sqrt(
              Math.pow(player.x - shard.x, 2) + Math.pow(player.y - shard.y, 2)
            );
            if (distance < 30) {
              collectShard(index);
            }
          }
        });
      }

      // Simple death condition
      if (player && player.y > CANVAS_HEIGHT + 50) {
        console.log('Player fell off screen!');
        playerDie();
      }
    }

    // ALWAYS render
    render();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isPaused, isGameOver, player, currentRoom, handleInput, updatePlayer, updateTiles, collectShard, playerDie, render]);

  // Setup event listeners and game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas not found in useEffect');
      return;
    }

    console.log('Setting up canvas:', canvas);
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log('Canvas size set to:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Start game loop
    console.log('Starting game loop...');
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);
    
    // Force initial render
    setTimeout(() => {
      console.log('Force initial render');
      render();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, gameLoop, render]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-game-border bg-game-bg rounded-lg cursor-none block"
      style={{
        width: '800px',
        height: '600px',
        display: 'block',
        backgroundColor: 'hsl(221, 39%, 11%)'
      }}
    />
  );
};
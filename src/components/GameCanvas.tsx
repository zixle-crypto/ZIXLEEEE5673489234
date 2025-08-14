/**
 * Main game canvas component with 60 FPS game loop
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { calculateAttentionScore, TilePosition } from '@/lib/perception';

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
    playerDie
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

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (isPlaying && !isPaused && !isGameOver) {
      // Update game state
      handleInput(keysRef.current);
      updatePlayer(deltaTime);

      // Check shard collection
      currentRoom.shards.forEach((shard, index) => {
        const distance = Math.sqrt(
          Math.pow(player.x - shard.x, 2) + Math.pow(player.y - shard.y, 2)
        );
        if (distance < 30) {
          collectShard(index);
        }
      });

      // Simple death condition (fall off screen)
      if (player.y > CANVAS_HEIGHT + 100) {
        playerDie();
      }
    }

    // Render game
    render();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isPaused, isGameOver, player, currentRoom, handleInput, updatePlayer, collectShard, playerDie]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(221, 39%, 11%)'; // Game background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = 'hsl(221, 30%, 15%)';
    ctx.fillRect(0, 500, CANVAS_WIDTH, 100);

    // Draw player
    ctx.fillStyle = player.alive ? 'hsl(180, 100%, 45%)' : 'hsl(0, 85%, 55%)';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Add player glow effect
    if (player.alive) {
      ctx.shadowColor = 'hsl(180, 100%, 45%)';
      ctx.shadowBlur = 10;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.shadowBlur = 0;
    }

    // Draw perception shards
    currentRoom.shards.forEach((shard) => {
      const time = Date.now() * 0.005;
      const pulse = Math.sin(time) * 0.2 + 0.8;
      
      ctx.fillStyle = `hsl(45, 100%, ${60 * pulse}%)`;
      ctx.beginPath();
      ctx.arc(shard.x, shard.y, 8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow effect
      ctx.shadowColor = 'hsl(45, 100%, 60%)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(shard.x, shard.y, 8 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw attention indicator at cursor
    if (isPlaying && !isGameOver) {
      const dwellTime = Date.now() - dwellStartTime;
      const alpha = Math.min(1, dwellTime / 120); // Fade in over 120ms
      
      ctx.strokeStyle = `hsla(180, 100%, 45%, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      // Inner dot
      ctx.fillStyle = `hsla(180, 100%, 45%, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw room boundaries
    ctx.strokeStyle = 'hsl(221, 20%, 25%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  }, [player, currentRoom, cursor, isPlaying, isGameOver, dwellStartTime]);

  // Setup event listeners and game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Start game loop
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-game-border bg-game-bg rounded-lg cursor-none"
      style={{
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 20px hsl(var(--perception-teal) / 0.2))'
      }}
    />
  );
};
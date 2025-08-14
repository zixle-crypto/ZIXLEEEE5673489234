/**
 * Clean, working game canvas with guaranteed rendering
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';

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

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateCursor(x, y);
  }, [updateCursor]);

  // Render function - clean with no console spam
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw ground platform
    ctx.fillStyle = '#2a2f3e';
    ctx.fillRect(0, 500, CANVAS_WIDTH, 100);
    
    // Draw player
    if (player) {
      ctx.fillStyle = player.alive ? '#20d4d4' : '#ef4444';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // Player glow
      if (player.alive) {
        ctx.shadowColor = '#20d4d4';
        ctx.shadowBlur = 10;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.shadowBlur = 0;
      }
    }
    
    // Draw shards
    if (currentRoom?.shards) {
      currentRoom.shards.forEach((shard) => {
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 0.2 + 0.8;
        
        ctx.fillStyle = `hsl(45, 100%, ${60 * pulse}%)`;
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Shard glow
        ctx.shadowColor = 'hsl(45, 100%, 60%)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    // Draw cursor attention indicator
    if (isPlaying && !isGameOver) {
      ctx.strokeStyle = 'hsla(180, 100%, 45%, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'hsla(180, 100%, 45%, 0.6)';
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw room boundary
    ctx.strokeStyle = 'hsl(221, 20%, 25%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  }, [player, currentRoom, cursor, isPlaying, isGameOver]);

  // Game loop - clean with no console spam
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (isPlaying && !isPaused && !isGameOver) {
      // Update game state
      handleInput(keysRef.current);
      updatePlayer(deltaTime);

      // Check shard collection
      if (currentRoom?.shards && player) {
        currentRoom.shards.forEach((shard, index) => {
          const distance = Math.sqrt(
            Math.pow(player.x - shard.x, 2) + Math.pow(player.y - shard.y, 2)
          );
          if (distance < 30) {
            collectShard(index);
          }
        });
      }

      // Death condition
      if (player && player.y > CANVAS_HEIGHT + 50) {
        playerDie();
      }
    }

    // Render
    render();

    // Continue loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isPaused, isGameOver, player, currentRoom, handleInput, updatePlayer, collectShard, playerDie, render]);

  // Setup canvas and game loop
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
    lastTimeRef.current = performance.now();
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
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border border-game-border bg-game-bg rounded-lg cursor-none block"
      style={{
        width: '800px',
        height: '600px',
        display: 'block',
        backgroundColor: '#1a1f2e'
      }}
    />
  );
};
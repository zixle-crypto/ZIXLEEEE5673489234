/**
 * Working game canvas - built on the proven test canvas foundation
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';

export const WorkingGameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: 100, y: 400, velX: 0, velY: 0, onGround: false });
  const shardsRef = useRef([
    { x: 200, y: 300 },
    { x: 400, y: 200 },
    { x: 600, y: 350 }
  ]);
  const cursorRef = useRef({ x: 400, y: 300 });

  const {
    score,
    isPlaying,
    isPaused,
    isGameOver,
    collectShard,
    playerDie,
    updateCursor
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
    cursorRef.current = { x, y };
    updateCursor(x, y);
  }, [updateCursor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('🎮 Setting up working game canvas');

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Game update logic
    const updateGame = () => {
      if (!isPlaying || isPaused || isGameOver) return;

      const player = playerRef.current;
      const keys = keysRef.current;

      // Handle input
      player.velX = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) {
        player.velX = -5;
      }
      if (keys.has('KeyD') || keys.has('ArrowRight')) {
        player.velX = 5;
      }
      if ((keys.has('KeyW') || keys.has('ArrowUp') || keys.has('Space')) && player.onGround) {
        player.velY = -12;
        player.onGround = false;
      }

      // Apply physics
      if (!player.onGround) {
        player.velY += 0.5; // gravity
      }

      // Update position
      player.x += player.velX;
      player.y += player.velY;

      // Ground collision
      if (player.y >= 476) {
        player.y = 476;
        player.velY = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }

      // Keep in bounds
      player.x = Math.max(0, Math.min(776, player.x));

      // Check shard collection
      shardsRef.current = shardsRef.current.filter((shard, index) => {
        const distance = Math.sqrt(
          Math.pow(player.x - shard.x, 2) + Math.pow(player.y - shard.y, 2)
        );
        if (distance < 30) {
          collectShard(index);
          return false; // Remove shard
        }
        return true; // Keep shard
      });

      // Death condition
      if (player.y > 650) {
        playerDie();
      }
    };

    // Render game
    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, 800, 600);

      // Draw ground
      ctx.fillStyle = '#2a2f3e';
      ctx.fillRect(0, 500, 800, 100);

      // Draw player
      const player = playerRef.current;
      ctx.fillStyle = '#20d4d4';
      ctx.fillRect(player.x, player.y, 24, 24);

      // Player glow
      ctx.shadowColor = '#20d4d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(player.x, player.y, 24, 24);
      ctx.shadowBlur = 0;

      // Draw shards
      const time = Date.now() * 0.005;
      shardsRef.current.forEach((shard, index) => {
        const pulse = Math.sin(time + index) * 0.2 + 0.8;
        
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

      // Draw cursor attention indicator
      const cursor = cursorRef.current;
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
      ctx.strokeRect(0, 0, 800, 600);

      // Draw score
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${score} | Shards: ${shardsRef.current.length}`, 10, 30);
    };

    // Game loop
    const gameLoop = () => {
      updateGame();
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    console.log('🚀 Starting working game loop');
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, isPlaying, isPaused, isGameOver, score, collectShard, playerDie, updateCursor]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="border border-game-border bg-game-bg rounded-lg cursor-none"
        style={{
          width: '800px',
          height: '600px',
          display: 'block',
          backgroundColor: '#1a1f2e'
        }}
      />
    </div>
  );
};

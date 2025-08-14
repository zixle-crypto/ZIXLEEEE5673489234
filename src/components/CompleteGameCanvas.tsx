/**
 * Complete game with room progression and ambiguous tiles
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { createRoom, Room, Tile } from '@/lib/roomSystem';

export const CompleteGameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const playerRef = useRef({ x: 50, y: 480, velX: 0, velY: 0, onGround: false, width: 24, height: 24 });
  const cursorRef = useRef({ x: 400, y: 300 });
  const currentRoomRef = useRef<Room>(createRoom(1));
  const roomNumberRef = useRef(1);

  const {
    score,
    isPlaying,
    isPaused,
    isGameOver,
    collectShard,
    playerDie,
    updateCursor
  } = useGameStore();

  // Calculate if tile should be attended based on cursor proximity
  const calculateAttention = (tile: Tile, cursor: { x: number; y: number }): boolean => {
    const distance = Math.sqrt(
      Math.pow(cursor.x - (tile.x + tile.width / 2), 2) +
      Math.pow(cursor.y - (tile.y + tile.height / 2), 2)
    );
    return distance < 80; // Attention radius
  };

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

    console.log('🎮 Setting up complete game with room progression');

    canvas.width = 800;
    canvas.height = 600;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Game update logic
    const updateGame = () => {
      if (!isPlaying || isPaused || isGameOver) return;

      const player = playerRef.current;
      const keys = keysRef.current;
      const room = currentRoomRef.current;

      // Update tile attention states
      room.tiles.forEach(tile => {
        tile.isAttended = calculateAttention(tile, cursorRef.current);
      });

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
        player.velY += 0.5;
      }

      player.x += player.velX;
      player.y += player.velY;

      // Platform collision
      let onPlatform = false;
      room.platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height + 10 &&
            player.velY >= 0) {
          player.y = platform.y - player.height;
          player.velY = 0;
          player.onGround = true;
          onPlatform = true;
        }
      });

      // Tile collision and state checking
      room.tiles.forEach(tile => {
        const isColliding = player.x < tile.x + tile.width &&
                           player.x + player.width > tile.x &&
                           player.y < tile.y + tile.height &&
                           player.y + player.height > tile.y;

        if (isColliding) {
          const isSafe = tile.safeWhenAttended ? tile.isAttended : !tile.isAttended;
          
          if (tile.type === 'bridge' && isSafe) {
            // Bridge acts like platform when safe
            if (player.y + player.height >= tile.y && 
                player.y + player.height <= tile.y + tile.height + 10 && 
                player.velY >= 0) {
              player.y = tile.y - player.height;
              player.velY = 0;
              player.onGround = true;
              onPlatform = true;
            }
          } else if (!isSafe) {
            // Hit danger state - player dies
            console.log('💀 Player hit dangerous tile:', tile.type);
            playerDie();
            return;
          } else if (tile.type === 'safe_platform' && isSafe) {
            // Safe platform collision
            if (player.y + player.height >= tile.y && 
                player.y + player.height <= tile.y + tile.height + 10 && 
                player.velY >= 0) {
              player.y = tile.y - player.height;
              player.velY = 0;
              player.onGround = true;
              onPlatform = true;
            }
          }
        }
      });

      // Keep in bounds
      player.x = Math.max(0, Math.min(776, player.x));

      // Check shard collection
      room.shards = room.shards.filter((shard, index) => {
        const distance = Math.sqrt(
          Math.pow(player.x - shard.x, 2) + Math.pow(player.y - shard.y, 2)
        );
        if (distance < 30) {
          collectShard(index);
          return false;
        }
        return true;
      });

      // Check if all shards collected - activate exit
      room.exitActive = room.shards.length === 0;

      // Check exit collision
      if (room.exitActive) {
        const exitDistance = Math.sqrt(
          Math.pow(player.x - room.exit.x, 2) + Math.pow(player.y - room.exit.y, 2)
        );
        if (exitDistance < 40) {
          // Progress to next room (max 100 rooms)
          if (roomNumberRef.current < 100) {
            roomNumberRef.current++;
            currentRoomRef.current = createRoom(roomNumberRef.current);
            player.x = currentRoomRef.current.spawn.x;
            player.y = currentRoomRef.current.spawn.y;
            player.velX = 0;
            player.velY = 0;
            console.log(`🚪 Progressed to room ${roomNumberRef.current}/100`);
          } else {
            console.log(`🎉 GAME COMPLETED! All 100 rooms finished!`);
            // Could trigger victory screen here
          }
        }
      }

      // Death condition
      if (player.y > 650) {
        playerDie();
      }
    };

    // Render game
    const render = () => {
      const room = currentRoomRef.current;
      
      // Clear canvas
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, 800, 600);

      // Draw platforms
      ctx.fillStyle = '#2a2f3e';
      room.platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });

      // Draw tiles with attention-based states
      room.tiles.forEach(tile => {
        const isSafe = tile.safeWhenAttended ? tile.isAttended : !tile.isAttended;
        
        if (tile.type === 'bridge') {
          if (isSafe) {
            // Bridge visible
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          }
          // Gap when not safe (no drawing)
        } else if (tile.type === 'danger_spike') {
          if (isSafe) {
            // Safe platform
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          } else {
            // Spikes
            ctx.fillStyle = '#ef4444';
            for (let i = 0; i < tile.width; i += 8) {
              ctx.beginPath();
              ctx.moveTo(tile.x + i, tile.y + tile.height);
              ctx.lineTo(tile.x + i + 4, tile.y);
              ctx.lineTo(tile.x + i + 8, tile.y + tile.height);
              ctx.fill();
            }
          }
        } else if (tile.type === 'safe_platform') {
          if (isSafe) {
            // Safe platform
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          } else {
            // Dangerous spikes
            ctx.fillStyle = '#ef4444';
            for (let i = 0; i < tile.width; i += 8) {
              ctx.beginPath();
              ctx.moveTo(tile.x + i, tile.y + tile.height);
              ctx.lineTo(tile.x + i + 4, tile.y);
              ctx.lineTo(tile.x + i + 8, tile.y + tile.height);
              ctx.fill();
            }
          }
        }

        // Draw attention indicator on tiles
        if (tile.isAttended) {
          ctx.strokeStyle = '#20d4d4';
          ctx.lineWidth = 2;
          ctx.strokeRect(tile.x - 2, tile.y - 2, tile.width + 4, tile.height + 4);
        }
      });

      // Draw player
      const player = playerRef.current;
      ctx.fillStyle = '#20d4d4';
      ctx.fillRect(player.x, player.y, player.width, player.height);

      ctx.shadowColor = '#20d4d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.shadowBlur = 0;

      // Draw shards
      const time = Date.now() * 0.005;
      room.shards.forEach((shard, index) => {
        const pulse = Math.sin(time + index) * 0.2 + 0.8;
        
        ctx.fillStyle = `hsl(45, 100%, ${60 * pulse}%)`;
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'hsl(45, 100%, 60%)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw exit portal
      const exit = room.exit;
      if (room.exitActive) {
        const pulse = Math.sin(time * 3) * 0.2 + 0.8;
        ctx.fillStyle = `hsl(180, 100%, ${45 * pulse}%)`;
        ctx.shadowColor = 'hsl(180, 100%, 45%)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 25 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = 'hsl(0, 0%, 50%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw cursor attention indicator
      const cursor = cursorRef.current;
      ctx.strokeStyle = 'hsla(180, 100%, 45%, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'hsla(180, 100%, 45%, 0.6)';
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw UI
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Room ${roomNumberRef.current}/100 | Score: ${score} | Shards: ${room.shards.length}`, 10, 30);
      if (roomNumberRef.current <= 100) {
        const difficulty = Math.floor((roomNumberRef.current - 1) / 10) + 1;
        ctx.fillText(`Difficulty Level: ${difficulty}/10 | Move cursor near tiles to change them!`, 10, 50);
      } else {
        ctx.fillText(`🎉 CONGRATULATIONS! You completed all 100 rooms! 🎉`, 10, 50);
      }
    };

    // Game loop
    const gameLoop = () => {
      updateGame();
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    console.log('🚀 Starting complete game with room progression');
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
        className={`border border-game-border bg-game-bg rounded-lg ${
          isPlaying && !isPaused && !isGameOver ? 'cursor-none' : 'cursor-default'
        }`}
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

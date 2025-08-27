/**
 * Complete game with room progression and ambiguous tiles
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { createRoom, Room, Tile } from '@/lib/roomSystem';

export const CompleteGameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  
  const initialRoom = createRoom(1);
  const playerRef = useRef({ x: initialRoom.spawn.x, y: initialRoom.spawn.y, velX: 0, velY: 0, onGround: true, width: 32, height: 32 });
  const cursorRef = useRef({ x: 400, y: 300 });
  const currentRoomRef = useRef<Room>(initialRoom);
  const roomNumberRef = useRef(1);

  const {
    player,
    currentRoom,
    roomsCleared,
    score,
    isPlaying,
    isPaused,
    isGameOver,
    collectShard,
    playerDie,
    updateCursor,
    nextRoom
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

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Fixed canvas setup - no dynamic resizing
    canvas.width = 800;
    canvas.height = 600;
    
    // Optimization settings
    ctx.imageSmoothingEnabled = false;
    
    // Sync state on mount
    if (isPlaying) {
      playerRef.current = { ...player };
      currentRoomRef.current = { ...currentRoom };
      roomNumberRef.current = roomsCleared + 1;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Ultra-fast game loop
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const gameLoop = (currentTime: number) => {
      if (currentTime - lastTime < frameInterval) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastTime = currentTime;

      // Get fresh state from store on each frame
      const gameState = useGameStore.getState();
      const { isPlaying: currentlyPlaying, isPaused: currentlyPaused, isGameOver: currentlyGameOver } = gameState;

      // Always render at least the background to avoid black screen
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, 800, 600);

      // Ground
      ctx.fillStyle = '#2a2f3e';
      ctx.fillRect(0, 568, 800, 32);

      if (!currentlyPlaying || currentlyPaused || currentlyGameOver) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const player = playerRef.current;
      const keys = keysRef.current;
      const room = currentRoomRef.current;
      const cursor = cursorRef.current;

      // Update tiles every 4th frame only
      if (Math.floor(currentTime / frameInterval) % 4 === 0) {
        for (let i = 0; i < room.tiles.length; i++) {
          const tile = room.tiles[i];
          const dx = cursor.x - (tile.x + 32);
          const dy = cursor.y - (tile.y + 16);
          tile.isAttended = (dx * dx + dy * dy) < 6400;
        }
      }

      // Input handling
      const leftPressed = keys.has('KeyA') || keys.has('ArrowLeft');
      const rightPressed = keys.has('KeyD') || keys.has('ArrowRight');
      const jumpPressed = (keys.has('KeyW') || keys.has('ArrowUp') || keys.has('Space')) && player.onGround;

      player.velX = leftPressed ? -5 : rightPressed ? 5 : 0;
      
      if (jumpPressed) {
        player.velY = -12;
        player.onGround = false;
      }

      // Physics
      if (!player.onGround) player.velY += 0.5;
      player.x += player.velX;
      player.y += player.velY;

      // Platform collisions - optimized
      let onPlatform = false;
      for (const platform of room.platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + 32 > platform.x &&
            player.y + 32 > platform.y &&
            player.y + 32 <= platform.y + platform.height + 15 &&
            player.velY >= 0) {
          player.y = platform.y - 32;
          player.velY = 0;
          player.onGround = true;
          onPlatform = true;
          break;
        }
      }

      // Tile collisions
      for (const tile of room.tiles) {
        if (player.x < tile.x + tile.width &&
            player.x + 32 > tile.x &&
            player.y < tile.y + tile.height &&
            player.y + 32 > tile.y) {
          
          const isSafe = tile.safeWhenAttended ? tile.isAttended : !tile.isAttended;
          
          if ((tile.type === 'bridge' || tile.type === 'safe_platform') && isSafe) {
            if (player.y + 32 > tile.y && 
                player.y + 32 <= tile.y + tile.height + 15 && 
                player.velY >= 0 &&
                player.y < tile.y) {
              player.y = tile.y - 32;
              player.velY = 0;
              player.onGround = true;
              onPlatform = true;
            }
          } else if (!isSafe) {
            playerDie();
            animationRef.current = requestAnimationFrame(gameLoop);
            return;
          }
        }
      }

      // Ground collision
      if (player.y >= 536) {
        player.y = 536;
        player.velY = 0;
        player.onGround = true;
      }

      // Bounds
      if (player.x < 0) player.x = 0;
      else if (player.x > 768) player.x = 768;

      // Shard collection
      for (let i = room.shards.length - 1; i >= 0; i--) {
        const shard = room.shards[i];
        const dx = player.x + 16 - shard.x;
        const dy = player.y + 16 - shard.y;
        if (dx * dx + dy * dy < 900) {
          collectShard(i);
          room.shards.splice(i, 1);
        }
      }

      room.exitActive = room.shards.length === 0;

      // Exit collision
      if (room.exitActive) {
        const dx = player.x + 16 - room.exit.x;
        const dy = player.y + 16 - room.exit.y;
        if (dx * dx + dy * dy < 1600) {
          nextRoom();
          animationRef.current = requestAnimationFrame(gameLoop);
          return;
        }
      }

      if (player.y > 600) {
        playerDie();
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // ULTRA FAST RENDERING (background already drawn above)

      // Platforms
      ctx.fillStyle = '#2a2f3e';
      for (const platform of room.platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      }

      // Tiles - simplified rendering
      for (const tile of room.tiles) {
        const isSafe = tile.safeWhenAttended ? tile.isAttended : !tile.isAttended;
        
        if (tile.type === 'bridge' && isSafe) {
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        } else if ((tile.type === 'danger_spike' || tile.type === 'safe_platform')) {
          if (isSafe) {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          }
        }

        if (tile.isAttended) {
          ctx.strokeStyle = '#20d4d4';
          ctx.lineWidth = 2;
          ctx.strokeRect(tile.x - 2, tile.y - 2, tile.width + 4, tile.height + 4);
        }
      }

      // Player - no glow for performance
      ctx.fillStyle = '#20d4d4';
      ctx.fillRect(player.x, player.y, 32, 32);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y, 32, 32);

      // Shards - minimal animation
      ctx.fillStyle = '#fbbf24';
      for (const shard of room.shards) {
        ctx.beginPath();
        ctx.arc(shard.x, shard.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Exit - no animation
      const exit = room.exit;
      if (room.exitActive) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(exit.x, exit.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Cursor - simplified
      if (isPlaying && !isPaused && !isGameOver) {
        ctx.strokeStyle = '#20d4d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 80, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#20d4d4';
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // UI - minimal text
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Room ${roomNumberRef.current} | Score: ${score} | Shards: ${room.shards.length}`, 10, 30);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove]);

  useEffect(() => {
    if (currentRoom.id !== currentRoomRef.current.id || isPlaying) {
      playerRef.current = { ...player };
      currentRoomRef.current = { ...currentRoom };
      roomNumberRef.current = roomsCleared + 1;
    }
  }, [currentRoom.id, roomsCleared, isPlaying, player, currentRoom]);

    return (
    <div className="w-full h-full flex items-center justify-center relative">
      <canvas
        ref={canvasRef}
        className={`border border-game-border bg-game-bg rounded-lg w-full h-full ${
          isPlaying && !isPaused && !isGameOver ? 'cursor-none' : 'cursor-default'
        }`}
        style={{
          display: 'block',
          backgroundColor: '#1a1f2e'
        }}
      />
    </div>
  );
};

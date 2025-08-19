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
  
  const playerRef = useRef({ x: 50, y: 480, velX: 0, velY: 0, onGround: false, width: 32, height: 32 });
  const cursorRef = useRef({ x: 400, y: 300 });
  const currentRoomRef = useRef<Room>(createRoom(1));
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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Optimized canvas setup - no resizing
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    // Sync with store state efficiently
    playerRef.current = { ...player };
    currentRoomRef.current = { ...currentRoom };
    roomNumberRef.current = roomsCleared + 1;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Game update logic - optimized for performance
    const updateGame = () => {
      if (!isPlaying || isPaused || isGameOver) return;

      const player = playerRef.current;
      const keys = keysRef.current;
      const room = currentRoomRef.current;

      // Cache cursor position to avoid repeated access
      const cursor = cursorRef.current;

      // Update tile attention states - optimized with early exit
      for (let i = 0; i < room.tiles.length; i++) {
        const tile = room.tiles[i];
        const dx = cursor.x - (tile.x + tile.width * 0.5);
        const dy = cursor.y - (tile.y + tile.height * 0.5);
        tile.isAttended = (dx * dx + dy * dy) < 6400; // 80px radius squared
      }

      // Handle keyboard input - cached key checks
      const leftPressed = keys.has('KeyA') || keys.has('ArrowLeft');
      const rightPressed = keys.has('KeyD') || keys.has('ArrowRight');
      const jumpPressed = (keys.has('KeyW') || keys.has('ArrowUp') || keys.has('Space')) && player.onGround;

      // Apply input
      player.velX = leftPressed ? -5 : rightPressed ? 5 : 0;
      
      if (jumpPressed) {
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

      // Platform collision - optimized loop
      let onPlatform = false;
      for (let i = 0; i < room.platforms.length; i++) {
        const platform = room.platforms[i];
        if (player.x < platform.x + platform.width &&
            player.x + 32 > platform.x &&
            player.y + 32 > platform.y &&
            player.y + 32 <= platform.y + platform.height + 15 &&
            player.velY >= 0) {
          player.y = platform.y - 32;
          player.velY = 0;
          player.onGround = true;
          onPlatform = true;
          break; // Exit early once we find a collision
        }
      }

      // Tile collision - optimized with early returns
      for (let i = 0; i < room.tiles.length; i++) {
        const tile = room.tiles[i];
        const isColliding = player.x < tile.x + tile.width &&
                           player.x + 32 > tile.x &&
                           player.y < tile.y + tile.height &&
                           player.y + 32 > tile.y;

        if (isColliding) {
          const isSafe = tile.safeWhenAttended ? tile.isAttended : !tile.isAttended;
          
          if ((tile.type === 'bridge' || tile.type === 'safe_platform') && isSafe) {
            // Platform collision - only top collision
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
            // Hit danger state - immediate death
            playerDie();
            return;
          }
        }
      }

      // Ground collision - optimized
      if (player.y >= 536) { // 568 - 32 for player height
        player.y = 536;
        player.velY = 0;
        player.onGround = true;
        onPlatform = true;
      }

      // Keep in bounds
      if (player.x < 0) player.x = 0;
      else if (player.x > 768) player.x = 768; // 800 - 32

      // Check shard collection - optimized with distance squared
      for (let i = room.shards.length - 1; i >= 0; i--) {
        const shard = room.shards[i];
        const dx = player.x + 16 - shard.x; // Center of player
        const dy = player.y + 16 - shard.y;
        if (dx * dx + dy * dy < 900) { // 30px radius squared
          collectShard(i);
          room.shards.splice(i, 1);
        }
      }

      // Check if all shards collected
      room.exitActive = room.shards.length === 0;

      // Check exit collision - optimized
      if (room.exitActive) {
        const dx = player.x + 16 - room.exit.x;
        const dy = player.y + 16 - room.exit.y;
        if (dx * dx + dy * dy < 1600) { // 40px radius squared
          nextRoom();
          return;
        }
      }

      // Death condition - fall damage at bottom
      if (player.y > 600) {
        playerDie();
        return;
      }
    };

    // Optimized render function - minimal draw calls
    const render = () => {
      const room = currentRoomRef.current;
      
      // Clear canvas once
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, 800, 600);

      // Draw ground first
      ctx.fillStyle = '#2a2f3e';
      ctx.fillRect(0, 568, 800, 32);

      // Draw platforms - batch similar operations
      ctx.fillStyle = '#2a2f3e';
      room.platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      });

      // Draw tiles - optimized state checking
      for (let i = 0; i < room.tiles.length; i++) {
        const tile = room.tiles[i];
        const isSafe = tile.safeWhenAttended ? tile.isAttended : !tile.isAttended;
        
        if (tile.type === 'bridge' && isSafe) {
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        } else if (tile.type === 'danger_spike') {
          if (isSafe) {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          } else {
            // Draw spikes more efficiently
            ctx.fillStyle = '#ef4444';
            const spikes = Math.floor(tile.width / 8);
            for (let j = 0; j < spikes; j++) {
              const x = tile.x + j * 8;
              ctx.beginPath();
              ctx.moveTo(x, tile.y + tile.height);
              ctx.lineTo(x + 4, tile.y);
              ctx.lineTo(x + 8, tile.y + tile.height);
              ctx.fill();
            }
          }
        } else if (tile.type === 'safe_platform') {
          if (isSafe) {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
          } else {
            // Draw spikes
            ctx.fillStyle = '#ef4444';
            const spikes = Math.floor(tile.width / 8);
            for (let j = 0; j < spikes; j++) {
              const x = tile.x + j * 8;
              ctx.beginPath();
              ctx.moveTo(x, tile.y + tile.height);
              ctx.lineTo(x + 4, tile.y);
              ctx.lineTo(x + 8, tile.y + tile.height);
              ctx.fill();
            }
          }
        }

        // Draw attention indicator
        if (tile.isAttended) {
          ctx.strokeStyle = '#20d4d4';
          ctx.lineWidth = 2;
          ctx.strokeRect(tile.x - 2, tile.y - 2, tile.width + 4, tile.height + 4);
        }
      }

      // Draw player - reduced glow operations
      const player = playerRef.current;
      
      // Main body
      ctx.fillStyle = '#20d4d4';
      ctx.fillRect(player.x, player.y, 32, 32);

      // Single glow pass
      ctx.shadowColor = '#20d4d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(player.x, player.y, 32, 32);
      ctx.shadowBlur = 0;
      
      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.x, player.y, 32, 32);

      // Draw shards - optimized animation
      if (room.shards.length > 0) {
        const time = Date.now() * 0.003; // Slower animation for better performance
        ctx.shadowColor = 'hsl(45, 100%, 60%)';
        ctx.shadowBlur = 10;
        
        for (let i = 0; i < room.shards.length; i++) {
          const shard = room.shards[i];
          const pulse = Math.sin(time + i * 0.5) * 0.15 + 0.85;
          const radius = 8 * pulse;
          
          ctx.fillStyle = `hsl(45, 100%, ${Math.floor(60 * pulse)}%)`;
          ctx.beginPath();
          ctx.arc(shard.x, shard.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw exit portal - optimized
      const exit = room.exit;
      if (room.exitActive) {
        const time = Date.now() * 0.002;
        const pulse = Math.sin(time) * 0.15 + 0.85;
        ctx.fillStyle = `hsl(180, 100%, ${Math.floor(45 * pulse)}%)`;
        ctx.shadowColor = 'hsl(180, 100%, 45%)';
        ctx.shadowBlur = 15;
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

      // Draw cursor indicator - only when active
      if (isPlaying && !isPaused && !isGameOver) {
        const cursor = cursorRef.current;
        ctx.strokeStyle = 'hsla(180, 100%, 45%, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 80, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'hsla(180, 100%, 45%, 0.8)';
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw UI - optimized text rendering
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Room ${roomNumberRef.current}/100 | Score: ${score} | Shards: ${room.shards.length}`, 10, 30);
      
      if (roomNumberRef.current <= 100) {
        const difficulty = Math.floor((roomNumberRef.current - 1) / 10) + 1;
        ctx.fillText(`Difficulty: ${difficulty}/10 | Move cursor to change tiles!`, 10, 50);
      } else {
        ctx.fillText(`🎉 CONGRATULATIONS! All 100 rooms completed! 🎉`, 10, 50);
      }
    };

    // Simple game loop - minimal overhead
    const gameLoop = () => {
      updateGame();
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    // Start immediately without delay
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

  // Separate useEffect to handle respawn/restart events and room transitions
  useEffect(() => {
    // Sync refs when store state changes (restart/respawn/room change)
    playerRef.current = { ...player };
    currentRoomRef.current = { ...currentRoom };
    roomNumberRef.current = roomsCleared + 1;
    console.log(`🔄 Synced with store - Room ${roomsCleared + 1}, Player at (${player.x}, ${player.y})`);
  }, [currentRoom.id, roomsCleared]); // Only sync on room changes, not player position

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

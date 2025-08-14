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

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (isPlaying && !isPaused && !isGameOver) {
      // Update game state
      handleInput(keysRef.current);
      updatePlayer(deltaTime);
      updateTiles(); // Update tile states based on attention

      // Check shard collection
      currentRoom.shards.forEach((shard, index) => {
        const distance = Math.sqrt(
          Math.pow(player.x - shard.x, 2) + Math.pow(player.y - shard.y, 2)
        );
        if (distance < 30) {
          collectShard(index);
        }
      });

      // Check if player reached exit
      const exitDistance = Math.sqrt(
        Math.pow(player.x - currentRoom.exit.x, 2) + Math.pow(player.y - currentRoom.exit.y, 2)
      );
      if (exitDistance < 40 && currentRoom.shards.length === 0) {
        nextRoom();
      }

      // Tile collision detection
      checkTileCollisions();

      // Simple death condition (fall off screen)
      if (player.y > CANVAS_HEIGHT + 50) {
        console.log('Player fell off screen!');
        playerDie();
      }
    }

    // Render game
    render();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isPaused, isGameOver, player, currentRoom, handleInput, updatePlayer, updateTiles, collectShard, playerDie, nextRoom]);

  // Collision detection for tiles
  const checkTileCollisions = useCallback(() => {
    currentRoom.tiles.forEach(tile => {
      if (isPlayerCollidingWithTile(player, tile)) {
        handleTileCollision(tile);
      }
    });
  }, [player, currentRoom.tiles]);

  const isPlayerCollidingWithTile = (player: any, tile: any): boolean => {
    // Only check collision for solid tiles in their current state
    const currentState = tile.isAttended ? tile.safeState : tile.dangerState;
    if (currentState === 'empty') return false; // No collision for gaps/doors
    
    return (
      player.x < tile.x + tile.width &&
      player.x + player.width > tile.x &&
      player.y < tile.y + tile.height &&
      player.y + player.height > tile.y
    );
  };

  const handleTileCollision = (tile: any) => {
    const currentState = tile.isAttended ? tile.safeState : tile.dangerState;
    
    switch (currentState) {
      case 'spike_stair':
        if (!tile.isAttended) {
          console.log('Player hit spikes!');
          playerDie(); // Hit spikes
        }
        break;
      case 'platform_saw':
        if (!tile.isAttended) {
          console.log('Player hit saw!');
          playerDie(); // Hit spinning saw
        }
        break;
      case 'solid':
        // Platform collision - could add platform physics here
        break;
      case 'empty':
        // No collision for gaps/doors
        break;
    }
  };

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) {
      console.log('Canvas or context not available');
      return;
    }

    // Clear and fill background - make it very obvious
    ctx.fillStyle = '#1a1f2e'; // Solid dark blue
    ctx.fillRect(0, 0, 800, 600);
    
    // Draw a test rectangle to ensure rendering works
    ctx.fillStyle = '#20d4d4'; // Bright teal
    ctx.fillRect(50, 50, 100, 100);
    
    // Draw player as bright square
    ctx.fillStyle = '#20d4d4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw simple ground
    ctx.fillStyle = '#2a2f3e';
    ctx.fillRect(0, 500, 800, 100);
    
    // Draw shards as bright circles
    currentRoom.shards.forEach((shard) => {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(shard.x, shard.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    console.log('Frame rendered - player at:', player.x, player.y);

    // Clear canvas with animated background
    const time = Date.now() * 0.001;
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, `hsl(221, 39%, ${11 + Math.sin(time * 0.5) * 2}%)`);
    bgGradient.addColorStop(1, `hsl(221, 39%, ${8 + Math.sin(time * 0.3) * 1}%)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ambiguous tiles
    currentRoom.tiles.forEach(tile => {
      drawAmbiguousTile(ctx, tile, time);
    });

    // Draw ground platforms
    ctx.fillStyle = 'hsl(221, 30%, 15%)';
    ctx.shadowColor = 'hsl(180, 100%, 45%)';
    ctx.shadowBlur = 5;
    ctx.fillRect(0, 500, CANVAS_WIDTH, 100);
    ctx.shadowBlur = 0;

    // Draw player with enhanced effects
    drawPlayer(ctx, player, time);

    // Draw perception shards with enhanced effects
    drawPerceptionShards(ctx, currentRoom.shards, time);

    // Draw exit portal
    drawExitPortal(ctx, currentRoom.exit, time);

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

    // Draw room boundaries with glow
    ctx.strokeStyle = 'hsl(221, 20%, 25%)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'hsl(180, 100%, 45%)';
    ctx.shadowBlur = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.shadowBlur = 0;

  }, [player, currentRoom, cursor, isPlaying, isGameOver, dwellStartTime]);

  // Draw ambiguous tile with state-based rendering
  const drawAmbiguousTile = (ctx: CanvasRenderingContext2D, tile: any, time: number) => {
    const currentState = tile.isAttended ? tile.safeState : tile.dangerState;
    const isAnimating = tile.animating && (Date.now() - tile.lastStateChange) < 300;
    
    ctx.save();
    
    if (isAnimating) {
      const progress = (Date.now() - tile.lastStateChange) / 300;
      const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
      ctx.translate(tile.x + tile.width / 2, tile.y + tile.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-tile.width / 2, -tile.height / 2);
    } else {
      ctx.translate(tile.x, tile.y);
    }
    
    switch (currentState) {
      case 'solid':
        // Safe platform
        ctx.fillStyle = tile.isAttended ? 'hsl(120, 60%, 50%)' : 'hsl(0, 0%, 50%)';
        ctx.fillRect(0, 0, tile.width, tile.height);
        if (tile.isAttended) {
          ctx.shadowColor = 'hsl(120, 60%, 50%)';
          ctx.shadowBlur = 10;
          ctx.fillRect(0, 0, tile.width, tile.height);
        }
        break;
        
      case 'spike_stair':
        // Spikes
        ctx.fillStyle = 'hsl(0, 85%, 55%)';
        for (let i = 0; i < tile.width; i += 8) {
          ctx.beginPath();
          ctx.moveTo(i, tile.height);
          ctx.lineTo(i + 4, 0);
          ctx.lineTo(i + 8, tile.height);
          ctx.fill();
        }
        ctx.shadowColor = 'hsl(0, 85%, 55%)';
        ctx.shadowBlur = 8;
        break;
        
      case 'platform_saw':
        // Spinning saw
        const rotation = time * 10;
        ctx.translate(tile.width / 2, tile.height / 2);
        ctx.rotate(rotation);
        ctx.fillStyle = 'hsl(0, 85%, 55%)';
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(12, 0);
          ctx.lineTo(8, 4);
          ctx.fill();
          ctx.rotate(Math.PI / 4);
        }
        break;
        
      case 'empty':
        // Gap/door - no visual
        break;
    }
    
    ctx.restore();
  };

  // Enhanced player rendering
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: any, time: number) => {
    ctx.save();
    
    const pulse = Math.sin(time * 8) * 0.1 + 0.9;
    ctx.fillStyle = player.alive ? `hsl(180, 100%, ${45 * pulse}%)` : 'hsl(0, 85%, 55%)';
    
    if (player.alive) {
      ctx.shadowColor = 'hsl(180, 100%, 45%)';
      ctx.shadowBlur = 15;
    }
    
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Add movement trail effect
    if (Math.abs(player.velX) > 1) {
      ctx.fillStyle = `hsla(180, 100%, 45%, 0.3)`;
      ctx.fillRect(player.x - player.velX, player.y, player.width, player.height);
    }
    
    ctx.restore();
  };

  // Enhanced shard rendering
  const drawPerceptionShards = (ctx: CanvasRenderingContext2D, shards: Vector2[], time: number) => {
    shards.forEach((shard) => {
      const pulse = Math.sin(time * 5) * 0.3 + 0.7;
      const rotation = time * 2;
      
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(rotation);
      
      // Draw diamond shape
      ctx.fillStyle = `hsl(45, 100%, ${60 * pulse}%)`;
      ctx.beginPath();
      ctx.moveTo(0, -12 * pulse);
      ctx.lineTo(8 * pulse, 0);
      ctx.lineTo(0, 12 * pulse);
      ctx.lineTo(-8 * pulse, 0);
      ctx.closePath();
      ctx.fill();
      
      // Glow effect
      ctx.shadowColor = 'hsl(45, 100%, 60%)';
      ctx.shadowBlur = 20;
      ctx.fill();
      
      ctx.restore();
    });
  };

  // Draw exit portal
  const drawExitPortal = (ctx: CanvasRenderingContext2D, exit: Vector2, time: number) => {
    const pulse = Math.sin(time * 3) * 0.2 + 0.8;
    const available = currentRoom.shards.length === 0;
    
    ctx.save();
    ctx.translate(exit.x, exit.y);
    
    if (available) {
      // Active portal
      ctx.fillStyle = `hsl(180, 100%, ${45 * pulse}%)`;
      ctx.shadowColor = 'hsl(180, 100%, 45%)';
      ctx.shadowBlur = 20;
      
      ctx.beginPath();
      ctx.arc(0, 0, 25 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner circle
      ctx.fillStyle = `hsl(180, 100%, ${70 * pulse}%)`;
      ctx.beginPath();
      ctx.arc(0, 0, 15 * pulse, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Inactive portal
      ctx.strokeStyle = 'hsl(0, 0%, 50%)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Setup event listeners and game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas not found in useEffect');
      return;
    }

    console.log('Setting up canvas:', canvas);
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log('Canvas size set to:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Start game loop
    console.log('Starting game loop...');
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
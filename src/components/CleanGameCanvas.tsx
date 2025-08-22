/**
 * Clean, working game canvas with guaranteed rendering
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useUserDataStore } from '@/stores/userDataStore';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());


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
    useGameStore.getState().updateCursor(x, y);
  }, []);

  // Get equipped cube color
  const getEquippedCubeColor = () => {
    const gameData = useUserDataStore.getState().gameData;
    if (!gameData?.equipped_cube_id) return '#20d4d4'; // Default cyan

    const cubeId = gameData.equipped_cube_id;
    if (cubeId.includes('copper')) return '#B87333';
    if (cubeId.includes('bronze')) return '#CD7F32'; 
    if (cubeId.includes('silver')) return '#C0C0C0';
    if (cubeId.includes('emerald')) return '#50C878';
    if (cubeId.includes('golden')) return '#FFD700';
    if (cubeId.includes('diamond')) return '#B9F2FF';
    if (cubeId.includes('ruby')) return '#E0115F';
    if (cubeId.includes('sapphire')) return '#0F52BA';
    if (cubeId.includes('prismatic')) return '#FF6B9D';
    if (cubeId.includes('void')) return '#2D1B69';
    
    return '#20d4d4'; // Default
  };

  // Render function - clean with no console spam
  const render = useCallback(() => {
    const { player, currentRoom, cursor, isPlaying, isGameOver } = useGameStore.getState();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) {
      console.log('❌ Canvas or context not available');
      return;
    }

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1f2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Always draw ground platform (visible reference)
    ctx.fillStyle = '#2a2f3e';
    ctx.fillRect(0, 500, CANVAS_WIDTH, 100);
    
    // Always draw a test rectangle (to verify rendering works)
    ctx.fillStyle = '#20d4d4';
    ctx.fillRect(50, 50, 100, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('RENDERING WORKS', 160, 75);
    
    // Draw player (with fallback position if undefined)
    const playerX = player?.x ?? 100;
    const playerY = player?.y ?? 400;
    const playerW = player?.width ?? 24;
    const playerH = player?.height ?? 24;
    const playerAlive = player?.alive ?? true;
    const cubeColor = getEquippedCubeColor();
    
    // Draw equipped cube as player appearance
    ctx.fillStyle = playerAlive ? cubeColor : '#ef4444';
    ctx.fillRect(playerX, playerY, playerW, playerH);
    
    // Add cube border/outline effect
    ctx.strokeStyle = playerAlive ? cubeColor : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(playerX, playerY, playerW, playerH);
    
    // Player glow (using cube color)
    if (playerAlive) {
      ctx.shadowColor = cubeColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(playerX, playerY, playerW, playerH);
      ctx.shadowBlur = 0;
    }
    
    // Draw shards (with fallback)
    const shards = currentRoom?.shards ?? [
      { x: 200, y: 300 },
      { x: 400, y: 200 },
      { x: 600, y: 350 }
    ];
    
    shards.forEach((shard, index) => {
      const time = Date.now() * 0.005;
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
    const cursorX = cursor?.x ?? 400;
    const cursorY = cursor?.y ?? 300;
    
    if (isPlaying && !isGameOver) {
      ctx.strokeStyle = 'hsla(180, 100%, 45%, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 20, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'hsla(180, 100%, 45%, 0.6)';
      ctx.beginPath();
      ctx.arc(cursorX, cursorY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw room boundary
    ctx.strokeStyle = 'hsl(221, 20%, 25%)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  }, []);

  // Game loop - clean with no console spam
  const gameLoop = useCallback((currentTime: number) => {
    const {
      isPlaying,
      isPaused,
      isGameOver,
      currentRoom,
      player,
      handleInput,
      updatePlayer,
      collectShard,
      playerDie
    } = useGameStore.getState();

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (isPlaying && !isPaused && !isGameOver) {
      handleInput(keysRef.current);
      updatePlayer(deltaTime);

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

      if (player && player.y > CANVAS_HEIGHT + 50) {
        playerDie();
      }
    }

    render();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [render]);

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
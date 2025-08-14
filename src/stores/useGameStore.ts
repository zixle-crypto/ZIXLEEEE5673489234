/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Player, GameRoom, Vector2, SaveData, GameStats } from '@/lib/gameTypes';
import { getWeeklySeed } from '@/lib/rng';

const GAME_CONFIG = {
  PLAYER_SPEED: 5,
  JUMP_FORCE: 12,
  GRAVITY: 0.5,
  PLAYER_SIZE: 24,
  ROOM_WIDTH: 800,
  ROOM_HEIGHT: 600,
};

interface GameStore extends GameState {
  // Actions
  initGame: () => void;
  updatePlayer: (deltaTime: number) => void;
  updateCursor: (x: number, y: number) => void;
  handleInput: (keys: Set<string>) => void;
  collectShard: (index: number) => void;
  playerDie: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  
  // Save data
  saveData: SaveData;
  updateSaveData: (stats: GameStats) => void;
}

const createInitialPlayer = (): Player => ({
  x: 100,
  y: 400,
  velX: 0,
  velY: 0,
  width: GAME_CONFIG.PLAYER_SIZE,
  height: GAME_CONFIG.PLAYER_SIZE,
  onGround: false,
  alive: true,
});

const createInitialRoom = (): GameRoom => ({
  id: 1,
  width: GAME_CONFIG.ROOM_WIDTH,
  height: GAME_CONFIG.ROOM_HEIGHT,
  tiles: [],
  shards: [
    { x: 200, y: 300 },
    { x: 400, y: 200 },
    { x: 600, y: 350 }
  ],
  spawn: { x: 100, y: 400 },
  exit: { x: 700, y: 400 }
});

const createInitialSaveData = (): SaveData => ({
  bestScore: 0,
  bestTime: 0,
  roomsCleared: 0,
  totalGamesPlayed: 0,
  weeklySeed: getWeeklySeed(),
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      player: createInitialPlayer(),
      currentRoom: createInitialRoom(),
      camera: { x: 0, y: 0 },
      cursor: { x: 0, y: 0 },
      
      roomsCleared: 0,
      score: 0,
      startTime: Date.now(),
      gameTime: 0,
      
      dwellStartTime: 0,
      lastCursorPos: { x: 0, y: 0 },
      
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      
      weeklySeed: getWeeklySeed(),
      saveData: createInitialSaveData(),

      // Actions
      initGame: () => {
        const now = Date.now();
        set({
          player: createInitialPlayer(),
          currentRoom: createInitialRoom(),
          camera: { x: 0, y: 0 },
          cursor: { x: 0, y: 0 },
          roomsCleared: 0,
          score: 0,
          startTime: now,
          gameTime: 0,
          dwellStartTime: now,
          lastCursorPos: { x: 0, y: 0 },
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          weeklySeed: getWeeklySeed(),
        });
      },

      updatePlayer: (deltaTime: number) => {
        const state = get();
        if (!state.isPlaying || state.isPaused || state.isGameOver) return;

        const player = { ...state.player };
        
        // Apply gravity
        if (!player.onGround) {
          player.velY += GAME_CONFIG.GRAVITY;
        }
        
        // Update position
        player.x += player.velX;
        player.y += player.velY;
        
        // Simple ground collision (floor at y=500)
        if (player.y > 500) {
          player.y = 500;
          player.velY = 0;
          player.onGround = true;
        } else {
          player.onGround = false;
        }
        
        // Keep player in bounds
        player.x = Math.max(0, Math.min(state.currentRoom.width - player.width, player.x));
        
        // Update game time
        const gameTime = Date.now() - state.startTime;
        
        set({ player, gameTime });
      },

      updateCursor: (x: number, y: number) => {
        const state = get();
        const lastPos = state.lastCursorPos;
        const now = Date.now();
        
        // Check if cursor moved significantly
        const moved = Math.abs(x - lastPos.x) > 5 || Math.abs(y - lastPos.y) > 5;
        
        set({
          cursor: { x, y },
          lastCursorPos: { x, y },
          dwellStartTime: moved ? now : state.dwellStartTime,
        });
      },

      handleInput: (keys: Set<string>) => {
        const state = get();
        if (!state.isPlaying || state.isPaused || state.isGameOver) return;

        const player = { ...state.player };
        
        // Horizontal movement
        player.velX = 0;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) {
          player.velX = -GAME_CONFIG.PLAYER_SPEED;
        }
        if (keys.has('KeyD') || keys.has('ArrowRight')) {
          player.velX = GAME_CONFIG.PLAYER_SPEED;
        }
        
        // Jumping
        if ((keys.has('KeyW') || keys.has('ArrowUp') || keys.has('Space')) && player.onGround) {
          player.velY = -GAME_CONFIG.JUMP_FORCE;
          player.onGround = false;
        }
        
        set({ player });
      },

      collectShard: (index: number) => {
        const state = get();
        const room = { ...state.currentRoom };
        room.shards = room.shards.filter((_, i) => i !== index);
        
        set({
          currentRoom: room,
          score: state.score + 100,
        });
      },

      playerDie: () => {
        set({
          isGameOver: true,
          isPlaying: false,
        });
      },

      pauseGame: () => {
        set({ isPaused: true });
      },

      resumeGame: () => {
        set({ isPaused: false });
      },

      restartGame: () => {
        get().initGame();
      },

      updateSaveData: (stats: GameStats) => {
        const state = get();
        const saveData = { ...state.saveData };
        
        saveData.bestScore = Math.max(saveData.bestScore, stats.score);
        saveData.bestTime = saveData.bestTime === 0 ? stats.timeElapsed : Math.min(saveData.bestTime, stats.timeElapsed);
        saveData.roomsCleared = Math.max(saveData.roomsCleared, stats.roomsCleared);
        saveData.totalGamesPlayed += 1;
        
        set({ saveData });
      },
    }),
    {
      name: 'perception-shift-save',
      partialize: (state) => ({ saveData: state.saveData }),
    }
  )
);

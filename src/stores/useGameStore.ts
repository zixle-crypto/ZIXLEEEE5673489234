/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Player, GameRoom, Vector2, SaveData, GameStats, AmbiguousTile, TileType } from '@/lib/gameTypes';
import { getWeeklySeed } from '@/lib/rng';
import { generateRoom } from '@/lib/levels';
import { shouldTileBeAttended, TileHysteresis, AttentionData } from '@/lib/perception';

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
  updateTiles: () => void;
  nextRoom: () => void;
  
  // Save data
  saveData: SaveData;
  updateSaveData: (stats: GameStats) => void;
  
  // Tile system
  hysteresis: TileHysteresis;
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

const createInitialRoom = (): GameRoom => {
  const weeklySeed = getWeeklySeed();
  return generateRoom(1, weeklySeed);
};

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
      hysteresis: new TileHysteresis(),

      // Actions
      initGame: () => {
        console.log('Initializing game...');
        const now = Date.now();
        const weeklySeed = getWeeklySeed();
        const initialRoom = generateRoom(1, weeklySeed);
        console.log('Generated room with', initialRoom.tiles.length, 'tiles and', initialRoom.shards.length, 'shards');
        
        set({
          player: createInitialPlayer(),
          currentRoom: initialRoom,
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
          weeklySeed,
        });
        console.log('Game initialized - isPlaying: true');
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
        if (player.y + player.height >= 500) {
          player.y = 500 - player.height;
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

      updateTiles: () => {
        const state = get();
        if (!state.isPlaying || state.isPaused || state.isGameOver) return;

        const now = Date.now();
        const room = { ...state.currentRoom };
        const dwellTime = now - state.dwellStartTime;

        const attentionData: AttentionData = {
          cursorX: state.cursor.x,
          cursorY: state.cursor.y,
          playerX: state.player.x + state.player.width / 2,
          playerY: state.player.y + state.player.height / 2,
          playerVelX: state.player.velX,
          playerVelY: state.player.velY,
          dwellTime,
        };

        // Update tile states based on attention
        room.tiles = room.tiles.map(tile => {
          const tilePos = { x: tile.x, y: tile.y, width: tile.width, height: tile.height };
          const shouldBeAttended = shouldTileBeAttended(attentionData, tilePos);

          // Check hysteresis to prevent flickering
          if (tile.isAttended !== shouldBeAttended && state.hysteresis.canChangeState(tile.id, now)) {
            state.hysteresis.recordStateChange(tile.id, now);
            return { ...tile, isAttended: shouldBeAttended, animating: true, lastStateChange: now };
          }

          return tile;
        });

        set({ currentRoom: room });
      },

      nextRoom: () => {
        const state = get();
        const nextRoomId = state.currentRoom.id + 1;
        const newRoom = generateRoom(nextRoomId, state.weeklySeed);
        
        set({
          currentRoom: newRoom,
          roomsCleared: state.roomsCleared + 1,
          score: state.score + 250, // Room completion bonus
          player: { ...createInitialPlayer(), x: newRoom.spawn.x, y: newRoom.spawn.y },
        });
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

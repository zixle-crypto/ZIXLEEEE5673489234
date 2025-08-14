/**
 * Clean, working game store with no console spam
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createRoom, type Room } from '@/lib/roomSystem';

interface Player {
  x: number;
  y: number;
  velX: number;
  velY: number;
  width: number;
  height: number;
  onGround: boolean;
  alive: boolean;
}

interface Shard {
  x: number;
  y: number;
}

interface GameRoom extends Room {
  exitActive: boolean;
}

interface GameState {
  player: Player;
  currentRoom: GameRoom;
  cursor: { x: number; y: number };
  
  // Game progress
  roomsCleared: number;
  score: number;
  startTime: number;
  
  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  
  // Weekly challenge
  weeklySeed: number;
}

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
  respawnInRoom: () => void;
  nextRoom: () => void;
}

const GAME_CONFIG = {
  PLAYER_SPEED: 5,
  JUMP_FORCE: 12,
  GRAVITY: 0.5,
  PLAYER_SIZE: 24,
};

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

const createInitialRoom = (roomNumber: number = 1): GameRoom => {
  const room = createRoom(roomNumber);
  return {
    ...room,
    exitActive: false
  };
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      player: createInitialPlayer(),
      currentRoom: createInitialRoom(),
      cursor: { x: 0, y: 0 },
      
      roomsCleared: 0,
      score: 0,
      startTime: Date.now(),
      
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      
      weeklySeed: 20241,

      // Actions
      initGame: () => {
        console.log('🎮 Initializing game state...');
        const newPlayer = createInitialPlayer();
        const newRoom = createInitialRoom(1);
        
        // Position player at spawn point
        newPlayer.x = newRoom.spawn.x;
        newPlayer.y = newRoom.spawn.y;
        
        console.log('🎯 Player created at:', newPlayer.x, newPlayer.y);
        console.log('🔸 Room created with', newRoom.shards.length, 'shards');
        
        set({
          player: newPlayer,
          currentRoom: newRoom,
          cursor: { x: 400, y: 300 }, // Center of canvas
          roomsCleared: 0,
          score: 0,
          startTime: Date.now(),
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          weeklySeed: 20241,
        });
        
        console.log('✅ Game initialized - isPlaying: true');
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
        
        // Ground collision (floor at y=476)
        if (player.y + player.height >= 476) {
          player.y = 476 - player.height;
          player.velY = 0;
          player.onGround = true;
        } else {
          player.onGround = false;
        }
        
        // Keep player in bounds
        player.x = Math.max(0, Math.min(776, player.x));
        
        set({ player });
      },

      updateCursor: (x: number, y: number) => {
        set({ cursor: { x, y } });
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
        
        // If all shards collected, activate exit
        if (room.shards.length === 0) {
          room.exitActive = true;
        }
        
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
        console.log('🔄 Restart game called');
        
        // Reset game state immediately
        const newPlayer = createInitialPlayer();
        const newRoom = createInitialRoom(1);
        
        // Position player at spawn point
        newPlayer.x = newRoom.spawn.x;
        newPlayer.y = newRoom.spawn.y;
        
        set({
          player: newPlayer,
          currentRoom: newRoom,
          cursor: { x: 400, y: 300 },
          roomsCleared: 0,
          score: 0,
          startTime: Date.now(),
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          weeklySeed: 20241,
        });
        
        console.log('✅ Game restarted successfully');
      },

      respawnInRoom: () => {
        console.log('🔄 Respawning in current room');
        const state = get();
        const newPlayer = createInitialPlayer();
        
        // Position player at current room's spawn point
        newPlayer.x = state.currentRoom.spawn.x;
        newPlayer.y = state.currentRoom.spawn.y;
        
        set({
          player: newPlayer,
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
        });
        
        console.log('✅ Player respawned in room');
      },

      nextRoom: () => {
        const state = get();
        const nextRoomNumber = state.roomsCleared + 2; // +1 for current room, +1 for next
        const newRoom = createInitialRoom(Math.min(nextRoomNumber, 100));
        const newPlayer = createInitialPlayer();
        
        // Position player at spawn point
        newPlayer.x = newRoom.spawn.x;
        newPlayer.y = newRoom.spawn.y;
        
        set({
          player: newPlayer,
          currentRoom: newRoom,
          roomsCleared: state.roomsCleared + 1,
          score: state.score + 500, // Bonus for completing room
        });
        
        console.log(`🚪 Advanced to room ${nextRoomNumber}`);
      },
    }),
    {
      name: 'perception-shift-save',
      partialize: (state) => ({ 
        score: state.score,
        weeklySeed: state.weeklySeed
      }),
    }
  )
);

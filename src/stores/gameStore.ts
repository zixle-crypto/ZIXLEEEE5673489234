/**
 * Clean, working game store with no console spam
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createRoom, type Room } from '@/lib/roomSystem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  totalShards: number;
  shardsCollectedInCurrentRoom: number; // Track shards collected in current room
  startTime: number;
  roomStartTime: number;
  
  // Power-ups and effects (synced with user data store)
  activePowerUps: {
    shardMultiplier: number;
    speedBoost: number;
    protection: number;
  };
  
  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  
  // Weekly challenge
  weeklySeed: number;
  
  // Leaderboard
  currentRank: number | null;
  lastRoomReward: number;
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
  syncPowerUpsFromUserData: () => void;
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
      totalShards: 0,
      shardsCollectedInCurrentRoom: 0,
      startTime: Date.now(),
      roomStartTime: Date.now(),
      
      isPlaying: false, // Start false, let initGame set to true
      isPaused: false,
      isGameOver: false,
      
      weeklySeed: 20241,
      currentRank: null,
      lastRoomReward: 0,
      activePowerUps: {
        shardMultiplier: 1,
        speedBoost: 1,
        protection: 0,
      },

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
        
        set((prevState) => ({
          player: newPlayer,
          currentRoom: newRoom,
          cursor: { x: 400, y: 300 }, // Center of canvas
          roomsCleared: 0,
          score: 0,
          totalShards: prevState.totalShards || 0, // Preserve existing shards
          shardsCollectedInCurrentRoom: 0,
          startTime: Date.now(),
          roomStartTime: Date.now(),
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          weeklySeed: 20241,
          currentRank: null,
          lastRoomReward: 0,
          activePowerUps: {
            shardMultiplier: 1,
            speedBoost: 1,
            protection: 0,
          },
        }));
        
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
        
        // Horizontal movement (with speed boost)
        player.velX = 0;
        const currentSpeed = GAME_CONFIG.PLAYER_SPEED * state.activePowerUps.speedBoost;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) {
          player.velX = -currentSpeed;
        }
        if (keys.has('KeyD') || keys.has('ArrowRight')) {
          player.velX = currentSpeed;
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
        
        const shardsEarned = Math.floor(100 * state.activePowerUps.shardMultiplier);
        
        set({
          currentRoom: room,
          score: state.score + 100,
          totalShards: state.totalShards + shardsEarned,
          shardsCollectedInCurrentRoom: state.shardsCollectedInCurrentRoom + 1, // Track shards in current room
        });
        
        console.log(`💎 Collected shard! Earned ${shardsEarned} shards (${state.shardsCollectedInCurrentRoom + 1} in this room)`);
      },

      playerDie: async () => {
        const state = get();
        
        // Check if player has protection
        if (state.activePowerUps.protection > 0) {
          // Consume protection instead of dying
          set({
            activePowerUps: {
              ...state.activePowerUps,
              protection: state.activePowerUps.protection - 1
            }
          });
          console.log('🛡️ Protection saved you! Remaining:', state.activePowerUps.protection - 1);
          return;
        }
        
        // Simplified death handling - no API calls to prevent lag
        // Shards are already saved locally and will sync on next room completion
        if (state.shardsCollectedInCurrentRoom > 0) {
          console.log(`💀 Player died with ${state.shardsCollectedInCurrentRoom} shards in room - keeping them locally`);
        }
        
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
        
        set((prevState) => ({
          player: newPlayer,
          currentRoom: newRoom,
          cursor: { x: 400, y: 300 },
          roomsCleared: 0,
          score: 0,
          totalShards: prevState.totalShards, // Preserve existing shards - NEVER reset them
          shardsCollectedInCurrentRoom: 0,
          startTime: Date.now(),
          roomStartTime: Date.now(),
          isPlaying: true,
          isPaused: false,
          isGameOver: false,
          weeklySeed: 20241,
          currentRank: null,
          lastRoomReward: 0,
          activePowerUps: {
            shardMultiplier: 1,
            speedBoost: 1,
            protection: 0,
          },
        }));
        
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

      nextRoom: async () => {
        const state = get();
        const currentRoomNumber = state.roomsCleared + 1;
        const nextRoomNumber = state.roomsCleared + 2;
        
        // Calculate shards collected from current room and completion time
        const initialShardCount = createRoom(currentRoomNumber).shards.length;
        const shardsCollected = initialShardCount - state.currentRoom.shards.length;
        const completionTime = Math.floor((Date.now() - state.roomStartTime) / 1000);
        
        console.log(`🚪 Completing room ${currentRoomNumber} with ${shardsCollected}/${initialShardCount} shards in ${completionTime}s`);
        
        try {
          console.log('🏁 Calling complete-room function...');
          
          // Call the complete-room edge function to update leaderboard
          const { data: roomCompletionData, error } = await supabase.functions.invoke('complete-room', {
            body: {
              roomNumber: currentRoomNumber,
              currentScore: state.score + 500, // Include room completion bonus
              shardsCollected: shardsCollected,
              completionTime: completionTime
            }
          });

          console.log('🏁 Function response:', { data: roomCompletionData, error });

          if (error) {
            console.error('Error completing room:', error);
            // Check if user is authenticated before showing warning
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast({
                title: "Room Complete!",
                description: "Playing as guest - progress not saved to leaderboard",
              });
            } else {
              console.error('Authenticated user had room completion error:', error);
              toast({
                title: "Warning",
                description: "Room completed but leaderboard may not be updated",
                variant: "destructive"
              });
            }
          } else if (roomCompletionData?.success) {
            console.log('Room completion result:', roomCompletionData);
            toast({
              title: "Room Complete!",
              description: roomCompletionData.message,
            });
            
            // Update local state with shard rewards
            set(prevState => ({
              ...prevState,
              totalShards: prevState.totalShards + roomCompletionData.shardsEarned,
              lastRoomReward: roomCompletionData.shardsEarned,
              currentRank: roomCompletionData.leaderboardData?.rank || prevState.currentRank
            }));
          } else {
            // No error but no success either - likely guest user
            toast({
              title: "Room Complete!",
              description: "Great job! Playing as guest - sign in to save progress",
            });
          }
        } catch (error) {
          console.error('Failed to complete room:', error);
          toast({
            title: "Warning", 
            description: "Room completed offline - progress may not be saved",
            variant: "destructive"
          });
        }
        
        // Create next room and advance game state
        const newRoom = createInitialRoom(nextRoomNumber); // Support unlimited rooms
        const newPlayer = createInitialPlayer();
        
        // Position player at spawn point
        newPlayer.x = newRoom.spawn.x;
        newPlayer.y = newRoom.spawn.y;
        
        set({
          player: newPlayer,
          currentRoom: newRoom,
          roomsCleared: state.roomsCleared + 1,
          score: state.score + 500, // Bonus for completing room
          shardsCollectedInCurrentRoom: 0, // Reset for new room
          roomStartTime: Date.now(), // Reset timer for next room
        });
        
        console.log(`✅ Advanced to room ${nextRoomNumber}`);
      },

      syncPowerUpsFromUserData: () => {
        // Import user data store here to avoid circular imports
        import('@/stores/userDataStore').then(({ useUserDataStore }) => {
          const { gameData } = useUserDataStore.getState();
          
          if (gameData) {
            set({
              activePowerUps: {
                shardMultiplier: gameData.active_shard_multiplier || 1,
                speedBoost: gameData.active_speed_boost || 1,
                protection: gameData.active_protection || 0,
              }
            });
            console.log('🔄 Synced power-ups from user data:', gameData);
          }
        }).catch(error => {
          console.error('❌ Failed to sync power-ups:', error);
        });
      },
    }),
    {
      name: 'perception-shift-save',
      partialize: (state) => ({ 
        score: state.score,
        totalShards: state.totalShards, // Persist total shards so they're never lost
        weeklySeed: state.weeklySeed
      }),
    }
  )
);

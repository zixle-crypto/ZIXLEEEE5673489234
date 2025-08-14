/**
 * Core game type definitions
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  velX: number;
  velY: number;
  width: number;
  height: number;
  onGround: boolean;
  alive: boolean;
}

export enum TileType {
  // Static tiles
  EMPTY = 'empty',
  SOLID = 'solid',
  
  // Ambiguous tiles (have two states)
  SPIKE_STAIR = 'spike_stair',      // Spikes ⇄ Stairs
  GAP_BRIDGE = 'gap_bridge',        // Gap ⇄ Bridge
  WALL_DOOR = 'wall_door',          // Wall ⇄ Door
  PLATFORM_SAW = 'platform_saw',   // Platform ⇄ Saw
  
  // Special tiles
  PERCEPTION_SHARD = 'shard',
  SPAWN = 'spawn',
  EXIT = 'exit',
}

export interface AmbiguousTile {
  id: string;
  type: TileType;
  x: number;
  y: number;
  width: number;
  height: number;
  isAttended: boolean;          // Current state based on attention
  lastStateChange: number;      // For hysteresis
  safeState: TileType;         // State when attended
  dangerState: TileType;       // State when not attended
  animating: boolean;          // Currently animating between states
}

export interface GameRoom {
  id: number;
  width: number;
  height: number;
  tiles: AmbiguousTile[];
  shards: Vector2[];
  spawn: Vector2;
  exit: Vector2;
}

export interface GameState {
  player: Player;
  currentRoom: GameRoom;
  camera: Vector2;
  cursor: Vector2;
  
  // Game progress
  roomsCleared: number;
  score: number;
  startTime: number;
  gameTime: number;
  
  // Attention tracking
  dwellStartTime: number;
  lastCursorPos: Vector2;
  
  // Game status
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  
  // Weekly challenge
  weeklySeed: number;
}

export interface GameStats {
  score: number;
  roomsCleared: number;
  timeElapsed: number;
  shardsCollected: number;
  deathCount: number;
}

export interface SaveData {
  bestScore: number;
  bestTime: number;
  roomsCleared: number;
  totalGamesPlayed: number;
  weeklySeed: number;
}
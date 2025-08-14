/**
 * Procedural level generation with ambiguous tiles
 */

import { SeededRNG } from './rng';
import { GameRoom, AmbiguousTile, TileType, Vector2 } from './gameTypes';

const TILE_SIZE = 32;
const ROOM_WIDTH = 25; // tiles
const ROOM_HEIGHT = 19; // tiles

export interface TileConfig {
  type: TileType;
  safeState: TileType;
  dangerState: TileType;
  spawnChance: number;
}

const AMBIGUOUS_TILES: TileConfig[] = [
  {
    type: TileType.SPIKE_STAIR,
    safeState: TileType.SOLID, // Safe platform when attended
    dangerState: TileType.SPIKE_STAIR, // Spikes when not attended
    spawnChance: 0.15
  },
  {
    type: TileType.GAP_BRIDGE,
    safeState: TileType.SOLID, // Bridge when attended
    dangerState: TileType.EMPTY, // Gap when not attended
    spawnChance: 0.12
  },
  {
    type: TileType.WALL_DOOR,
    safeState: TileType.EMPTY, // Door when attended
    dangerState: TileType.SOLID, // Wall when not attended
    spawnChance: 0.10
  },
  {
    type: TileType.PLATFORM_SAW,
    safeState: TileType.SOLID, // Platform when attended
    dangerState: TileType.PLATFORM_SAW, // Spinning saw when not attended
    spawnChance: 0.08
  }
];

/**
 * Generate a procedural room with ambiguous tiles
 */
export function generateRoom(roomId: number, seed: number): GameRoom {
  const rng = new SeededRNG(seed + roomId);
  const tiles: AmbiguousTile[] = [];
  const shards: Vector2[] = [];
  
  // Create basic room layout with platforms
  const platforms = generatePlatformLayout(rng);
  
  // Add ambiguous tiles to platforms
  platforms.forEach((platform, index) => {
    // Skip spawn and exit platforms
    if (index === 0 || index === platforms.length - 1) return;
    
    // Decide if this platform should have ambiguous tiles
    if (rng.chance(0.7)) {
      const tileConfig = rng.choose(AMBIGUOUS_TILES);
      
      // Create tiles along the platform
      const tileCount = Math.min(3, Math.floor(platform.width / TILE_SIZE));
      for (let i = 0; i < tileCount; i++) {
        const x = platform.x + (i * TILE_SIZE);
        const y = platform.y - TILE_SIZE; // Above the platform
        
        tiles.push({
          id: `${roomId}-${tiles.length}`,
          type: tileConfig.type,
          x,
          y,
          width: TILE_SIZE,
          height: TILE_SIZE,
          isAttended: false,
          lastStateChange: 0,
          safeState: tileConfig.safeState,
          dangerState: tileConfig.dangerState,
          animating: false
        });
      }
    }
    
    // Add perception shards
    if (rng.chance(0.4) && platform.width > 60) {
      shards.push({
        x: platform.x + platform.width / 2,
        y: platform.y - 40
      });
    }
  });
  
  // Add floating ambiguous tiles for extra challenge
  addFloatingObstacles(rng, tiles, roomId);
  
  // Ensure minimum shard count
  while (shards.length < 2) {
    shards.push({
      x: rng.range(100, ROOM_WIDTH * TILE_SIZE - 100),
      y: rng.range(100, ROOM_HEIGHT * TILE_SIZE - 200)
    });
  }
  
  return {
    id: roomId,
    width: ROOM_WIDTH * TILE_SIZE,
    height: ROOM_HEIGHT * TILE_SIZE,
    tiles,
    shards,
    spawn: { x: 50, y: 400 },
    exit: { x: ROOM_WIDTH * TILE_SIZE - 80, y: 400 }
  };
}

function generatePlatformLayout(rng: SeededRNG): Array<{x: number, y: number, width: number, height: number}> {
  const platforms = [];
  
  // Start platform
  platforms.push({ x: 0, y: 450, width: 120, height: 32 });
  
  // Middle platforms - create jumping challenges
  const platformCount = rng.range(4, 7);
  for (let i = 1; i < platformCount; i++) {
    const x = (i / platformCount) * (ROOM_WIDTH * TILE_SIZE - 200) + 100;
    const y = rng.range(250, 450);
    const width = rng.range(80, 160);
    
    platforms.push({ x, y, width, height: 32 });
  }
  
  // End platform
  platforms.push({ 
    x: ROOM_WIDTH * TILE_SIZE - 120, 
    y: 450, 
    width: 120, 
    height: 32 
  });
  
  return platforms;
}

function addFloatingObstacles(rng: SeededRNG, tiles: AmbiguousTile[], roomId: number): void {
  const obstacleCount = rng.range(2, 4);
  
  for (let i = 0; i < obstacleCount; i++) {
    const tileConfig = rng.choose(AMBIGUOUS_TILES);
    
    tiles.push({
      id: `${roomId}-floating-${i}`,
      type: tileConfig.type,
      x: rng.range(200, ROOM_WIDTH * TILE_SIZE - 200),
      y: rng.range(150, 350),
      width: TILE_SIZE,
      height: TILE_SIZE,
      isAttended: false,
      lastStateChange: 0,
      safeState: tileConfig.safeState,
      dangerState: tileConfig.dangerState,
      animating: false
    });
  }
}

/**
 * Generate a sequence of connected rooms for progression
 */
export function generateRoomSequence(startRoomId: number, count: number, seed: number): GameRoom[] {
  const rooms: GameRoom[] = [];
  
  for (let i = 0; i < count; i++) {
    const room = generateRoom(startRoomId + i, seed);
    
    // Increase difficulty with each room
    const difficultyMultiplier = 1 + (i * 0.2);
    room.tiles.forEach(tile => {
      // More ambiguous tiles in later rooms
      if (Math.random() < difficultyMultiplier * 0.1) {
        room.tiles.push({ ...tile, id: `${tile.id}-extra` });
      }
    });
    
    rooms.push(room);
  }
  
  return rooms;
}
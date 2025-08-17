/**
 * Complete room system with ambiguous tiles and progression
 */

export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'spike' | 'safe_platform' | 'danger_spike' | 'bridge' | 'gap';
  isAttended: boolean;
  safeWhenAttended: boolean; // true = safe when looked at, false = danger when looked at
}

export interface Room {
  id: number;
  platforms: Array<{ x: number; y: number; width: number; height: number }>;
  tiles: Tile[];
  shards: Array<{ x: number; y: number }>;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  exitActive: boolean;
}

// Create 1100 challenging but completable rooms with increasing difficulty
export const createRoom = (roomId: number): Room => {
  // Support up to 1100 rooms
  const id = Math.max(1, roomId);
  const difficultyLevel = Math.floor((id - 1) / 50); // Slower difficulty progression: 0-21 difficulty levels
  const roomInLevel = (id - 1) % 10; // 0-9 room within difficulty level
  
  // Room type patterns for variety
  const roomTypes = ['spikes', 'bridge', 'mixed', 'vertical', 'maze', 'timing', 'reverse', 'multi-bridge', 'platform-dance', 'gauntlet'];
  const roomType = roomTypes[roomInLevel];
  
  switch (roomType) {
    case 'spikes': // Spike rooms - Rooms 1, 11, 21, 31, etc.
      return createSpikeRoom(id, difficultyLevel);
      
    case 'bridge': // Bridge rooms - Rooms 2, 12, 22, 32, etc.
      return createBridgeRoom(id, difficultyLevel);
      
    case 'mixed': // Mixed challenge - Rooms 3, 13, 23, 33, etc.
      return createMixedRoom(id, difficultyLevel);
      
    case 'vertical': // Vertical climbing - Rooms 4, 14, 24, 34, etc.
      return createVerticalRoom(id, difficultyLevel);
      
    case 'maze': // Maze navigation - Rooms 5, 15, 25, 35, etc.
      return createMazeRoom(id, difficultyLevel);
      
    case 'timing': // Timing challenges - Rooms 6, 16, 26, 36, etc.
      return createTimingRoom(id, difficultyLevel);
      
    case 'reverse': // Reverse logic - Rooms 7, 17, 27, 37, etc.
      return createReverseRoom(id, difficultyLevel);
      
    case 'multi-bridge': // Multiple bridges - Rooms 8, 18, 28, 38, etc.
      return createMultiBridgeRoom(id, difficultyLevel);
      
    case 'platform-dance': // Platform dancing - Rooms 9, 19, 29, 39, etc.
      return createPlatformDanceRoom(id, difficultyLevel);
      
    case 'gauntlet': // Final gauntlet - Rooms 10, 20, 30, 40, etc.
      return createGauntletRoom(id, difficultyLevel);
      
    default:
      return createSpikeRoom(id, difficultyLevel);
  }
};

// Spike-focused rooms with increased difficulty
const createSpikeRoom = (id: number, difficulty: number): Room => {
  const spikeCount = Math.min(6, 3 + Math.floor(difficulty / 1.5)); // More spikes
  
  // Smaller, more challenging platforms with wider gaps
  const platforms = [
    { x: 0, y: 520, width: 80, height: 20 }, // Start platform (smaller)
    { x: 150, y: 400, width: 80, height: 20 }, // Jump platform (harder jump)
    { x: 320, y: 380, width: 60, height: 20 }, // Smaller middle platform
    { x: 480, y: 360, width: 80, height: 20 }, // Higher platform
    { x: 650, y: 400, width: 80, height: 20 }, // End platform
    { x: 720, y: 520, width: 80, height: 20 }  // Exit platform
  ];
  
  // More dangerous tiles with tighter spacing
  const tiles = Array.from({ length: spikeCount }, (_, i) => ({
    x: 200 + i * 80, // Closer together
    y: 340 - (i % 2) * 20, // Varying heights
    width: 32,
    height: 32,
    type: 'danger_spike' as const,
    isAttended: false,
    safeWhenAttended: Math.random() > 0.3 // 70% safe when attended, 30% reverse logic
  }));
  
  // Add some reverse logic tiles for higher difficulty
  if (difficulty > 3) {
    tiles.push({
      x: 120,
      y: 360,
      width: 32,
      height: 32,
      type: 'danger_spike' as const,
      isAttended: false,
      safeWhenAttended: false // Reverse logic - dangerous when attended
    });
  }
  
  return {
    id,
    platforms,
    tiles,
    shards: [
      { x: 115, y: 360 },
      { x: 280, y: 340 },
      { x: 440, y: 320 },
      { x: 610, y: 360 }
    ].slice(0, 2 + Math.floor(difficulty / 2)), // More shards to collect
    spawn: { x: 30, y: 480 },
    exit: { x: 750, y: 360 }, // Higher exit requiring precise jumping
    exitActive: false
  };
};

// Bridge-focused rooms with much higher difficulty
const createBridgeRoom = (id: number, difficulty: number): Room => {
  const bridgeSegments = Math.min(12, 6 + difficulty); // Longer bridges
  
  const platforms = [
    { x: 0, y: 520, width: 100, height: 20 }, // Smaller start platform
    { x: 700, y: 520, width: 100, height: 20 }, // Smaller end platform
  ];
  
  // Multiple bridge segments with gaps for higher difficulty
  const tiles = [];
  
  // First bridge segment
  for (let i = 0; i < Math.ceil(bridgeSegments / 2); i++) {
    tiles.push({
      x: 100 + i * 32,
      y: 480,
      width: 32,
      height: 20,
      type: 'bridge' as const,
      isAttended: false,
      safeWhenAttended: i % 2 === 0 || difficulty < 3 // Some reverse logic at higher difficulties
    });
  }
  
  // Gap in the middle (player must jump)
  
  // Second bridge segment
  for (let i = 0; i < Math.floor(bridgeSegments / 2); i++) {
    tiles.push({
      x: 400 + i * 32,
      y: 460, // Slightly higher
      width: 32,
      height: 20,
      type: 'bridge' as const,
      isAttended: false,
      safeWhenAttended: i % 3 !== 0 || difficulty < 5 // More complex logic
    });
  }
  
  // Add dangerous spikes between bridges for higher difficulty
  if (difficulty > 2) {
    tiles.push({
      x: 350,
      y: 500,
      width: 32,
      height: 32,
      type: 'danger_spike' as const,
      isAttended: false,
      safeWhenAttended: false // Always dangerous
    });
  }
  
  return {
    id,
    platforms,
    tiles,
    shards: [
      { x: 50, y: 480 },
      { x: 200, y: 440 }, // Above first bridge
      { x: 500, y: 420 }, // Above second bridge
      { x: 750, y: 480 },
    ].slice(0, 3 + Math.floor(difficulty / 3)),
    spawn: { x: 30, y: 480 },
    exit: { x: 750, y: 480 },
    exitActive: false
  };
};

// Mixed challenge rooms
const createMixedRoom = (id: number, difficulty: number): Room => {
  const platforms = [
    { x: 0, y: 520, width: 120, height: 20 },
    { x: 180, y: 450, width: 120, height: 20 },
    { x: 360, y: 400, width: 120, height: 20 },
    { x: 540, y: 450, width: 120, height: 20 },
    { x: 680, y: 520, width: 120, height: 20 },
  ];
  
  const tileCount = Math.min(4, 2 + Math.floor(difficulty / 2));
  const tiles = Array.from({ length: tileCount }, (_, i) => {
    const isReverse = difficulty > 5 && i % 2 === 0; // Some tiles are reverse logic
    return {
      x: 220 + i * 120,
      y: 410 - (i % 2) * 30,
      width: 32,
      height: 32,
      type: i % 2 === 0 ? 'danger_spike' : 'safe_platform' as any,
      isAttended: false,
      safeWhenAttended: !isReverse
    };
  });
  
  return {
    id,
    platforms,
    tiles,
    shards: [
      { x: 120, y: 480 },
      { x: 240, y: 410 },
      { x: 420, y: 360 },
      { x: 600, y: 410 }
    ].slice(0, 2 + Math.floor(difficulty / 3)),
    spawn: { x: 50, y: 480 },
    exit: { x: 720, y: 480 },
    exitActive: false
  };
};

// Vertical climbing rooms
const createVerticalRoom = (id: number, difficulty: number): Room => {
  const platforms = [
    { x: 200, y: 520, width: 150, height: 20 }, // Start
    { x: 450, y: 450, width: 150, height: 20 }, // Level 1
    { x: 200, y: 380, width: 150, height: 20 }, // Level 2
    { x: 450, y: 310, width: 150, height: 20 }, // Level 3
    { x: 200, y: 240, width: 150, height: 20 }, // Level 4
    { x: 450, y: 170, width: 150, height: 20 }, // Top
  ];
  
  const tiles = [
    { x: 350, y: 410, width: 32, height: 32, type: 'danger_spike' as const, isAttended: false, safeWhenAttended: true },
    { x: 350, y: 340, width: 32, height: 32, type: 'danger_spike' as const, isAttended: false, safeWhenAttended: true },
    { x: 350, y: 270, width: 32, height: 32, type: 'danger_spike' as const, isAttended: false, safeWhenAttended: true },
  ];
  
  return {
    id,
    platforms,
    tiles,
    shards: [
      { x: 275, y: 480 },
      { x: 525, y: 410 },
      { x: 275, y: 340 },
      { x: 525, y: 130 }
    ].slice(0, 2 + Math.floor(difficulty / 2)),
    spawn: { x: 250, y: 480 },
    exit: { x: 525, y: 130 },
    exitActive: false
  };
};

// Maze navigation rooms
const createMazeRoom = (id: number, difficulty: number): Room => {
  const platforms = [
    { x: 0, y: 520, width: 100, height: 20 },
    { x: 200, y: 450, width: 100, height: 20 },
    { x: 400, y: 380, width: 100, height: 20 },
    { x: 500, y: 310, width: 100, height: 20 },
    { x: 300, y: 240, width: 100, height: 20 },
    { x: 100, y: 170, width: 100, height: 20 },
    { x: 600, y: 140, width: 100, height: 20 },
    { x: 700, y: 120, width: 100, height: 20 },
  ];
  
  // Create maze tiles with moderate challenge
  const tiles = [
    { x: 150, y: 410, width: 32, height: 32, type: 'safe_platform' as const, isAttended: false, safeWhenAttended: false },
    { x: 350, y: 340, width: 32, height: 32, type: 'danger_spike' as const, isAttended: false, safeWhenAttended: true },
    { x: 450, y: 270, width: 32, height: 32, type: 'safe_platform' as const, isAttended: false, safeWhenAttended: false },
    { x: 250, y: 200, width: 32, height: 32, type: 'danger_spike' as const, isAttended: false, safeWhenAttended: true },
  ];
  
  return {
    id,
    platforms,
    tiles,
    shards: [
      { x: 50, y: 480 },
      { x: 450, y: 340 },
      { x: 750, y: 80 },
    ],
    spawn: { x: 50, y: 480 },
    exit: { x: 750, y: 80 },
    exitActive: false
  };
};

// Continue with other room types...
const createTimingRoom = (id: number, difficulty: number): Room => {
  return createSpikeRoom(id, difficulty); // Simplified for now
};

const createReverseRoom = (id: number, difficulty: number): Room => {
  const room = createMixedRoom(id, difficulty);
  // All tiles have reverse logic
  room.tiles.forEach(tile => {
    tile.safeWhenAttended = false;
  });
  return room;
};

const createMultiBridgeRoom = (id: number, difficulty: number): Room => {
  const bridgeCount = 2 + Math.floor(difficulty / 2);
  return createBridgeRoom(id, difficulty);
};

const createPlatformDanceRoom = (id: number, difficulty: number): Room => {
  return createVerticalRoom(id, difficulty);
};

const createGauntletRoom = (id: number, difficulty: number): Room => {
  const room = createMixedRoom(id, difficulty);
  // Boss room - extra tiles and shards
  room.tiles.push(...room.tiles.map(tile => ({ 
    ...tile, 
    x: tile.x + 400, 
    safeWhenAttended: !tile.safeWhenAttended 
  })));
  room.shards.push({ x: 400, y: 200 });
  return room;
};
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

// Create challenging but completable rooms
export const createRoom = (roomId: number): Room => {
  switch (roomId) {
    case 1: // Tutorial room - Easy
      return {
        id: 1,
        platforms: [
          { x: 0, y: 520, width: 200, height: 20 }, // Start platform
          { x: 300, y: 450, width: 200, height: 20 }, // Middle platform
          { x: 600, y: 520, width: 200, height: 20 }, // End platform
        ],
        tiles: [
          // Simple attention-based spikes
          { x: 250, y: 400, width: 32, height: 32, type: 'danger_spike', isAttended: false, safeWhenAttended: true },
          { x: 350, y: 400, width: 32, height: 32, type: 'danger_spike', isAttended: false, safeWhenAttended: true },
        ],
        shards: [
          { x: 150, y: 480 },
          { x: 400, y: 410 },
        ],
        spawn: { x: 50, y: 480 },
        exit: { x: 720, y: 480 },
        exitActive: false
      };

    case 2: // Bridge room - Medium
      return {
        id: 2,
        platforms: [
          { x: 0, y: 520, width: 150, height: 20 },
          { x: 650, y: 520, width: 150, height: 20 },
        ],
        tiles: [
          // Gap that becomes bridge when attended
          { x: 200, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 232, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 264, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 296, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 328, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 360, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 392, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 424, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
          { x: 456, y: 520, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
        ],
        shards: [
          { x: 75, y: 480 },
          { x: 400, y: 480 }, // On the bridge
          { x: 725, y: 480 },
        ],
        spawn: { x: 50, y: 480 },
        exit: { x: 720, y: 480 },
        exitActive: false
      };

    case 3: // Mixed challenge - Hard
      return {
        id: 3,
        platforms: [
          { x: 0, y: 520, width: 120, height: 20 },
          { x: 200, y: 450, width: 120, height: 20 },
          { x: 400, y: 380, width: 120, height: 20 },
          { x: 600, y: 450, width: 120, height: 20 },
          { x: 680, y: 520, width: 120, height: 20 },
        ],
        tiles: [
          // Spikes that become platforms when attended
          { x: 200, y: 418, width: 32, height: 32, type: 'danger_spike', isAttended: false, safeWhenAttended: true },
          { x: 250, y: 418, width: 32, height: 32, type: 'danger_spike', isAttended: false, safeWhenAttended: true },
          // Platform that becomes spikes when attended (reverse logic!)
          { x: 400, y: 348, width: 32, height: 32, type: 'safe_platform', isAttended: false, safeWhenAttended: false },
          { x: 450, y: 348, width: 32, height: 32, type: 'safe_platform', isAttended: false, safeWhenAttended: false },
          // Bridge segments
          { x: 550, y: 450, width: 32, height: 20, type: 'bridge', isAttended: false, safeWhenAttended: true },
        ],
        shards: [
          { x: 75, y: 480 },
          { x: 260, y: 410 },
          { x: 460, y: 340 },
          { x: 745, y: 480 },
        ],
        spawn: { x: 50, y: 480 },
        exit: { x: 720, y: 480 },
        exitActive: false
      };

    default:
      // Generate endless rooms with increasing difficulty
      const difficultyLevel = Math.min(roomId - 3, 5);
      return {
        id: roomId,
        platforms: [
          { x: 0, y: 520, width: 100, height: 20 },
          { x: 150 + difficultyLevel * 20, y: 450 - difficultyLevel * 10, width: 100, height: 20 },
          { x: 300 + difficultyLevel * 30, y: 380 + difficultyLevel * 15, width: 100, height: 20 },
          { x: 500 + difficultyLevel * 10, y: 450, width: 100, height: 20 },
          { x: 700, y: 520, width: 100, height: 20 },
        ],
        tiles: Array.from({ length: 3 + difficultyLevel }, (_, i) => ({
          x: 120 + i * 150,
          y: 400 + (i % 2) * 50,
          width: 32,
          height: 32,
          type: Math.random() > 0.5 ? 'danger_spike' : 'safe_platform' as any,
          isAttended: false,
          safeWhenAttended: Math.random() > 0.3,
        })),
        shards: Array.from({ length: 2 + Math.floor(difficultyLevel / 2) }, (_, i) => ({
          x: 100 + i * 200,
          y: 400 - i * 20,
        })),
        spawn: { x: 50, y: 480 },
        exit: { x: 750, y: 480 },
        exitActive: false
      };
  }
};
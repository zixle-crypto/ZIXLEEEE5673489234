/**
 * Perception/Attention calculation system
 * Determines tile states based on cursor position and player movement
 */

export interface AttentionData {
  cursorX: number;
  cursorY: number;
  playerX: number;
  playerY: number;
  playerVelX: number;
  playerVelY: number;
  dwellTime: number;
}

export interface TilePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AttentionScore {
  distance: number;
  alignment: number;
  dwell: number;
  total: number;
}

const ATTENTION_CONFIG = {
  MAX_DISTANCE: 200,      // Max cursor distance for attention
  DWELL_THRESHOLD: 120,   // Min dwell time to commit (ms)
  HYSTERESIS_COOLDOWN: 180, // Prevent flickering (ms)
  DISTANCE_WEIGHT: 0.5,   // Weight for distance factor
  ALIGNMENT_WEIGHT: 0.3,  // Weight for movement alignment
  DWELL_WEIGHT: 0.2,      // Weight for dwell time
};

/**
 * Calculate attention score for a specific tile
 */
export function calculateAttentionScore(
  attention: AttentionData,
  tile: TilePosition
): AttentionScore {
  const tileCenterX = tile.x + tile.width / 2;
  const tileCenterY = tile.y + tile.height / 2;

  // Distance factor (closer = higher attention)
  const distance = Math.sqrt(
    Math.pow(attention.cursorX - tileCenterX, 2) +
    Math.pow(attention.cursorY - tileCenterY, 2)
  );
  const distanceScore = Math.max(0, 1 - distance / ATTENTION_CONFIG.MAX_DISTANCE);

  // Movement alignment factor
  const toTileX = tileCenterX - attention.playerX;
  const toTileY = tileCenterY - attention.playerY;
  const toTileLength = Math.sqrt(toTileX * toTileX + toTileY * toTileY);
  
  let alignmentScore = 0;
  if (toTileLength > 0) {
    const velocityLength = Math.sqrt(
      attention.playerVelX * attention.playerVelX + 
      attention.playerVelY * attention.playerVelY
    );
    
    if (velocityLength > 0) {
      const dotProduct = (toTileX * attention.playerVelX + toTileY * attention.playerVelY);
      const cosAngle = dotProduct / (toTileLength * velocityLength);
      alignmentScore = Math.max(0, cosAngle); // 0 to 1
    }
  }

  // Dwell time factor
  const dwellScore = Math.min(1, attention.dwellTime / ATTENTION_CONFIG.DWELL_THRESHOLD);

  // Weighted total
  const totalScore = 
    distanceScore * ATTENTION_CONFIG.DISTANCE_WEIGHT +
    alignmentScore * ATTENTION_CONFIG.ALIGNMENT_WEIGHT +
    dwellScore * ATTENTION_CONFIG.DWELL_WEIGHT;

  return {
    distance: distanceScore,
    alignment: alignmentScore,
    dwell: dwellScore,
    total: totalScore
  };
}

/**
 * Determine if a tile should be in its "attended" state
 */
export function shouldTileBeAttended(
  attention: AttentionData,
  tile: TilePosition,
  threshold: number = 0.5
): boolean {
  const score = calculateAttentionScore(attention, tile);
  return score.total > threshold && attention.dwellTime >= ATTENTION_CONFIG.DWELL_THRESHOLD;
}

/**
 * Hysteresis system to prevent tile flickering
 */
export class TileHysteresis {
  private lastStateChange = new Map<string, number>();
  
  canChangeState(tileId: string, currentTime: number): boolean {
    const lastChange = this.lastStateChange.get(tileId) || 0;
    return currentTime - lastChange > ATTENTION_CONFIG.HYSTERESIS_COOLDOWN;
  }
  
  recordStateChange(tileId: string, currentTime: number): void {
    this.lastStateChange.set(tileId, currentTime);
  }
}
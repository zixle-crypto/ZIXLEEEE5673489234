/**
 * Seeded RNG using mulberry32 algorithm
 * Ensures consistent generation for Weekly Seed Challenges
 */

export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 algorithm - fast, high-quality PRNG
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Generate integer between min and max (inclusive)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Generate boolean with given probability
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  // Choose random element from array
  choose<T>(array: T[]): T {
    return array[this.range(0, array.length - 1)];
  }
}

// Weekly seed based on current week
export function getWeeklySeed(): number {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return now.getFullYear() * 100 + weekNum;
}
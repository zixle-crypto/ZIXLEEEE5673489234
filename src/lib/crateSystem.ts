/**
 * Crate System - Purchasable containers with guaranteed rarity pools
 */

import { CUBE_LIBRARY, CubeRarity, RARITY_CONFIG } from './cubeLibrary';

export interface CrateType {
  id: string;
  name: string;
  description: string;
  price: number; // USD cents
  guaranteedRarity: CubeRarity;
  bonusRarities: { rarity: CubeRarity; chance: number }[];
  spinCount: number;
  series?: string;
  visual: {
    gradient: string;
    glow: string;
    animation: string;
  };
}

export interface CrateReward {
  cubeId: string;
  cubeName: string;
  rarity: CubeRarity;
  isBonus: boolean;
}

export const CRATE_TYPES: CrateType[] = [
  // === STARTER CRATES ===
  {
    id: 'basic_crate',
    name: 'Basic Cube Crate',
    description: 'Contains 3 guaranteed Common cubes with a chance for Rare.',
    price: 199, // $1.99
    guaranteedRarity: 'common',
    bonusRarities: [
      { rarity: 'rare', chance: 0.25 }
    ],
    spinCount: 3,
    visual: {
      gradient: 'from-gray-400 to-gray-600',
      glow: 'shadow-gray-500/30',
      animation: 'animate-pulse'
    }
  },

  {
    id: 'bronze_crate',
    name: 'Bronze Treasure Crate',
    description: 'Contains 5 cubes with guaranteed Rare and chance for Epic.',
    price: 499, // $4.99
    guaranteedRarity: 'rare',
    bonusRarities: [
      { rarity: 'epic', chance: 0.20 },
      { rarity: 'common', chance: 0.40 }
    ],
    spinCount: 5,
    visual: {
      gradient: 'from-amber-600 to-orange-700',
      glow: 'shadow-orange-500/40',
      animation: 'animate-bounce'
    }
  },

  // === PREMIUM CRATES ===
  {
    id: 'silver_crate',
    name: 'Silver Elite Crate',
    description: 'Contains 7 cubes with guaranteed Epic and chance for Legendary.',
    price: 999, // $9.99
    guaranteedRarity: 'epic',
    bonusRarities: [
      { rarity: 'legendary', chance: 0.15 },
      { rarity: 'rare', chance: 0.35 }
    ],
    spinCount: 7,
    visual: {
      gradient: 'from-slate-300 to-slate-500',
      glow: 'shadow-slate-400/50',
      animation: 'animate-spin'
    }
  },

  {
    id: 'gold_crate',
    name: 'Golden Legendary Crate',
    description: 'Contains 10 cubes with guaranteed Legendary and chance for Prismatic.',
    price: 1999, // $19.99
    guaranteedRarity: 'legendary',
    bonusRarities: [
      { rarity: 'prismatic', chance: 0.12 },
      { rarity: 'epic', chance: 0.30 }
    ],
    spinCount: 10,
    visual: {
      gradient: 'from-yellow-400 to-yellow-600',
      glow: 'shadow-yellow-500/60',
      animation: 'animate-pulse'
    }
  },

  // === ULTRA PREMIUM CRATES ===
  {
    id: 'prismatic_crate',
    name: 'Prismatic Wonder Crate',
    description: 'Contains 12 cubes with guaranteed Prismatic and chance for Mythic.',
    price: 4999, // $49.99
    guaranteedRarity: 'prismatic',
    bonusRarities: [
      { rarity: 'mythic', chance: 0.08 },
      { rarity: 'legendary', chance: 0.25 }
    ],
    spinCount: 12,
    visual: {
      gradient: 'from-pink-400 via-purple-500 to-cyan-400',
      glow: 'shadow-pink-500/70',
      animation: 'animate-spin'
    }
  },

  {
    id: 'mythic_crate',
    name: 'Mythic Divine Crate',
    description: 'Contains 15 cubes with guaranteed Mythic and chance for Cosmic.',
    price: 9999, // $99.99
    guaranteedRarity: 'mythic',
    bonusRarities: [
      { rarity: 'cosmic', chance: 0.05 },
      { rarity: 'prismatic', chance: 0.20 }
    ],
    spinCount: 15,
    visual: {
      gradient: 'from-orange-500 to-red-600',
      glow: 'shadow-orange-500/80',
      animation: 'animate-bounce'
    }
  },

  // === ULTIMATE CRATES ===
  {
    id: 'cosmic_crate',
    name: 'Cosmic Universe Crate',
    description: 'Contains 20 cubes with guaranteed Cosmic and chance for Eternal.',
    price: 19999, // $199.99
    guaranteedRarity: 'cosmic',
    bonusRarities: [
      { rarity: 'eternal', chance: 0.03 },
      { rarity: 'mythic', chance: 0.15 }
    ],
    spinCount: 20,
    visual: {
      gradient: 'from-cyan-400 to-blue-600',
      glow: 'shadow-cyan-500/90',
      animation: 'animate-pulse'
    }
  },

  {
    id: 'eternal_crate',
    name: 'Eternal Transcendence Crate',
    description: 'Contains 25 cubes with guaranteed Eternal power.',
    price: 49999, // $499.99
    guaranteedRarity: 'eternal',
    bonusRarities: [
      { rarity: 'cosmic', chance: 0.25 }
    ],
    spinCount: 25,
    visual: {
      gradient: 'from-emerald-400 to-green-600',
      glow: 'shadow-emerald-500/95',
      animation: 'animate-spin'
    }
  },

  // === THEMED CRATES ===
  {
    id: 'elemental_crate',
    name: 'Elemental Mastery Crate',
    description: 'Contains 8 elemental cubes across all rarities.',
    price: 1499, // $14.99
    guaranteedRarity: 'epic',
    bonusRarities: [
      { rarity: 'legendary', chance: 0.20 },
      { rarity: 'rare', chance: 0.40 }
    ],
    spinCount: 8,
    series: 'elemental',
    visual: {
      gradient: 'from-red-500 via-blue-500 to-green-500',
      glow: 'shadow-multicolor',
      animation: 'animate-pulse'
    }
  },

  {
    id: 'dragon_crate',
    name: 'Dragon Essence Crate',
    description: 'Contains 6 dragon-themed cubes with immense power.',
    price: 2999, // $29.99
    guaranteedRarity: 'legendary',
    bonusRarities: [
      { rarity: 'prismatic', chance: 0.15 },
      { rarity: 'mythic', chance: 0.05 }
    ],
    spinCount: 6,
    series: 'dragon',
    visual: {
      gradient: 'from-red-600 to-purple-800',
      glow: 'shadow-red-500/70',
      animation: 'animate-bounce'
    }
  },

  {
    id: 'celestial_crate',
    name: 'Celestial Bodies Crate',
    description: 'Contains 10 space-themed cubes with cosmic energy.',
    price: 3999, // $39.99
    guaranteedRarity: 'legendary',
    bonusRarities: [
      { rarity: 'prismatic', chance: 0.18 },
      { rarity: 'mythic', chance: 0.07 }
    ],
    spinCount: 10,
    series: 'celestial',
    visual: {
      gradient: 'from-purple-600 to-indigo-800',
      glow: 'shadow-purple-500/75',
      animation: 'animate-spin'
    }
  }
];

// Crate opening logic
export class CrateSpinner {
  static openCrate(crateType: CrateType): CrateReward[] {
    const rewards: CrateReward[] = [];
    
    // Filter cubes based on series if specified
    let availableCubes = CUBE_LIBRARY;
    if (crateType.series) {
      availableCubes = CUBE_LIBRARY.filter(cube => 
        cube.series?.toLowerCase().includes(crateType.series!) ||
        cube.element === crateType.series ||
        cube.name.toLowerCase().includes(crateType.series!)
      );
    }

    // Guarantee one cube of the specified rarity
    const guaranteedCubes = availableCubes.filter(cube => cube.rarity === crateType.guaranteedRarity);
    if (guaranteedCubes.length > 0) {
      const guaranteedCube = guaranteedCubes[Math.floor(Math.random() * guaranteedCubes.length)];
      rewards.push({
        cubeId: guaranteedCube.id,
        cubeName: guaranteedCube.name,
        rarity: guaranteedCube.rarity,
        isBonus: false
      });
    }

    // Generate remaining spins
    for (let i = 1; i < crateType.spinCount; i++) {
      let selectedRarity: CubeRarity = crateType.guaranteedRarity;
      
      // Check for bonus rarities
      for (const bonus of crateType.bonusRarities) {
        if (Math.random() < bonus.chance) {
          selectedRarity = bonus.rarity;
          break;
        }
      }

      // If no bonus hit, use weighted random
      if (selectedRarity === crateType.guaranteedRarity && Math.random() > 0.6) {
        const rand = Math.random();
        const rarities = Object.keys(RARITY_CONFIG) as CubeRarity[];
        let cumulativeChance = 0;
        
        for (const rarity of rarities) {
          cumulativeChance += RARITY_CONFIG[rarity].dropRate;
          if (rand <= cumulativeChance) {
            selectedRarity = rarity;
            break;
          }
        }
      }

      // Select cube of chosen rarity
      const cubesOfRarity = availableCubes.filter(cube => cube.rarity === selectedRarity);
      if (cubesOfRarity.length > 0) {
        const selectedCube = cubesOfRarity[Math.floor(Math.random() * cubesOfRarity.length)];
        rewards.push({
          cubeId: selectedCube.id,
          cubeName: selectedCube.name,
          rarity: selectedCube.rarity,
          isBonus: selectedRarity !== crateType.guaranteedRarity
        });
      }
    }

    return rewards;
  }

  static simulateSpinAnimation(rewards: CrateReward[]): Promise<CrateReward[]> {
    return new Promise((resolve) => {
      // Simulate spinner animation delay
      setTimeout(() => {
        resolve(rewards);
      }, 3000 + Math.random() * 2000); // 3-5 second animation
    });
  }
}

export const getCrateByPrice = (priceRange: [number, number]): CrateType[] => {
  return CRATE_TYPES.filter(crate => 
    crate.price >= priceRange[0] && crate.price <= priceRange[1]
  );
};

export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};
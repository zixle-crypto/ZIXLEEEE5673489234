/**
 * Shop Store - Manages cube inventory, restocking, and purchases
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CubeItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'prismatic';
  effect: {
    type: 'shard_multiplier' | 'speed_boost' | 'protection' | 'cosmetic';
    value: number;
    duration?: number; // in rooms
  };
  inStock: boolean;
  quantity: number;
}

export interface ShopState {
  inventory: CubeItem[];
  lastRestockTime: number;
  nextRestockTime: number;
  purchasedItems: string[]; // Track purchased item IDs
  activePowerUps: {
    shardMultiplier: number;
    speedBoost: number;
    protection: number;
  };
}

export interface ShopStore extends ShopState {
  // Actions
  generateInventory: () => void;
  purchaseItem: (itemId: string) => boolean;
  getTimeUntilRestock: () => number;
  applyPowerUp: (itemId: string) => void;
  consumePowerUp: (type: keyof ShopState['activePowerUps']) => void;
}

const RESTOCK_INTERVAL = 4 * 60 * 1000; // 4 minutes in milliseconds

const CUBE_TEMPLATES: Omit<CubeItem, 'inStock' | 'quantity'>[] = [
  // Common cubes (60% spawn chance)
  {
    id: 'copper_cube',
    name: 'Copper Cube',
    description: 'Basic cube that gives 1.2x shard multiplier for 2 rooms',
    cost: 50,
    rarity: 'common',
    effect: { type: 'shard_multiplier', value: 1.2, duration: 2 }
  },
  {
    id: 'bronze_cube',
    name: 'Bronze Cube', 
    description: 'Sturdy cube that provides protection for 1 room',
    cost: 75,
    rarity: 'common',
    effect: { type: 'protection', value: 1, duration: 1 }
  },
  
  // Rare cubes (25% spawn chance)
  {
    id: 'silver_cube',
    name: 'Silver Cube',
    description: 'Shiny cube that gives 1.5x shard multiplier for 3 rooms',
    cost: 150,
    rarity: 'rare',
    effect: { type: 'shard_multiplier', value: 1.5, duration: 3 }
  },
  {
    id: 'emerald_cube',
    name: 'Emerald Cube',
    description: 'Speed-enhancing cube that boosts movement by 25% for 2 rooms',
    cost: 200,
    rarity: 'rare',
    effect: { type: 'speed_boost', value: 1.25, duration: 2 }
  },
  
  // Epic cubes (10% spawn chance)
  {
    id: 'golden_cube',
    name: 'Golden Cube',
    description: 'Precious cube that gives 2x shard multiplier for 4 rooms',
    cost: 400,
    rarity: 'epic',
    effect: { type: 'shard_multiplier', value: 2.0, duration: 4 }
  },
  {
    id: 'diamond_cube',
    name: 'Diamond Cube',
    description: 'Ultra-hard cube providing protection for 3 rooms',
    cost: 500,
    rarity: 'epic',
    effect: { type: 'protection', value: 1, duration: 3 }
  },
  
  // Legendary cubes (4% spawn chance)
  {
    id: 'ruby_cube',
    name: 'Ruby Cube',
    description: 'Legendary cube with 2.5x shard multiplier for 5 rooms',
    cost: 800,
    rarity: 'legendary',
    effect: { type: 'shard_multiplier', value: 2.5, duration: 5 }
  },
  {
    id: 'sapphire_cube',
    name: 'Sapphire Cube',
    description: 'Legendary speed cube boosting movement by 50% for 3 rooms',
    cost: 900,
    rarity: 'legendary',
    effect: { type: 'speed_boost', value: 1.5, duration: 3 }
  },
  
  // Prismatic cubes (1% spawn chance)
  {
    id: 'prismatic_cube',
    name: 'Prismatic Cube',
    description: 'Ultimate cube with 3x shard multiplier for 10 rooms',
    cost: 2000,
    rarity: 'prismatic',
    effect: { type: 'shard_multiplier', value: 3.0, duration: 10 }
  },
  {
    id: 'void_cube',
    name: 'Void Cube',
    description: 'Mythical cube providing invulnerability for 5 rooms',
    cost: 2500,
    rarity: 'prismatic',
    effect: { type: 'protection', value: 1, duration: 5 }
  }
];

const getRaritySpawnChance = (rarity: CubeItem['rarity']): number => {
  switch (rarity) {
    case 'common': return 0.6;
    case 'rare': return 0.25;
    case 'epic': return 0.1;
    case 'legendary': return 0.04;
    case 'prismatic': return 0.01;
    default: return 0;
  }
};

export const useShopStore = create<ShopStore>()(
  persist(
    (set, get) => ({
      // Initial state
      inventory: [],
      lastRestockTime: Date.now(),
      nextRestockTime: Date.now() + RESTOCK_INTERVAL,
      purchasedItems: [],
      activePowerUps: {
        shardMultiplier: 1,
        speedBoost: 1,
        protection: 0,
      },

      // Actions
      generateInventory: () => {
        const newInventory: CubeItem[] = [];
        
        // Generate 6-8 random items based on rarity chances
        const numItems = 6 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < numItems; i++) {
          const random = Math.random();
          let selectedRarity: CubeItem['rarity'] = 'common';
          
          if (random <= 0.01) selectedRarity = 'prismatic';
          else if (random <= 0.05) selectedRarity = 'legendary';
          else if (random <= 0.15) selectedRarity = 'epic';
          else if (random <= 0.40) selectedRarity = 'rare';
          else selectedRarity = 'common';
          
          // Find cubes of selected rarity
          const availableCubes = CUBE_TEMPLATES.filter(cube => cube.rarity === selectedRarity);
          if (availableCubes.length > 0) {
            const randomCube = availableCubes[Math.floor(Math.random() * availableCubes.length)];
            
            // Check if this cube is already in inventory
            const existingIndex = newInventory.findIndex(item => item.id === randomCube.id);
            if (existingIndex >= 0) {
              // Increase quantity instead of adding duplicate
              newInventory[existingIndex].quantity += 1;
            } else {
              // Add new cube
              newInventory.push({
                ...randomCube,
                inStock: true,
                quantity: 1 + Math.floor(Math.random() * 3) // 1-3 quantity
              });
            }
          }
        }
        
        const now = Date.now();
        set({
          inventory: newInventory,
          lastRestockTime: now,
          nextRestockTime: now + RESTOCK_INTERVAL,
        });
        
        console.log('🛒 Shop restocked with', newInventory.length, 'unique items');
      },

      purchaseItem: (itemId: string) => {
        const state = get();
        const itemIndex = state.inventory.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return false;
        
        const item = state.inventory[itemIndex];
        if (!item.inStock || item.quantity <= 0) return false;
        
        // Update inventory
        const newInventory = [...state.inventory];
        newInventory[itemIndex] = {
          ...item,
          quantity: item.quantity - 1,
          inStock: item.quantity > 1
        };
        
        set({
          inventory: newInventory,
          purchasedItems: [...state.purchasedItems, itemId]
        });
        
        console.log('✅ Purchased:', item.name);
        return true;
      },

      getTimeUntilRestock: () => {
        const state = get();
        const timeLeft = state.nextRestockTime - Date.now();
        return Math.max(0, timeLeft);
      },

      applyPowerUp: (itemId: string) => {
        const cube = CUBE_TEMPLATES.find(template => template.id === itemId);
        if (!cube) return;
        
        const state = get();
        const newActivePowerUps = { ...state.activePowerUps };
        
        switch (cube.effect.type) {
          case 'shard_multiplier':
            newActivePowerUps.shardMultiplier = Math.max(newActivePowerUps.shardMultiplier, cube.effect.value);
            break;
          case 'speed_boost':
            newActivePowerUps.speedBoost = Math.max(newActivePowerUps.speedBoost, cube.effect.value);
            break;
          case 'protection':
            newActivePowerUps.protection += cube.effect.value;
            break;
        }
        
        set({ activePowerUps: newActivePowerUps });
        console.log('🔥 Applied power-up:', cube.name, cube.effect);
      },

      consumePowerUp: (type: keyof ShopState['activePowerUps']) => {
        const state = get();
        const newActivePowerUps = { ...state.activePowerUps };
        
        switch (type) {
          case 'shardMultiplier':
            newActivePowerUps.shardMultiplier = 1;
            break;
          case 'speedBoost':
            newActivePowerUps.speedBoost = 1;
            break;
          case 'protection':
            newActivePowerUps.protection = Math.max(0, newActivePowerUps.protection - 1);
            break;
        }
        
        set({ activePowerUps: newActivePowerUps });
      },
    }),
    {
      name: 'perception-shift-shop',
      partialize: (state) => ({
        lastRestockTime: state.lastRestockTime,
        nextRestockTime: state.nextRestockTime,
        purchasedItems: state.purchasedItems,
        activePowerUps: state.activePowerUps,
      }),
    }
  )
);
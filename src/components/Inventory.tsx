/**
 * Inventory component - Shows owned cubes and allows equipping
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Box, Shield, Zap, Star, Gem, Package } from 'lucide-react';
import { useShopStore } from '@/stores/shopStore';
import { useUserDataStore } from '@/stores/userDataStore';

interface InventoryProps {
  onBack: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ onBack }) => {
  const { 
    activePowerUps, 
    applyPowerUp,
    consumePowerUp 
  } = useShopStore();
  
  const { inventory: userInventory, gameData, loading, error } = useUserDataStore();
  
  console.log('Inventory component - userInventory:', userInventory, 'gameData:', gameData, 'loading:', loading, 'error:', error);
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'equipped' | string>('all');

  // Get cube templates for purchased items
  const CUBE_TEMPLATES = [
    // Common cubes
    {
      id: 'copper_cube',
      name: 'Copper Cube',
      description: 'Basic cube that gives 1.2x shard multiplier for 2 rooms',
      cost: 50,
      rarity: 'common' as const,
      effect: { type: 'shard_multiplier' as const, value: 1.2, duration: 2 }
    },
    {
      id: 'bronze_cube',
      name: 'Bronze Cube', 
      description: 'Sturdy cube that provides protection for 1 room',
      cost: 75,
      rarity: 'common' as const,
      effect: { type: 'protection' as const, value: 1, duration: 1 }
    },
    // Rare cubes
    {
      id: 'silver_cube',
      name: 'Silver Cube',
      description: 'Shiny cube that gives 1.5x shard multiplier for 3 rooms',
      cost: 150,
      rarity: 'rare' as const,
      effect: { type: 'shard_multiplier' as const, value: 1.5, duration: 3 }
    },
    {
      id: 'emerald_cube',
      name: 'Emerald Cube',
      description: 'Speed-enhancing cube that boosts movement by 25% for 2 rooms',
      cost: 200,
      rarity: 'rare' as const,
      effect: { type: 'speed_boost' as const, value: 1.25, duration: 2 }
    },
    // Epic cubes
    {
      id: 'golden_cube',
      name: 'Golden Cube',
      description: 'Precious cube that gives 2x shard multiplier for 4 rooms',
      cost: 400,
      rarity: 'epic' as const,
      effect: { type: 'shard_multiplier' as const, value: 2.0, duration: 4 }
    },
    {
      id: 'diamond_cube',
      name: 'Diamond Cube',
      description: 'Ultra-hard cube providing protection for 3 rooms',
      cost: 500,
      rarity: 'epic' as const,
      effect: { type: 'protection' as const, value: 1, duration: 3 }
    },
    // Legendary cubes
    {
      id: 'ruby_cube',
      name: 'Ruby Cube',
      description: 'Legendary cube with 2.5x shard multiplier for 5 rooms',
      cost: 800,
      rarity: 'legendary' as const,
      effect: { type: 'shard_multiplier' as const, value: 2.5, duration: 5 }
    },
    {
      id: 'sapphire_cube',
      name: 'Sapphire Cube',
      description: 'Legendary speed cube boosting movement by 50% for 3 rooms',
      cost: 900,
      rarity: 'legendary' as const,
      effect: { type: 'speed_boost' as const, value: 1.5, duration: 3 }
    },
    // Prismatic cubes
    {
      id: 'prismatic_cube',
      name: 'Prismatic Cube',
      description: 'Ultimate cube with 3x shard multiplier for 10 rooms',
      cost: 2000,
      rarity: 'prismatic' as const,
      effect: { type: 'shard_multiplier' as const, value: 3.0, duration: 10 }
    },
    {
      id: 'void_cube',
      name: 'Void Cube',
      description: 'Mythical cube providing invulnerability for 5 rooms',
      cost: 2500,
      rarity: 'prismatic' as const,
      effect: { type: 'protection' as const, value: 1, duration: 5 }
    }
  ];

  // Get owned cubes with counts from user inventory
  const ownedCubes = userInventory.reduce((acc, item) => {
    const template = CUBE_TEMPLATES.find(t => t.id === item.cube_id);
    if (template) {
      acc.push({ ...template, count: item.quantity });
    }
    return acc;
  }, [] as Array<typeof CUBE_TEMPLATES[0] & { count: number }>);

  const filteredItems = ownedCubes.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'equipped') {
      return (item.effect.type === 'shard_multiplier' && (gameData?.active_shard_multiplier || 1) > 1) ||
             (item.effect.type === 'speed_boost' && (gameData?.active_speed_boost || 1) > 1) ||
             (item.effect.type === 'protection' && (gameData?.active_protection || 0) > 0);
    }
    return item.rarity === selectedCategory;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      case 'prismatic': return 'text-pink-400 border-pink-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-400/10';
      case 'rare': return 'bg-blue-400/10';
      case 'epic': return 'bg-purple-400/10';
      case 'legendary': return 'bg-yellow-400/10';
      case 'prismatic': return 'bg-pink-400/10';
      default: return 'bg-gray-400/10';
    }
  };

  const getCubeIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return Box;
      case 'rare': return Shield;
      case 'epic': return Zap;
      case 'legendary': return Star;
      case 'prismatic': return Gem;
      default: return Box;
    }
  };

  const isEquipped = (item: typeof ownedCubes[0]) => {
    switch (item.effect.type) {
      case 'shard_multiplier':
        return (gameData?.active_shard_multiplier || 1) >= item.effect.value;
      case 'speed_boost':
        return (gameData?.active_speed_boost || 1) >= item.effect.value;
      case 'protection':
        return (gameData?.active_protection || 0) > 0;
      default:
        return false;
    }
  };

  const handleEquip = (item: typeof ownedCubes[0]) => {
    applyPowerUp(item.id);
  };

  const handleUnequip = (item: typeof ownedCubes[0]) => {
    switch (item.effect.type) {
      case 'shard_multiplier':
        consumePowerUp('shardMultiplier');
        break;
      case 'speed_boost':
        consumePowerUp('speedBoost');
        break;
      case 'protection':
        consumePowerUp('protection');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg p-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-game-border text-game-text hover:bg-game-surface flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </Button>
        
        <div className="text-center">
          <h1 className="text-4xl font-black text-perception font-orbitron tracking-wider">
            INVENTORY
          </h1>
          <p className="text-sm text-game-text mt-2">
            Manage your cube collection
          </p>
        </div>
        
        <div className="bg-game-surface border border-game-border rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-perception" />
            <span className="text-perception font-bold text-lg">{ownedCubes.length}</span>
          </div>
        </div>
      </div>

      {/* Active Power-ups */}
      <div className="mb-6 p-4 bg-game-surface border border-game-border rounded-lg">
        <h3 className="text-perception font-bold mb-3">ACTIVE EFFECTS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-game-text">Shard Multiplier: {gameData?.active_shard_multiplier || 1}x</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-game-text">Speed Boost: {Math.round(((gameData?.active_speed_boost || 1) - 1) * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-game-text">Protection: {gameData?.active_protection || 0} rooms</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {[
          { key: 'all', label: 'ALL' },
          { key: 'equipped', label: 'EQUIPPED' },
          { key: 'common', label: 'COMMON' },
          { key: 'rare', label: 'RARE' },
          { key: 'epic', label: 'EPIC' },
          { key: 'legendary', label: 'LEGENDARY' },
          { key: 'prismatic', label: 'PRISMATIC' }
        ].map(category => (
          <Button
            key={category.key}
            onClick={() => setSelectedCategory(category.key as any)}
            variant={selectedCategory === category.key ? 'default' : 'outline'}
            className={
              selectedCategory === category.key
                ? 'bg-perception text-white'
                : 'border-game-border text-game-text hover:bg-game-surface'
            }
            size="sm"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {filteredItems.map((item, index) => {
          const Icon = getCubeIcon(item.rarity);
          const equipped = isEquipped(item);
          
          return (
            <Card
              key={`${item.id}-${index}`}
              className={`bg-game-surface border-2 ${getRarityColor(item.rarity)} transition-all duration-200 hover:scale-105 ${getRarityBg(item.rarity)} relative`}
            >
              {/* Count indicator */}
              <div className="absolute top-2 right-2 bg-game-bg rounded-full px-2 py-1 text-xs">
                <span className="text-game-text">×{item.count}</span>
              </div>
              
              {/* Equipped indicator */}
              {equipped && (
                <div className="absolute top-2 left-2 bg-perception rounded-full px-2 py-1 text-xs">
                  <span className="text-white">EQUIPPED</span>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 p-3 rounded-full bg-game-bg border border-current">
                  <Icon className="w-8 h-8" />
                </div>
                <CardTitle className={`text-lg font-mono ${getRarityColor(item.rarity).split(' ')[0]}`}>
                  {item.name}
                </CardTitle>
                <p className="text-xs uppercase tracking-wider font-bold opacity-70">
                  {item.rarity}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-game-text-dim text-sm mb-4 min-h-[60px]">
                  {item.description}
                </p>
                
                {/* Effect display */}
                <div className="mb-3 p-2 bg-game-bg rounded border border-game-border">
                  <p className="text-xs text-perception">
                    {item.effect.type === 'shard_multiplier' && `${item.effect.value}x Shards (${item.effect.duration} rooms)`}
                    {item.effect.type === 'speed_boost' && `${Math.round((item.effect.value - 1) * 100)}% Speed (${item.effect.duration} rooms)`}
                    {item.effect.type === 'protection' && `Protection (${item.effect.duration} rooms)`}
                    
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={() => equipped ? handleUnequip(item) : handleEquip(item)}
                    className={
                      equipped
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-perception hover:bg-perception/90 text-white'
                    }
                    size="sm"
                  >
                    {equipped ? 'UNEQUIP' : 'EQUIP'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center text-game-text-dim py-8">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No cubes in this category</p>
          <p className="text-sm">Visit the shop to purchase cubes!</p>
        </div>
      )}
    </div>
  );
};
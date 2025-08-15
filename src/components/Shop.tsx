/**
 * Shop component - Grow a Garden style shop system
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Zap, Shield, Star } from 'lucide-react';

interface ShopProps {
  onBack: () => void;
  totalShards: number;
  onPurchase: (itemId: string, cost: number) => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ComponentType<any>;
  type: 'cosmetic' | 'powerup' | 'upgrade';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const shopItems: ShopItem[] = [
  {
    id: 'golden_trail',
    name: 'Golden Trail',
    description: 'Leave a shimmering golden trail behind your character',
    cost: 150,
    icon: Sparkles,
    type: 'cosmetic',
    rarity: 'rare'
  },
  {
    id: 'speed_boost',
    name: 'Speed Boost',
    description: 'Increases movement speed by 25% for 3 rooms',
    cost: 75,
    icon: Zap,
    type: 'powerup',
    rarity: 'common'
  },
  {
    id: 'shield_bubble',
    name: 'Shield Bubble',
    description: 'Protects from one death in the next room',
    cost: 100,
    icon: Shield,
    type: 'powerup',
    rarity: 'common'
  },
  {
    id: 'rainbow_aura',
    name: 'Rainbow Aura',
    description: 'Surround your character with a prismatic aura',
    cost: 300,
    icon: Star,
    type: 'cosmetic',
    rarity: 'epic'
  }
];

export const Shop: React.FC<ShopProps> = ({
  onBack,
  totalShards,
  onPurchase
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cosmetic' | 'powerup' | 'upgrade'>('all');

  const filteredItems = shopItems.filter(item => 
    selectedCategory === 'all' || item.type === selectedCategory
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-400/10';
      case 'rare': return 'bg-blue-400/10';
      case 'epic': return 'bg-purple-400/10';
      case 'legendary': return 'bg-yellow-400/10';
      default: return 'bg-gray-400/10';
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
            SHOP
          </h1>
        </div>
        
        <div className="bg-game-surface border border-game-border rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-perception text-xl">⬟</span>
            <span className="text-perception font-bold text-lg">{totalShards}</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 justify-center">
        {[
          { key: 'all', label: 'ALL' },
          { key: 'cosmetic', label: 'COSMETICS' },
          { key: 'powerup', label: 'POWER-UPS' },
          { key: 'upgrade', label: 'UPGRADES' }
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
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {filteredItems.map(item => {
          const canAfford = totalShards >= item.cost;
          const Icon = item.icon;
          
          return (
            <Card
              key={item.id}
              className={`bg-game-surface border-2 ${getRarityColor(item.rarity)} transition-all duration-200 hover:scale-105 ${getRarityBg(item.rarity)}`}
            >
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
                <p className="text-game-text-dim text-sm mb-4 min-h-[40px]">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-perception">⬟</span>
                    <span className="text-game-text font-bold">{item.cost}</span>
                  </div>
                  
                  <Button
                    onClick={() => canAfford && onPurchase(item.id, item.cost)}
                    disabled={!canAfford}
                    className={
                      canAfford
                        ? 'bg-perception hover:bg-perception/90 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                    size="sm"
                  >
                    {canAfford ? 'BUY' : 'NOT ENOUGH'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Shop Info */}
      <div className="mt-8 text-center text-game-text-dim text-sm max-w-2xl mx-auto">
        <p className="mb-2">
          💡 Cosmetic items are permanent once purchased
        </p>
        <p>
          ⚡ Power-ups are consumed when used and provide temporary effects
        </p>
      </div>
    </div>
  );
};
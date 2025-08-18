/**
 * Shop component - Cube-based shop system with restocking
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Sparkles, Zap, Shield, Star, Box, Gem, Gift } from 'lucide-react';
import { useShopStore, type CubeItem } from '@/stores/shopStore';
import { GiftModal } from '@/components/GiftModal';
import { CrateShop } from '@/components/CrateShop';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CrateReward } from '@/lib/crateSystem';

interface ShopProps {
  onBack: () => void;
  totalShards: number;
  onPurchase: (itemId: string, cost: number) => void;
}

export const Shop: React.FC<ShopProps> = ({
  onBack,
  totalShards,
  onPurchase
}) => {
  const { 
    inventory, 
    generateInventory, 
    purchaseItem, 
    getTimeUntilRestock,
    applyPowerUp 
  } = useShopStore();

  const [selectedGiftItem, setSelectedGiftItem] = useState<CubeItem | null>(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [showCrateShop, setShowCrateShop] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<'all' | CubeItem['rarity']>('all');
  const [timeUntilRestock, setTimeUntilRestock] = useState(0);

  // Initialize shop and start restock timer
  useEffect(() => {
    if (inventory.length === 0) {
      generateInventory();
    }
    
    const timer = setInterval(() => {
      const timeLeft = getTimeUntilRestock();
      setTimeUntilRestock(timeLeft);
      
      if (timeLeft <= 0) {
        generateInventory();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [inventory.length, generateInventory, getTimeUntilRestock]);

  const filteredItems = inventory.filter(item => 
    selectedCategory === 'all' || item.rarity === selectedCategory
  );

  const getRarityColor = (rarity: CubeItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      case 'prismatic': return 'text-pink-400 border-pink-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getRarityBg = (rarity: CubeItem['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-400/10';
      case 'rare': return 'bg-blue-400/10';
      case 'epic': return 'bg-purple-400/10';
      case 'legendary': return 'bg-yellow-400/10';
      case 'prismatic': return 'bg-pink-400/10';
      default: return 'bg-gray-400/10';
    }
  };

  const getCubeIcon = (rarity: CubeItem['rarity']) => {
    switch (rarity) {
      case 'common': return Box;
      case 'rare': return Shield;
      case 'epic': return Zap;
      case 'legendary': return Star;
      case 'prismatic': return Gem;
      default: return Box;
    }
  };

  const getCubeVisual = (rarity: CubeItem['rarity']) => {
    switch (rarity) {
      case 'common': 
        return 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-md';
      case 'rare': 
        return 'bg-gradient-to-br from-blue-300 to-blue-600 shadow-lg shadow-blue-500/25';
      case 'epic': 
        return 'bg-gradient-to-br from-purple-400 to-purple-700 shadow-xl shadow-purple-500/40 animate-pulse';
      case 'legendary': 
        return 'bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-2xl shadow-yellow-500/50 animate-pulse';
      case 'prismatic': 
        return 'bg-gradient-to-br from-pink-400 via-purple-500 to-cyan-400 shadow-2xl shadow-pink-500/60 animate-pulse';
      default: 
        return 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-md';
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePurchase = (item: CubeItem) => {
    if (totalShards >= item.cost && purchaseItem(item.id)) {
      onPurchase(item.id, item.cost);
      applyPowerUp(item.id);
    }
  };

  const handleGiftClick = (item: CubeItem) => {
    setSelectedGiftItem(item);
    setIsGiftModalOpen(true);
  };

  const handleGiftSend = async (recipient: string, message: string) => {
    if (!selectedGiftItem) return;
    
    try {
      console.log('🎁 Sending gift:', selectedGiftItem.name, 'to:', recipient);
      
      const { data: giftResult, error } = await supabase.functions.invoke('send-gift', {
        body: {
          cubeId: selectedGiftItem.id,
          cubeName: selectedGiftItem.name,
          cubeCost: selectedGiftItem.cost,
          recipient: recipient,
          recipientType: recipient.includes('@') ? 'email' : 'github',
          message: message
        }
      });

      if (error) {
        console.error('Gift sending failed:', error);
        toast({
          title: "Gift Failed",
          description: error.message || "Failed to send gift",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Gift sent successfully:', giftResult);
      toast({
        title: "Gift Sent! 🎁",
        description: `${selectedGiftItem.name} sent to ${recipient}!`,
      });

      // Update local shard count immediately
      if (onPurchase) {
        onPurchase(selectedGiftItem.id, selectedGiftItem.cost);
      }
      
    } catch (error) {
      console.error('Gift error:', error);
      toast({
        title: "Gift Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGiftModalOpen(false);
      setSelectedGiftItem(null);
    }
  };

  const handleCrateRewards = (rewards: CrateReward[]) => {
    rewards.forEach(reward => {
      // Add each cube to inventory (this would integrate with your user data store)
      console.log('Received cube:', reward.cubeName, reward.rarity);
    });
    toast({
      title: "Cubes Received!",
      description: `${rewards.length} cubes added to your collection!`,
    });
  };

  if (showCrateShop) {
    return (
      <CrateShop 
        onBack={() => setShowCrateShop(false)}
        onRewardsReceived={handleCrateRewards}
      />
    );
  }

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
            CUBE SHOP
          </h1>
          <Button
            onClick={() => setShowCrateShop(true)}
            className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
            size="sm"
          >
            💎 PREMIUM CRATES 💎
          </Button>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-perception" />
            <span className="text-sm text-game-text">
              Restocks in: {formatTime(timeUntilRestock)}
            </span>
          </div>
        </div>
        
        <div className="bg-game-surface border border-game-border rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-perception text-xl">⬟</span>
            <span className="text-perception font-bold text-lg">{totalShards}</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {[
          { key: 'all', label: 'ALL' },
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

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {filteredItems.map((item, index) => {
          const canAfford = totalShards >= item.cost && item.inStock && item.quantity > 0;
          const Icon = getCubeIcon(item.rarity);
          
          return (
            <Card
              key={`${item.id}-${index}`}
              className={`bg-game-surface border-2 ${getRarityColor(item.rarity)} transition-all duration-200 hover:scale-105 ${getRarityBg(item.rarity)} relative`}
            >
              {/* Stock indicator */}
              <div className="absolute top-2 right-2 bg-game-bg rounded-full px-2 py-1 text-xs">
                <span className="text-game-text">×{item.quantity}</span>
              </div>
              
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto mb-2 p-3 rounded-lg border border-current ${getCubeVisual(item.rarity)}`}>
                  <Icon className="w-8 h-8 text-white drop-shadow-lg" />
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
                    {item.effect.type === 'cosmetic' && 'Cosmetic Effect'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-perception">⬟</span>
                    <span className="text-game-text font-bold">{item.cost}</span>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={() => canAfford && handlePurchase(item)}
                      disabled={!canAfford}
                      className={
                        canAfford
                          ? 'bg-perception hover:bg-perception/90 text-white flex-1'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed flex-1'
                      }
                      size="sm"
                    >
                      {!item.inStock || item.quantity <= 0 ? 'OUT OF STOCK' :
                       !canAfford ? 'NOT ENOUGH' : 'BUY'}
                    </Button>
                    
                    <Button
                      onClick={() => handleGiftClick(item)}
                      disabled={!canAfford || !item.inStock || item.quantity <= 0}
                      variant="outline"
                      className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                      size="sm"
                    >
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredItems.length === 0 && (
        <div className="text-center text-game-text-dim py-8">
          <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No cubes available in this category</p>
          <p className="text-sm">Check back after restock!</p>
        </div>
      )}

      {/* Shop Info */}
      <div className="mt-8 text-center text-game-text-dim text-sm max-w-2xl mx-auto">
        <p className="mb-2">
          🎲 Cubes provide temporary gameplay effects when purchased
        </p>
        <p className="mb-2">
          ⏰ Shop restocks every 4 minutes with random cubes
        </p>
        <p>
          ✨ Rarity affects spawn chance: Common (60%) → Rare (25%) → Epic (10%) → Legendary (4%) → Prismatic (1%)
        </p>
      </div>
      
      <GiftModal
        isOpen={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        item={selectedGiftItem}
        onSend={handleGiftSend}
        senderShards={totalShards}
      />
    </div>
  );
};
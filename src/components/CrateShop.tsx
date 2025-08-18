/**
 * Crate Shop - Real money purchases for crate containers
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Gem, Star, Sparkles, Zap } from 'lucide-react';
import { CRATE_TYPES, CrateType, formatPrice } from '@/lib/crateSystem';
import { CrateSpinnerComponent } from './CrateSpinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CrateReward } from '@/lib/crateSystem';

interface CrateShopProps {
  onBack: () => void;
  onRewardsReceived: (rewards: CrateReward[]) => void;
}

export const CrateShop: React.FC<CrateShopProps> = ({ onBack, onRewardsReceived }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'starter' | 'premium' | 'ultra' | 'themed'>('all');
  const [selectedCrate, setSelectedCrate] = useState<CrateType | null>(null);
  const [isSpinnerOpen, setIsSpinnerOpen] = useState(false);
  const [purchasingCrate, setPurchasingCrate] = useState<string | null>(null);

  const categories = [
    { key: 'all', label: 'ALL CRATES', icon: Gem },
    { key: 'starter', label: 'STARTER', icon: Sparkles },
    { key: 'premium', label: 'PREMIUM', icon: Star },
    { key: 'ultra', label: 'ULTRA', icon: Zap },
    { key: 'themed', label: 'THEMED', icon: Gem }
  ];

  const getCratesByCategory = () => {
    switch (selectedCategory) {
      case 'starter':
        return CRATE_TYPES.filter(crate => crate.price <= 500);
      case 'premium':
        return CRATE_TYPES.filter(crate => crate.price > 500 && crate.price <= 2000);
      case 'ultra':
        return CRATE_TYPES.filter(crate => crate.price > 2000 && !crate.series);
      case 'themed':
        return CRATE_TYPES.filter(crate => crate.series);
      default:
        return CRATE_TYPES;
    }
  };

  const handlePurchase = async (crate: CrateType) => {
    setPurchasingCrate(crate.id);
    
    try {
      console.log('🛒 Creating checkout for crate:', crate.name);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceData: {
            currency: 'usd',
            product_data: {
              name: crate.name,
              description: crate.description,
              images: [] // Could add crate images here
            },
            unit_amount: crate.price,
          },
          quantity: 1,
          metadata: {
            crate_id: crate.id,
            crate_name: crate.name,
            spin_count: crate.spinCount.toString()
          }
        }
      });

      if (error) {
        console.error('Checkout creation failed:', error);
        toast({
          title: "Purchase Failed",
          description: error.message || "Failed to create checkout session",
          variant: "destructive"
        });
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Checkout Created",
          description: "Opening payment window...",
        });
      }

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setPurchasingCrate(null);
    }
  };

  const handleOpenCrate = (crate: CrateType) => {
    setSelectedCrate(crate);
    setIsSpinnerOpen(true);
  };

  const handleSpinnerClose = () => {
    setIsSpinnerOpen(false);
    setSelectedCrate(null);
  };

  const getCrateIcon = (price: number) => {
    if (price <= 500) return Sparkles;
    if (price <= 2000) return Star;
    if (price <= 10000) return Zap;
    return Gem;
  };

  const filteredCrates = getCratesByCategory();

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
            CRATE SHOP
          </h1>
          <p className="text-game-text-dim text-sm mt-2">
            Purchase premium crates with guaranteed rare cubes
          </p>
        </div>
        
        <div className="w-20"></div> {/* Spacer for balance */}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {categories.map(category => {
          const Icon = category.icon;
          return (
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
              <Icon className="w-4 h-4 mr-2" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Crates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {filteredCrates.map((crate) => {
          const Icon = getCrateIcon(crate.price);
          const isPurchasing = purchasingCrate === crate.id;
          
          return (
            <Card
              key={crate.id}
              className="bg-game-surface border-2 border-game-border transition-all duration-200 hover:scale-105 relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${crate.visual.gradient} opacity-10`}></div>
              
              <CardHeader className="text-center pb-4 relative">
                <div className={`mx-auto mb-4 p-4 rounded-xl border-2 border-game-border ${crate.visual.gradient} ${crate.visual.glow}`}>
                  <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                <CardTitle className="text-xl font-bold text-perception font-orbitron">
                  {crate.name}
                </CardTitle>
                <p className="text-game-text-dim text-sm min-h-[40px]">
                  {crate.description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0 relative">
                {/* Guaranteed Info */}
                <div className="mb-4 p-3 bg-game-bg rounded-lg border border-game-border">
                  <div className="text-xs text-perception mb-2 font-bold">GUARANTEED:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg uppercase font-bold" style={{ color: `var(--${crate.guaranteedRarity})` }}>
                      {crate.guaranteedRarity}
                    </span>
                    <span className="text-game-text-dim">+</span>
                    <span className="text-game-text">{crate.spinCount - 1} more</span>
                  </div>
                </div>

                {/* Bonus Rarities */}
                {crate.bonusRarities.length > 0 && (
                  <div className="mb-4 p-3 bg-game-bg rounded-lg border border-game-border">
                    <div className="text-xs text-perception mb-2 font-bold">BONUS CHANCES:</div>
                    <div className="space-y-1">
                      {crate.bonusRarities.map((bonus, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="uppercase font-bold" style={{ color: `var(--${bonus.rarity})` }}>
                            {bonus.rarity}
                          </span>
                          <span className="text-game-text-dim">
                            {(bonus.chance * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatPrice(crate.price)}
                    </div>
                    <div className="text-xs text-game-text-dim">
                      USD
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePurchase(crate)}
                      disabled={isPurchasing}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      {isPurchasing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          PROCESSING
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          BUY NOW
                        </>
                      )}
                    </Button>
                    
                    {/* Demo button - remove in production */}
                    <Button
                      onClick={() => handleOpenCrate(crate)}
                      variant="outline"
                      className="border-perception text-perception hover:bg-perception/10"
                      size="sm"
                    >
                      DEMO
                    </Button>
                  </div>
                </div>

                {/* Series Badge */}
                {crate.series && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-perception text-white px-2 py-1 rounded-full text-xs font-bold">
                      {crate.series.toUpperCase()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="mt-12 text-center text-game-text-dim text-sm max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-game-surface rounded-lg border border-game-border">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-perception" />
            <h3 className="font-bold text-perception mb-2">Guaranteed Rewards</h3>
            <p>Every crate guarantees at least one cube of the specified rarity or higher.</p>
          </div>
          
          <div className="p-4 bg-game-surface rounded-lg border border-game-border">
            <Star className="w-8 h-8 mx-auto mb-2 text-perception" />
            <h3 className="font-bold text-perception mb-2">Bonus Chances</h3>
            <p>Additional chances for higher rarity cubes beyond the guarantee.</p>
          </div>
          
          <div className="p-4 bg-game-surface rounded-lg border border-game-border">
            <Gem className="w-8 h-8 mx-auto mb-2 text-perception" />
            <h3 className="font-bold text-perception mb-2">Instant Delivery</h3>
            <p>Open your crates immediately and add cubes to your collection.</p>
          </div>
        </div>
      </div>

      {/* Crate Spinner Modal */}
      {selectedCrate && (
        <CrateSpinnerComponent
          crate={selectedCrate}
          isOpen={isSpinnerOpen}
          onClose={handleSpinnerClose}
          onRewardsReceived={onRewardsReceived}
        />
      )}
    </div>
  );
};
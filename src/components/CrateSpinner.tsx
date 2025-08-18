/**
 * Crate Spinner Component - Roulette system for opening crates
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Sparkles, Star, Gem, Zap } from 'lucide-react';
import { CrateType, CrateReward, CrateSpinner } from '@/lib/crateSystem';
import { RARITY_CONFIG } from '@/lib/cubeLibrary';
import { motion, AnimatePresence } from 'framer-motion';

interface CrateSpinnerProps {
  crate: CrateType;
  isOpen: boolean;
  onClose: () => void;
  onRewardsReceived: (rewards: CrateReward[]) => void;
}

export const CrateSpinnerComponent: React.FC<CrateSpinnerProps> = ({
  crate,
  isOpen,
  onClose,
  onRewardsReceived
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewards, setRewards] = useState<CrateReward[]>([]);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [spinnerItems, setSpinnerItems] = useState<CrateReward[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setIsSpinning(false);
      setRewards([]);
      setCurrentRewardIndex(0);
      setShowResults(false);
      setSpinnerItems([]);
    }
  }, [isOpen]);

  const handleSpin = async () => {
    setIsSpinning(true);
    
    // Generate rewards
    const newRewards = CrateSpinner.openCrate(crate);
    setRewards(newRewards);
    
    // Create spinner items (duplicate rewards + some extras for visual effect)
    const extraItems: CrateReward[] = [
      ...newRewards,
      ...newRewards,
      ...newRewards.slice(0, 5) // Add some extra duplicates
    ];
    setSpinnerItems(extraItems);
    
    // Simulate spinning animation
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    setIsSpinning(false);
    setShowResults(true);
    onRewardsReceived(newRewards);
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Sparkles className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      case 'epic': return <Zap className="w-4 h-4" />;
      case 'legendary': return <Gem className="w-4 h-4" />;
      case 'prismatic': return <Gem className="w-4 h-4" />;
      case 'mythic': return <Star className="w-4 h-4" />;
      case 'cosmic': return <Sparkles className="w-4 h-4" />;
      case 'eternal': return <Gem className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
    return config ? config.color : '#9CA3AF';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-game-surface border-2 border-game-border">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-perception font-orbitron">
                {crate.name}
              </h2>
              <p className="text-game-text-dim text-sm mt-1">
                {crate.description}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="icon"
              className="border-game-border text-game-text hover:bg-game-bg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Crate Visual */}
          <div className="text-center mb-8">
            <motion.div
              className={`w-32 h-32 mx-auto rounded-xl bg-gradient-to-br ${crate.visual.gradient} ${crate.visual.glow} border-4 border-game-border ${isSpinning ? crate.visual.animation : ''}`}
              animate={isSpinning ? { 
                rotateY: [0, 360],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ 
                duration: 0.8, 
                repeat: isSpinning ? Infinity : 0,
                ease: "linear"
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Gem className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
            </motion.div>
          </div>

          {/* Spinner Roulette */}
          {isSpinning && (
            <div className="mb-8">
              <div className="relative overflow-hidden h-24 bg-game-bg border-2 border-game-border rounded-lg">
                <div className="absolute inset-y-0 left-1/2 w-1 bg-perception z-10"></div>
                <motion.div
                  className="flex items-center h-full gap-2 px-4"
                  animate={{ x: [-1000, -2000, -3000, -2100] }}
                  transition={{ 
                    duration: 4, 
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  {Array.from({ length: 50 }, (_, i) => {
                    const reward = spinnerItems[i % spinnerItems.length];
                    if (!reward) return null;
                    
                    return (
                      <div
                        key={i}
                        className="flex-shrink-0 w-20 h-16 rounded border-2 flex flex-col items-center justify-center text-xs"
                        style={{ 
                          borderColor: getRarityColor(reward.rarity),
                          backgroundColor: `${getRarityColor(reward.rarity)}20`
                        }}
                      >
                        <div style={{ color: getRarityColor(reward.rarity) }}>
                          {getRarityIcon(reward.rarity)}
                        </div>
                        <span className="text-xs text-white mt-1 truncate w-full text-center">
                          {reward.cubeName.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2 text-perception">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span className="font-mono">Opening crate...</span>
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-xl font-bold text-perception mb-4 text-center">
                🎉 Crate Opened! 🎉
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className="p-3 rounded-lg border-2 text-center transition-all hover:scale-105"
                      style={{ 
                        borderColor: getRarityColor(reward.rarity),
                        backgroundColor: `${getRarityColor(reward.rarity)}15`
                      }}
                    >
                      {reward.isBonus && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                          BONUS!
                        </div>
                      )}
                      <div className="mb-2" style={{ color: getRarityColor(reward.rarity) }}>
                        {getRarityIcon(reward.rarity)}
                      </div>
                      <div className="text-xs font-bold mb-1 text-white">
                        {reward.cubeName}
                      </div>
                      <div className="text-xs opacity-75 uppercase" style={{ color: getRarityColor(reward.rarity) }}>
                        {reward.rarity}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4">
            {!isSpinning && !showResults && (
              <Button
                onClick={handleSpin}
                className="bg-perception hover:bg-perception/90 text-white px-8 py-3 text-lg font-bold"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Open Crate
              </Button>
            )}
            
            {showResults && (
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-bold"
                size="lg"
              >
                Collect Rewards
              </Button>
            )}
          </div>

          {/* Spin Info */}
          {!isSpinning && !showResults && (
            <div className="mt-6 text-center text-game-text-dim text-sm">
              <p>Guaranteed: <span style={{ color: getRarityColor(crate.guaranteedRarity) }} className="font-bold uppercase">{crate.guaranteedRarity}</span></p>
              <p>Spins: {crate.spinCount}</p>
              {crate.bonusRarities.length > 0 && (
                <p>Bonus Chances: {crate.bonusRarities.map(b => 
                  `${b.rarity} (${(b.chance * 100).toFixed(1)}%)`
                ).join(', ')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
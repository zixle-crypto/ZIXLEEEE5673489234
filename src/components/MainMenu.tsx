/**
 * Main menu component with Play, Leaderboard, and Shop buttons
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Trophy, ShoppingBag, Package, Gem, MessageSquare, Target } from 'lucide-react';
import { toast } from 'sonner';
import { FeedbackModal } from './FeedbackModal';

interface MainMenuProps {
  onPlay: () => void;
  onLeaderboard: () => void;
  onShop: () => void;
  onInventory: () => void;
  onCrateShop: () => void;
  onEngagementHub: () => void;
  totalShards: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onLeaderboard,
  onShop,
  onInventory,
  onCrateShop,
  onEngagementHub,
  totalShards
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Request notification permission on component mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Notifications enabled! You\'ll be notified when the shop restocks.');
        }
      });
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex flex-col items-center justify-center p-4 font-mono">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black text-perception mb-4 animate-perception-pulse font-orbitron tracking-wider">
          PERCEPTION SHIFT
        </h1>
        <p className="text-game-text-dim text-lg font-mono">
          Reality changes with your attention
        </p>
        
        {/* Shards Display */}
        <div className="mt-6 bg-game-surface border border-game-border rounded-lg px-6 py-3 inline-block">
          <div className="flex items-center gap-2">
            <span className="text-perception text-2xl">⬟</span>
            <span className="text-perception font-bold text-xl">{totalShards}</span>
            <span className="text-game-text-dim">Shards</span>
          </div>
        </div>
        
        {/* How to Play - First time user guidance */}
        <div className="mt-6 bg-game-surface/50 border border-game-border rounded-lg p-4 max-w-2xl mx-auto">
          <h3 className="text-perception font-bold mb-2">🎮 HOW TO PLAY</h3>
          <div className="text-game-text-dim text-sm space-y-1">
            <p>• Move with <span className="text-perception">WASD</span> or <span className="text-perception">Arrow Keys</span></p>
            <p>• Jump with <span className="text-perception">W</span>, <span className="text-perception">Up Arrow</span>, or <span className="text-perception">Space</span></p>
            <p>• Collect <span className="text-perception">⬟ Golden Shards</span> to complete rooms and earn currency</p>
            <p>• Buy power-up cubes in the <span className="text-perception">SHOP</span> and equip them in your <span className="text-perception">INVENTORY</span></p>
            <p>• Compete on the global <span className="text-perception">LEADERBOARD</span> with other players!</p>
            <p className="text-perception text-xs mt-2">💾 Your progress is automatically saved to your account</p>
          </div>
        </div>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button
          onClick={() => {
            // Optimized button - no processing during click
            requestAnimationFrame(() => onPlay());
          }}
          className="h-16 bg-perception hover:bg-perception/90 text-white font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
        >
          <Play className="w-6 h-6" />
          PLAY GAME
        </Button>
        
        <Button
          onClick={onLeaderboard}
          variant="outline"
          className="h-16 border-perception text-perception hover:bg-perception/10 font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
        >
          <Trophy className="w-6 h-6" />
          LEADERBOARD
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button
            onClick={onShop}
            variant="outline"
            className="h-16 border-game-border text-game-text hover:bg-game-surface font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
          >
            <ShoppingBag className="w-6 h-6" />
            SHOP
          </Button>
          
          {/* CRATES TEMPORARILY DISABLED */}
          {/*
          <Button
            onClick={onCrateShop}
            variant="outline"
            className="h-16 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
          >
            <Gem className="w-6 h-6" />
            CRATES
          </Button>
          */}
          
          <Button
            onClick={onInventory}
            variant="outline"
            className="h-16 border-purple-400 text-purple-400 hover:bg-purple-400/10 font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
          >
            <Package className="w-6 h-6" />
            INVENTORY
          </Button>

          <Button
            onClick={onEngagementHub}
            variant="outline"
            className="h-16 border-red-400 text-red-400 hover:bg-red-400/10 font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
          >
            <Target className="w-6 h-6" />
            CHALLENGES
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-4">
        <Button
          onClick={() => setShowFeedback(true)}
          variant="outline"
          size="sm"
          className="border-game-border text-game-text-dim hover:text-perception hover:border-perception font-mono"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Give Feedback
        </Button>
        <p className="text-game-text-dim text-sm">Weekly Seed Challenge • Compete globally</p>
      </div>

      <FeedbackModal 
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </div>
  );
};
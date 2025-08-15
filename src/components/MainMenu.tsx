/**
 * Main menu component with Play, Leaderboard, and Shop buttons
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Trophy, ShoppingBag, Package } from 'lucide-react';
import { toast } from 'sonner';

interface MainMenuProps {
  onPlay: () => void;
  onLeaderboard: () => void;
  onShop: () => void;
  onInventory: () => void;
  totalShards: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onLeaderboard,
  onShop,
  onInventory,
  totalShards
}) => {
  
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
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button
          onClick={onPlay}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={onShop}
            variant="outline"
            className="h-16 border-game-border text-game-text hover:bg-game-surface font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
          >
            <ShoppingBag className="w-6 h-6" />
            SHOP
          </Button>
          
          <Button
            onClick={onInventory}
            variant="outline"
            className="h-16 border-purple-400 text-purple-400 hover:bg-purple-400/10 font-mono text-xl flex items-center gap-3 transition-all duration-200 hover:scale-105"
          >
            <Package className="w-6 h-6" />
            INVENTORY
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-game-text-dim text-sm">
        <p>Weekly Seed Challenge • Compete globally</p>
      </div>
    </div>
  );
};
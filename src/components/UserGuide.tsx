/**
 * User Guide Component - Explains authentication flow and game mechanics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Save, Gamepad2, Trophy, ShoppingBag, Package } from 'lucide-react';

export const UserGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-perception font-orbitron tracking-wider mb-2">
          GAME GUIDE
        </h1>
        <p className="text-game-text-dim">Everything you need to know about Perception Shift</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication */}
        <Card className="bg-game-surface border-game-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-perception">
              <Mail className="w-5 h-5" />
              Account & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-game-text-dim text-sm space-y-2">
            <p>• <strong>Email Verification:</strong> Enter your email to receive a 6-digit code</p>
            <p>• <strong>Auto-Save:</strong> Your progress is automatically saved to your account</p>
            <p>• <strong>Cross-Device:</strong> Play on any device - just enter your email to load your data</p>
            <p>• <strong>No Passwords:</strong> We use magic codes instead of passwords for security</p>
            <p className="text-perception">💡 Same email = Same account with all your progress!</p>
          </CardContent>
        </Card>

        {/* Game Controls */}
        <Card className="bg-game-surface border-game-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-perception">
              <Gamepad2 className="w-5 h-5" />
              Game Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="text-game-text-dim text-sm space-y-2">
            <p>• <strong>Movement:</strong> WASD or Arrow Keys</p>
            <p>• <strong>Jump:</strong> W, Up Arrow, or Spacebar</p>
            <p>• <strong>Objective:</strong> Collect all golden shards (⬟) in each room</p>
            <p>• <strong>Exit:</strong> Touch the exit portal after collecting all shards</p>
            <p className="text-perception">🎯 Clear rooms quickly for bonus points!</p>
          </CardContent>
        </Card>

        {/* Progression System */}
        <Card className="bg-game-surface border-game-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-perception">
              <Trophy className="w-5 h-5" />
              Progression & Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="text-game-text-dim text-sm space-y-2">
            <p>• <strong>Shards:</strong> Currency earned by collecting golden shards</p>
            <p>• <strong>Score:</strong> Points for completing rooms and time bonuses</p>
            <p>• <strong>Global Ranking:</strong> Compete with players worldwide</p>
            <p>• <strong>Weekly Challenges:</strong> Fresh content every week</p>
            <p className="text-perception">🏆 Climb the leaderboard to prove your skills!</p>
          </CardContent>
        </Card>

        {/* Shop & Inventory */}
        <Card className="bg-game-surface border-game-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-perception">
              <ShoppingBag className="w-5 h-5" />
              Shop & Power-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="text-game-text-dim text-sm space-y-2">
            <p>• <strong>Shop:</strong> Buy power-up cubes with your shards</p>
            <p>• <strong>Inventory:</strong> Equip cubes to activate their effects</p>
            <p>• <strong>Cube Types:</strong> Shard multipliers, speed boosts, protection</p>
            <p>• <strong>Rarity:</strong> Common → Rare → Epic → Legendary → Prismatic</p>
            <p className="text-perception">💎 Higher rarity = more powerful effects!</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      <Card className="bg-perception/10 border-perception">
        <CardHeader>
          <CardTitle className="text-perception text-center">
            🚀 QUICK START GUIDE
          </CardTitle>
        </CardHeader>
        <CardContent className="text-game-text text-center space-y-2">
          <p>1. Verify your email → 2. Play the game → 3. Collect shards → 4. Buy power-ups → 5. Climb leaderboard!</p>
          <p className="text-perception font-bold">Your progress saves automatically - just play and have fun! 🎮</p>
        </CardContent>
      </Card>
    </div>
  );
};
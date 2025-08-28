import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StageIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomNumber: number;
  roomType: string;
  difficultyLevel: number;
}

const getRoomTypeInfo = (roomType: string, roomNumber: number, difficultyLevel: number) => {
  const roomInLevel = (roomNumber - 1) % 10; // 0-9 position within difficulty cycle
  
  const baseRoomData: Record<string, { title: string; description: string; tips: string[]; color: string; icon: string }> = {
    'spikes': {
      title: `Spike Chamber ${roomNumber}`,
      description: `Navigate through ${3 + Math.floor(difficultyLevel / 1.5)} deadly spikes. ${difficultyLevel > 3 ? 'WARNING: Some spikes use reverse logic!' : 'Focus your attention to deactivate red spikes.'}`,
      tips: [
        difficultyLevel === 0 ? 'Look at red spikes to deactivate them' : 'Most spikes are safe when you look at them',
        difficultyLevel > 3 ? 'BEWARE: Some spikes are dangerous when looked at!' : 'Trust your instincts with spike colors',
        roomInLevel < 5 ? 'Take your time and plan each jump' : 'Quick reflexes needed for tighter spacing',
        `Difficulty ${difficultyLevel + 1}: ${difficultyLevel < 3 ? 'Straightforward logic' : difficultyLevel < 7 ? 'Mixed logic patterns' : 'Expert reverse psychology'}`
      ],
      color: `bg-gradient-to-br from-red-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-orange-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '⚡'
    },
    'bridge': {
      title: `Phantom Bridge ${roomNumber}`,
      description: `Cross ${6 + difficultyLevel} invisible bridge segments. ${difficultyLevel > 2 ? 'Beware of spike traps between bridges!' : 'Focus to make bridges solid.'}`,
      tips: [
        `Look at ${Math.ceil((6 + difficultyLevel) / 2)} bridge segments to make them solid`,
        difficultyLevel > 2 ? 'Avoid the dangerous spikes between bridge sections' : 'Jump carefully between visible segments',
        roomInLevel % 2 === 0 ? 'First bridge has standard logic' : 'Second bridge may use reverse logic',
        `Bridges at height: ${480 - (difficultyLevel * 2)}px - plan your jumps accordingly`
      ],
      color: `bg-gradient-to-br from-blue-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-cyan-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '🌉'
    },
    'mixed': {
      title: `Mixed Reality ${roomNumber}`,
      description: `Navigate ${2 + Math.floor(difficultyLevel / 2)} mixed obstacles. ${difficultyLevel > 5 ? 'Complex reverse logic patterns ahead!' : 'Combination of spikes and safe platforms.'}`,
      tips: [
        `${2 + Math.floor(difficultyLevel / 2)} obstacles to overcome`,
        difficultyLevel > 5 ? 'Every other obstacle uses reverse logic' : 'Mix of safe platforms and danger spikes',
        roomInLevel < 3 ? 'Lower difficulty - trust your instincts' : 'Higher complexity - analyze each obstacle',
        `Platforms spaced ${120 - (difficultyLevel * 2)}px apart`
      ],
      color: `bg-gradient-to-br from-purple-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-pink-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '🔀'
    },
    'vertical': {
      title: `Ascending Tower ${roomNumber}`,
      description: `Climb ${6} vertical platforms with precision. ${difficultyLevel > 1 ? `Extra challenge: ${2 + Math.floor(difficultyLevel / 2)} shards to collect` : 'Focus on steady climbing rhythm.'}`,
      tips: [
        'Alternate between left and right platforms',
        `Climb to ${170 - (difficultyLevel * 5)}px elevation`,
        `Collect ${2 + Math.floor(difficultyLevel / 2)} shards on your way up`,
        roomInLevel % 2 === 0 ? 'Start on left platform path' : 'Start on right platform path'
      ],
      color: `bg-gradient-to-br from-green-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-emerald-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '⬆️'
    },
    'maze': {
      title: `Perception Maze ${roomNumber}`,
      description: `Navigate through ${8} platforms in a complex maze. Use perception to identify the safe path through hidden obstacles.`,
      tips: [
        'Study the platform layout before moving',
        '4 special tiles hidden throughout the maze',
        'Safe platforms appear solid when ignored',
        `Final exit at elevation ${80 + (difficultyLevel * 10)}px`
      ],
      color: `bg-gradient-to-br from-yellow-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-amber-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '🌀'
    },
    'timing': {
      title: `Temporal Chamber ${roomNumber}`,
      description: `Master timing-based challenges with ${3 + Math.floor(difficultyLevel / 1.5)} moving obstacles. Coordinate your attention with precise movement.`,
      tips: [
        'Watch for timing patterns in obstacle movement',
        'Coordinate cursor attention with WASD movement',
        `${3 + Math.floor(difficultyLevel / 1.5)} timed obstacles to navigate`,
        roomInLevel < 5 ? 'Slower timing patterns' : 'Rapid timing sequences'
      ],
      color: `bg-gradient-to-br from-indigo-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-blue-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '⏱️'
    },
    'reverse': {
      title: `Reverse Logic ${roomNumber}`,
      description: `EVERYTHING IS BACKWARDS! ${2 + Math.floor(difficultyLevel / 2)} obstacles with complete reverse logic. What seems safe is deadly!`,
      tips: [
        '🚨 ALL LOGIC IS REVERSED 🚨',
        'Red spikes become DEADLY when you look at them',
        'Safe platforms become DANGEROUS when observed',
        'Trust the OPPOSITE of your instincts completely'
      ],
      color: `bg-gradient-to-br from-rose-${Math.min(600, 500 + difficultyLevel * 20)}/30 to-red-${Math.min(600, 500 + difficultyLevel * 20)}/30`,
      icon: '🔄'
    },
    'multi-bridge': {
      title: `Bridge Network ${roomNumber}`,
      description: `Navigate ${2 + Math.floor(difficultyLevel / 2)} interconnected bridge systems. Master rapid attention switching between multiple paths.`,
      tips: [
        `Switch attention between ${2 + Math.floor(difficultyLevel / 2)} different bridge networks`,
        'Plan your route through the bridge network',
        difficultyLevel > 2 ? 'Beware of gaps and spike traps' : 'Focus on bridge solidity',
        'Some bridges may use reverse logic at higher difficulties'
      ],
      color: `bg-gradient-to-br from-teal-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-cyan-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '🌐'
    },
    'platform-dance': {
      title: `Platform Dance ${roomNumber}`,
      description: `Perform a choreographed sequence across ${6} platforms. Master the rhythm of attention and movement in perfect harmony.`,
      tips: [
        'Follow the rhythm of safe platform sequences',
        'Each platform requires different attention timing',
        `Climb ${6} levels with precise coordination`,
        roomInLevel % 2 === 0 ? 'Start with left-right-left pattern' : 'Begin with right-left-right sequence'
      ],
      color: `bg-gradient-to-br from-violet-${Math.min(600, 400 + difficultyLevel * 20)}/20 to-purple-${Math.min(600, 400 + difficultyLevel * 20)}/20`,
      icon: '💃'
    },
    'gauntlet': {
      title: `Final Gauntlet ${roomNumber}`,
      description: `THE ULTIMATE TEST! ${2 + Math.floor(difficultyLevel / 2)} obstacles PLUS their duplicates with reverse logic. Only true masters will succeed!`,
      tips: [
        `🏆 MASTER CHALLENGE: ${(2 + Math.floor(difficultyLevel / 2)) * 2} total obstacles`,
        'First half: Standard logic patterns',
        'Second half: REVERSE logic duplicates',
        'Extra reward shard at coordinates (400, 200)',
        `Difficulty ${difficultyLevel + 1}: ${difficultyLevel < 5 ? 'Advanced' : difficultyLevel < 10 ? 'Expert' : 'LEGENDARY'} level challenge`
      ],
      color: `bg-gradient-to-br from-orange-${Math.min(600, 500 + difficultyLevel * 15)}/25 to-red-${Math.min(600, 500 + difficultyLevel * 15)}/25`,
      icon: '👑'
    }
  };

  return baseRoomData[roomType] || baseRoomData['mixed'];
};

export const StageIntroModal = ({ isOpen, onClose, roomNumber, roomType, difficultyLevel }: StageIntroModalProps) => {
  const [countdown, setCountdown] = useState(3);

  const roomInfo = getRoomTypeInfo(roomType, roomNumber, difficultyLevel);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isOpen && countdown === 0) {
      onClose();
    }
  }, [countdown, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-8 bg-gradient-to-b from-background to-background/95 border-2 border-primary/20">
        <div className={`absolute inset-0 ${roomInfo.color} rounded-lg`} />
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Badge variant="outline" className="text-lg px-4 py-1 font-bold">
                Stage {roomNumber}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Difficulty {difficultyLevel + 1}
              </Badge>
              <div className="text-4xl">{roomInfo.icon}</div>
            </div>
            <h2 className="text-4xl font-bold text-foreground">{roomInfo.title}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{roomInfo.description}</p>
          </div>

          {/* Countdown and Instructions */}
          <div className="text-center space-y-6">
            <div className="text-8xl font-bold text-primary animate-pulse">
              {countdown}
            </div>
            
            {/* Room-Specific Strategy Tips */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <span>{roomInfo.icon}</span>
                Stage {roomNumber} Strategy:
              </h3>
              <div className="grid gap-3 text-left">
                {roomInfo.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
              
              {/* Quick Controls Reminder */}
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <h4 className="text-sm font-semibold text-accent mb-2">Quick Controls:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><strong>WASD/Arrows:</strong> Move</div>
                  <div><strong>Mouse:</strong> Attention</div>
                  <div><strong>Goal:</strong> Reach exit</div>
                  <div><strong>ESC:</strong> Pause</div>
                </div>
              </div>
            </div>

            <p className="text-lg text-muted-foreground">
              Starting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
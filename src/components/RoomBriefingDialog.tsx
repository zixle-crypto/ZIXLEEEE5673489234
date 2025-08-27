import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, ShieldCheck, AlertTriangle, MapPin, Clock } from 'lucide-react';

interface RoomBriefingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  roomNumber: number;
  roomType: string;
  difficulty: number;
}

const getRoomTypeInfo = (roomType: string, difficulty: number) => {
  const baseInfo = {
    spikes: {
      name: "Spike Gauntlet",
      description: "Navigate through dangerous spike traps",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "destructive",
      challenges: ["Sharp spike obstacles", "Precise timing required", "Attention-based mechanics"]
    },
    bridge: {
      name: "Bridge Challenge", 
      description: "Cross unstable bridges with attention mechanics",
      icon: <MapPin className="w-5 h-5" />,
      color: "default",
      challenges: ["Unstable bridge segments", "Gap jumping", "Look-to-activate platforms"]
    },
    mixed: {
      name: "Mixed Arena",
      description: "Face a variety of obstacles and challenges",
      icon: <Target className="w-5 h-5" />,
      color: "secondary",
      challenges: ["Multiple obstacle types", "Varied mechanics", "Strategic thinking"]
    },
    vertical: {
      name: "Vertical Ascent",
      description: "Climb your way to the top",
      icon: <Zap className="w-5 h-5" />,
      color: "default",
      challenges: ["Vertical platforming", "Precise jumping", "Height-based obstacles"]
    },
    maze: {
      name: "Maze Navigation",
      description: "Find your way through complex pathways",
      icon: <MapPin className="w-5 h-5" />,
      color: "secondary",
      challenges: ["Complex pathways", "Navigation puzzles", "Hidden routes"]
    },
    timing: {
      name: "Timing Trial",
      description: "Perfect your timing to succeed",
      icon: <Clock className="w-5 h-5" />,
      color: "default",
      challenges: ["Precise timing", "Moving obstacles", "Rhythm-based mechanics"]
    },
    reverse: {
      name: "Reverse Logic",
      description: "Everything works opposite to normal",
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "destructive",
      challenges: ["Reverse mechanics", "Counter-intuitive obstacles", "Inverse attention logic"]
    },
    'multi-bridge': {
      name: "Multi-Bridge Complex",
      description: "Navigate multiple interconnected bridges",
      icon: <MapPin className="w-5 h-5" />,
      color: "secondary",
      challenges: ["Multiple bridge segments", "Complex pathways", "Sequential activation"]
    },
    'platform-dance': {
      name: "Platform Dance",
      description: "Master dynamic platform sequences",
      icon: <Zap className="w-5 h-5" />,
      color: "default",
      challenges: ["Moving platforms", "Rhythm sequences", "Dynamic obstacles"]
    },
    gauntlet: {
      name: "Final Gauntlet",
      description: "Face the ultimate challenge",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "destructive",
      challenges: ["Maximum difficulty", "All mechanics combined", "Boss-level complexity"]
    }
  };

  const info = baseInfo[roomType as keyof typeof baseInfo] || baseInfo.mixed;
  
  // Add difficulty-based modifiers
  const difficultyModifiers = [];
  if (difficulty > 3) difficultyModifiers.push("Increased obstacle density");
  if (difficulty > 6) difficultyModifiers.push("Reverse logic elements");
  if (difficulty > 10) difficultyModifiers.push("Maximum challenge level");
  
  return {
    ...info,
    challenges: [...info.challenges, ...difficultyModifiers]
  };
};

export const RoomBriefingDialog: React.FC<RoomBriefingDialogProps> = ({
  isOpen,
  onClose,
  onStart,
  roomNumber,
  roomType,
  difficulty
}) => {
  const roomInfo = getRoomTypeInfo(roomType, difficulty);
  const difficultyLevel = Math.min(5, Math.floor(difficulty / 2) + 1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-perception text-xl font-bold flex items-center gap-2">
            {roomInfo.icon}
            Room {roomNumber} Briefing
          </DialogTitle>
          <DialogDescription className="text-game-text-dim">
            Prepare for what lies ahead
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Room Type */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-perception mb-2">{roomInfo.name}</h3>
            <p className="text-game-text">{roomInfo.description}</p>
          </div>
          
          {/* Difficulty */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-game-text-dim">Difficulty:</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < difficultyLevel
                      ? i < 2 ? 'bg-green-500' : i < 4 ? 'bg-yellow-500' : 'bg-red-500'
                      : 'bg-game-border'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Challenges */}
          <div>
            <h4 className="text-game-text font-semibold mb-2">Challenges You'll Face:</h4>
            <div className="space-y-1">
              {roomInfo.challenges.map((challenge, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-game-text-dim">
                  <div className="w-1 h-1 bg-perception rounded-full" />
                  {challenge}
                </div>
              ))}
            </div>
          </div>
          
          {/* Tips */}
          <div className="bg-game-bg rounded-lg p-3 border border-game-border">
            <p className="text-sm text-perception font-semibold mb-1">💡 Remember:</p>
            <p className="text-sm text-game-text-dim">
              Look at dangerous obstacles to make them safe, but be careful - some have reverse logic!
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-game-border text-game-text hover:bg-game-bg"
          >
            Back
          </Button>
          <Button
            onClick={onStart}
            className="flex-1 bg-perception hover:bg-perception/90 text-white font-bold"
          >
            START ROOM
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
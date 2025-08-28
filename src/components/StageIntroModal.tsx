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

const getRoomTypeInfo = (roomType: string) => {
  const roomTypeData: Record<string, { title: string; description: string; tips: string[]; color: string }> = {
    'spikes': {
      title: 'Spike Chamber',
      description: 'Navigate through deadly spikes using your perception. Watch carefully - some spikes become safe when you look at them, others become dangerous.',
      tips: ['Look at red spikes to potentially deactivate them', 'Some spikes use reverse logic - be careful!', 'Use short, precise movements'],
      color: 'bg-gradient-to-br from-red-500/20 to-orange-500/20'
    },
    'bridge': {
      title: 'Phantom Bridge',
      description: 'Cross invisible bridges that only appear solid when observed. Your attention determines the path forward.',
      tips: ['Look at bridge segments to make them solid', 'Jump carefully between bridge sections', 'Some bridges may use reverse logic at higher levels'],
      color: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
    },
    'mixed': {
      title: 'Mixed Reality',
      description: 'A combination of spikes and platforms with complex attention mechanics. Adapt your strategy as you progress.',
      tips: ['Analyze each obstacle carefully', 'Mix of safe platforms and dangerous spikes', 'Expect reverse logic on some elements'],
      color: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
    },
    'vertical': {
      title: 'Ascending Tower',
      description: 'Climb vertical platforms while managing attention-based obstacles. Precision jumping is key.',
      tips: ['Plan your jumps carefully', 'Use attention to clear vertical obstacles', 'Take your time - rushing leads to falls'],
      color: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
    },
    'maze': {
      title: 'Perception Maze',
      description: 'Navigate through a complex maze where your perception reveals the safe path forward.',
      tips: ['Study the layout before moving', 'Use attention to identify safe paths', 'Dead ends may hide secrets'],
      color: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20'
    },
    'timing': {
      title: 'Temporal Chamber',
      description: 'Timing-based challenges where perception and reflexes must work in harmony.',
      tips: ['Watch for timing cues', 'Coordinate attention with movement', 'Patience is crucial'],
      color: 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20'
    },
    'reverse': {
      title: 'Reverse Logic',
      description: 'Everything works backwards here. What seems safe is dangerous, and what seems dangerous might be safe.',
      tips: ['ALL logic is reversed', 'Dangerous when you look = Safe when you look', 'Trust the opposite of your instincts'],
      color: 'bg-gradient-to-br from-rose-500/20 to-red-500/20'
    },
    'multi-bridge': {
      title: 'Bridge Network',
      description: 'Multiple interconnected bridges create a complex network. Master attention switching between paths.',
      tips: ['Switch attention between multiple bridges', 'Plan your route in advance', 'Some bridges may have gaps'],
      color: 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20'
    },
    'platform-dance': {
      title: 'Platform Dance',
      description: 'A choreographed sequence of platform jumps requiring precise attention and movement timing.',
      tips: ['Follow the rhythm of safe platforms', 'Coordinate jumps with attention', 'Smooth movements work best'],
      color: 'bg-gradient-to-br from-violet-500/20 to-purple-500/20'
    },
    'gauntlet': {
      title: 'Final Gauntlet',
      description: 'The ultimate test combining all previous mechanics. Only true masters of perception will succeed.',
      tips: ['Combines all previous mechanics', 'Extra challenges and rewards', 'Reverse logic mixed with normal logic'],
      color: 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
    }
  };

  return roomTypeData[roomType] || roomTypeData['mixed'];
};

export const StageIntroModal = ({ isOpen, onClose, roomNumber, roomType, difficultyLevel }: StageIntroModalProps) => {
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);

  const roomInfo = getRoomTypeInfo(roomType);

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCountdown && countdown === 0) {
      onClose();
    }
  }, [countdown, showCountdown, onClose]);

  const handleStart = () => {
    setShowCountdown(true);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-8 bg-gradient-to-b from-background to-background/95 border-2 border-primary/20">
        <div className={`absolute inset-0 ${roomInfo.color} rounded-lg`} />
        <div className="relative z-10 space-y-6">
          {!showCountdown ? (
            <>
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    Stage {roomNumber}
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    Difficulty {difficultyLevel + 1}
                  </Badge>
                </div>
                <h2 className="text-4xl font-bold text-foreground">{roomInfo.title}</h2>
              </div>

              {/* Description */}
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {roomInfo.description}
                </p>
              </div>

              {/* Tips */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Strategy Tips:</h3>
                <div className="grid gap-2">
                  {roomInfo.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 bg-card/30 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleStart} 
                  className="flex-1 h-12 text-lg font-semibold"
                  size="lg"
                >
                  Start Stage
                </Button>
                <Button 
                  onClick={handleSkip} 
                  variant="outline" 
                  className="px-8 h-12"
                  size="lg"
                >
                  Skip
                </Button>
              </div>
            </>
          ) : (
            /* Countdown */
            <div className="text-center space-y-6 py-12">
              <h2 className="text-3xl font-bold text-foreground">Get Ready!</h2>
              <div className="text-8xl font-bold text-primary animate-pulse">
                {countdown}
              </div>
              <p className="text-lg text-muted-foreground">
                Starting {roomInfo.title} in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
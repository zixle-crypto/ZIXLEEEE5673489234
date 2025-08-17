import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceSelectionModalProps {
  isOpen: boolean;
  onDeviceSelect: (deviceType: 'desktop' | 'mobile' | 'tablet') => void;
}

export const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  isOpen,
  onDeviceSelect
}) => {
  const deviceOptions = [
    {
      type: 'desktop' as const,
      icon: Monitor,
      title: 'Desktop/Laptop',
      description: 'Keyboard & mouse controls',
      controls: 'WASD/Arrow keys + Mouse cursor'
    },
    {
      type: 'mobile' as const,
      icon: Smartphone,
      title: 'Mobile Phone',
      description: 'Touch controls & virtual joystick',
      controls: 'Touch screen + Virtual joystick'
    },
    {
      type: 'tablet' as const,
      icon: Tablet,
      title: 'Tablet',
      description: 'Touch controls optimized for tablets',
      controls: 'Touch screen + Virtual joystick'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl bg-game-surface border-game-border">
        <DialogHeader>
          <DialogTitle className="text-center text-game-text text-2xl font-bold">
            Select Your Device
          </DialogTitle>
          <p className="text-center text-game-text-dim mt-2">
            Choose your device type to optimize the game controls for the best experience
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {deviceOptions.map(({ type, icon: Icon, title, description, controls }) => (
            <Button
              key={type}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-4 border-game-border hover:border-perception-teal hover:bg-game-surface transition-all duration-300 group"
              onClick={() => onDeviceSelect(type)}
            >
              <Icon className="w-12 h-12 text-perception-teal group-hover:scale-110 transition-transform duration-300" />
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-game-text text-lg">{title}</h3>
                <p className="text-game-text-dim text-sm">{description}</p>
                <div className="text-xs text-perception-teal bg-game-bg rounded-lg px-3 py-2 mt-3">
                  {controls}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="text-center text-game-text-dim text-sm p-4 border-t border-game-border">
          Don't worry - you can change this anytime in the game settings!
        </div>
      </DialogContent>
    </Dialog>
  );
};
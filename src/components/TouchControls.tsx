import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TouchControlsProps {
  onMovementChange: (direction: { left: boolean; right: boolean; up: boolean }) => void;
  onCursorMove: (x: number, y: number) => void;
  isVisible: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMovementChange,
  onCursorMove,
  isVisible
}) => {
  const isMobile = useIsMobile();
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [movement, setMovement] = useState({ left: false, right: false, up: false });
  const touchIdRef = useRef<number | null>(null);

  const resetJoystick = useCallback(() => {
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
    setIsPressed(false);
    setMovement({ left: false, right: false, up: false });
    onMovementChange({ left: false, right: false, up: false });
    touchIdRef.current = null;
  }, [onMovementChange]);

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current || !knobRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const maxDistance = rect.width / 2 - 20; // Account for knob size
    const limitedDistance = Math.min(distance, maxDistance);

    let finalX = deltaX;
    let finalY = deltaY;

    if (distance > maxDistance) {
      finalX = (deltaX / distance) * maxDistance;
      finalY = (deltaY / distance) * maxDistance;
    }

    knobRef.current.style.transform = `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`;

    // Determine movement direction
    const threshold = maxDistance * 0.3;
    const newMovement = {
      left: finalX < -threshold,
      right: finalX > threshold,
      up: finalY < -threshold
    };

    if (JSON.stringify(newMovement) !== JSON.stringify(movement)) {
      setMovement(newMovement);
      onMovementChange(newMovement);
    }
  }, [movement, onMovementChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return; // Already handling a touch
    
    const touch = e.touches[0];
    touchIdRef.current = touch.identifier;
    setIsPressed(true);
    handleJoystickMove(touch.clientX, touch.clientY);
  }, [handleJoystickMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
    if (!touch) return;
    
    handleJoystickMove(touch.clientX, touch.clientY);
  }, [handleJoystickMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
    if (!touch) return;
    
    resetJoystick();
  }, [resetJoystick]);

  // Handle cursor movement for mobile (touch anywhere on screen)
  const handleScreenTouch = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return; // Joystick is being used
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    onCursorMove(x, y);
  }, [onCursorMove]);

  if (!isMobile || !isVisible) return null;

  return (
    <>
      {/* Touch area for cursor movement */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onTouchStart={handleScreenTouch}
        onTouchMove={(e) => {
          if (touchIdRef.current === null) {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            onCursorMove(x, y);
          }
        }}
      />
      
      {/* Virtual Joystick */}
      <div className="absolute bottom-8 left-8 z-50">
        <div
          ref={joystickRef}
          className={`relative w-24 h-24 rounded-full border-4 border-hud-border bg-hud-bg/80 transition-all duration-200 ${
            isPressed ? 'scale-110 shadow-glow-attention' : 'shadow-shadow-game'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div
            ref={knobRef}
            className={`absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-gradient-perception transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
              isPressed ? 'scale-110' : ''
            }`}
            style={{ touchAction: 'none' }}
          />
          
          {/* Direction indicators */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-game-text-dim text-xs">↑</div>
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-game-text-dim text-xs">←</div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-game-text-dim text-xs">→</div>
          </div>
        </div>
        
        <div className="text-center mt-2 text-game-text-dim text-xs">Move</div>
      </div>

      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 right-4 text-center text-game-text-dim text-sm bg-hud-bg/60 backdrop-blur-sm rounded-lg p-2 border border-hud-border">
        <div>Touch screen to move cursor • Use joystick to move player</div>
      </div>
    </>
  );
};
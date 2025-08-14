/**
 * Super simple test canvas to verify basic rendering works
 */

import React, { useRef, useEffect } from 'react';

export const TestCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas context not found');
      return;
    }

    console.log('✅ Canvas and context found, drawing...');

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Simple test rendering
    const draw = () => {
      // Clear with blue background
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, 800, 600);

      // Draw test rectangle - bright red
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(100, 100, 200, 100);

      // Draw test circle - bright green
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(400, 300, 50, 0, Math.PI * 2);
      ctx.fill();

      // Draw test text - white
      ctx.fillStyle = '#ffffff';
      ctx.font = '30px Arial';
      ctx.fillText('CANVAS TEST', 250, 250);

      // Draw moving circle
      const time = Date.now() * 0.001;
      const x = 600 + Math.sin(time) * 50;
      const y = 150 + Math.cos(time) * 30;
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      console.log('🎨 Frame drawn');
    };

    // Draw immediately
    draw();

    // Animate
    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };
    
    console.log('🔄 Starting animation');
    animate();

  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="border-2 border-red-500 bg-blue-900"
        style={{
          width: '800px',
          height: '600px',
          display: 'block'
        }}
      />
    </div>
  );
};
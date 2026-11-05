import React, { useEffect, useRef } from 'react';
import type { ColorMood } from '../utils/experienceEngine';
import { useReducedMotionSetting } from './ReducedMotionContext';

interface AtmosphereBackgroundProps {
  mood: ColorMood;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotionSetting();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (reducedMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle ambient dust motes
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle dynamic cursor spotlight
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 10, mouseX, mouseY, 450);
      gradient.addColorStop(0, 'rgba(223, 190, 138, 0.04)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render drifting ambient dust
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 232, 211, ${p.opacity * 0.4})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Deep Dark Gradient Base */}
      <div className={`absolute inset-0 bg-gradient-to-br ${mood.bgGradient} transition-colors duration-1000`} />

      {/* Aurora Ambient Mesh Orbs */}
      <div className="absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-[#C89D66]/10 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[40%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-[#DFBE8A]/08 to-transparent blur-[160px] animate-pulse" style={{ animationDuration: '11s' }} />
      <div className="absolute -bottom-[20%] left-[25%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-t from-[#8B642C]/10 to-transparent blur-[150px] animate-pulse" style={{ animationDuration: '14s' }} />

      {/* Interactive Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Film Grain Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

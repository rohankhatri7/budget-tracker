'use client'

import React, { useRef, useEffect, useState } from 'react'

export default function ParticleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    //mouse position tracking
    let mouseX = 0;
    let mouseY = 0;
    let mouseRadius = 150;
    
    const updateCanvasSize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = 180;
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    updateCanvasSize();
    
    //create particles from text
    let particles: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      density: number;
    }> = [];
    
    //create the text
    function createTextParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = isMobile ? 'bold 24px Inter, sans-serif' : 'bold 36px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Piggy$Pal', canvas.width / 2, canvas.height / 2);
      
      const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      //reset particles
      particles = [];
      
      const particleGap = isMobile ? 4 : 3;
      for (let y = 0; y < canvas.height; y += particleGap) {
        for (let x = 0; x < canvas.width; x += particleGap) {
          const alpha = textCoordinates.data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 128) {
            particles.push({
              x: x,
              y: y,
              baseX: x,
              baseY: y,
              size: 1,
              color: Math.random() > 0.5 ? '#00DCFF' : '#22c55e',
              density: Math.random() * 10 + 10
            });
          }
        }
      }
      
      //clear canvas for animation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    createTextParticles();
    
    //animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      //update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const dx = mouseX - particles[i].x;
        const dy = mouseY - particles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouseRadius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouseRadius - distance) / mouseRadius;
          const moveX = Math.cos(angle) * force * particles[i].density;
          const moveY = Math.sin(angle) * force * particles[i].density;
          
          particles[i].x -= moveX;
          particles[i].y -= moveY;
          ctx.fillStyle = particles[i].color;
        } else {
          //return to original position
          particles[i].x += (particles[i].baseX - particles[i].x) * 0.05;
          particles[i].y += (particles[i].baseY - particles[i].y) * 0.05;
          ctx.fillStyle = 'white';
        }
        
        //draw the particle
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y, particles[i].size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
    
    const handleResize = () => {
      updateCanvasSize();
      createTextParticles();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      }
    };
    
    const handleMouseLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (canvas && e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
      }
    };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile]);
  
  return (
    <div ref={containerRef} className="relative w-full h-[180px] bg-black">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full touch-none"
        aria-label="Interactive particle animation showing Piggy$Pal text"
      />
    </div>
  );
} 
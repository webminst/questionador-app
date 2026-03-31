/**
 * Confetti Animation
 * Lightweight confetti effect using Canvas API
 * No external dependencies - fully self-contained
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

const colors = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#45B7D1", // blue
  "#FFA07A", // light salmon
  "#98D8C8", // mint
  "#F7DC6F", // yellow
  "#BB8FCE", // purple
  "#85C1E2", // light blue
];

function createParticle(x: number, y: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const velocity = 5 + Math.random() * 8;

  return {
    x,
    y,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity - 2, // bias upward
    life: 0,
    maxLife: 2000 + Math.random() * 1000, // 2-3 seconds
    size: 5 + Math.random() * 8,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

export function triggerConfetti(options?: { duration?: number; count?: number }): void {
  const { duration = 3000, count = 50 } = options || {};

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";

  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const particles: Particle[] = [];
  const startTime = Date.now();

  // Emit particles from center
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < count; i++) {
    particles.push(createParticle(centerX, centerY));
  }

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;

    // Clear canvas
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.life += 1000 / 60; // approximate frame time
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.rotation += p.rotationSpeed;

      const alphaProgress = Math.max(0, 1 - p.life / p.maxLife);
      const alpha = alphaProgress * alphaProgress; // ease out

      // Draw particle (small square with rotation)
      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx!.restore();

      // Remove dead particles
      if (p.life > p.maxLife) {
        particles.splice(i, 1);
      }
    }

    // Continue animating if duration not reached or particles still exist
    if (progress < 1 && particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      document.body.removeChild(canvas);
    }
  }

  animate();
}

/**
 * Trigger confetti with multiple bursts
 * More impactful than single burst
 */
export function triggerConfettiBurst(): void {
  triggerConfetti({ count: 60, duration: 2500 });

  // Secondary burst after short delay
  setTimeout(() => {
    triggerConfetti({ count: 40, duration: 2000 });
  }, 200);
}

/* ========================================
   PARTICLE TEXT — Hero Section
   Particles form text, scatter on hover,
   rejoin when cursor moves away
   ======================================== */

class ParticleText {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -9999, y: -9999, radius: 15 };
    this.dpr = Math.min(window.devicePixelRatio, 2);
    this.lines = [];
    this.isReady = false;

    this.resize();
    this.setupMouse();

    const isLight = document.documentElement.classList.contains('light-theme');
    const color1 = isLight ? '#0f172a' : '#ffffff';
    const color2 = isLight ? '#334155' : '#999999';

    // Text lines config
    this.textConfig = [
      { text: "Hi, I'm", size: 52, weight: '700', font: 'Orbitron', color: color1, yOffset: -70 },
      { text: 'Ashhar', size: 72, weight: '900', font: 'Orbitron', gradient: true, yOffset: 10 },
      { text: 'Game Developer', size: 52, weight: '700', font: 'Orbitron', color: color1, yOffset: 90 },
      { text: 'I create immersive interactive experiences for Web, AR & VR', size: 18, weight: '300', font: 'Outfit', color: color2, yOffset: 155 },
    ];

    // Wait for fonts then init
    document.fonts.ready.then(() => {
      setTimeout(() => {
        this.createParticlesFromText();
        this.isReady = true;
        this.animate();
      }, 300);
    });

    window.addEventListener('resize', () => {
      this.resize();
      this.createParticlesFromText();
    });

    window.addEventListener('themeChanged', (e) => {
      const isL = e.detail.isLight;
      this.textConfig[0].color = isL ? '#0f172a' : '#ffffff';
      this.textConfig[2].color = isL ? '#0f172a' : '#ffffff';
      this.textConfig[3].color = isL ? '#334155' : '#999999';
      this.createParticlesFromText();
    });
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.width = w;
    this.height = h;
  }

  setupMouse() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mouseout', (e) => {
      if (e.relatedTarget === null) {
        this.mouse.x = -9999;
        this.mouse.y = -9999;
      }
    });

    // Touch support
    window.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.touches[0].clientX - rect.left;
      this.mouse.y = e.touches[0].clientY - rect.top;
    });

    window.addEventListener('touchend', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
  }

  createParticlesFromText() {
    this.particles = [];

    // Offscreen canvas to sample text pixels
    const offscreen = document.createElement('canvas');
    offscreen.width = this.width;
    offscreen.height = this.height;
    const offCtx = offscreen.getContext('2d');

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Adjust sizes for smaller screens
    const scaleFactor = Math.min(1, this.width / 900);

    this.textConfig.forEach((line) => {
      const fontSize = Math.round(line.size * scaleFactor);
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.fillStyle = '#ffffff';
      offCtx.font = `${line.weight} ${fontSize}px ${line.font}`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(line.text, centerX, centerY);

      // Sample pixels
      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imageData.data;

      // Particle sampling density
      const gap = line.size > 30 ? 3 : 4;

      for (let y = 0; y < offscreen.height; y += gap) {
        for (let x = 0; x < offscreen.width; x += gap) {
          const i = (y * offscreen.width + x) * 4;
          if (data[i + 3] > 128) {
            // Map y position: particle's home = offset from center of hero
            const homeX = x;
            const homeY = y - centerY + (centerY + line.yOffset * scaleFactor);

            let color;
            if (line.gradient) {
              // Gradient from light amber to deep amber across the word
              const textWidth = offCtx.measureText(line.text).width;
              const textStart = centerX - textWidth / 2;
              const t = Math.max(0, Math.min(1, (x - textStart) / textWidth));
              const r = Math.round(251 - t * 34);   // 251 -> 217 (#fbbf24 -> #d97706)
              const g = Math.round(191 - t * 72);   // 191 -> 119
              const b = Math.round(36 - t * 30);    // 36 -> 6
              color = `rgb(${r},${g},${b})`;
            } else {
              color = line.color;
            }

            const size = line.size > 30 ? (Math.random() * 1.8 + 0.8) : (Math.random() * 1.2 + 0.5);

            this.particles.push(new Particle(homeX, homeY, color, size));
          }
        }
      }
    });
  }

  animate() {
    if (!this.isReady) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(this.mouse);
      this.particles[i].draw(this.ctx);
    }

    requestAnimationFrame(() => this.animate());
  }
}

class Particle {
  constructor(homeX, homeY, color, size) {
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX + (Math.random() - 0.5) * 600;
    this.y = homeY + (Math.random() - 0.5) * 600;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.size = size;
    this.friction = 0.92;
    this.springForce = 0.04 + Math.random() * 0.02;
    this.opacity = 1;
  }

  update(mouse) {
    // Distance from mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Repel from mouse
    if (dist < mouse.radius) {
      const force = (mouse.radius - dist) / mouse.radius;
      const angle = Math.atan2(dy, dx);
      const pushForce = force * 8;
      this.vx -= Math.cos(angle) * pushForce;
      this.vy -= Math.sin(angle) * pushForce;
      this.opacity = 0.4 + (dist / mouse.radius) * 0.6;
    } else {
      this.opacity += (1 - this.opacity) * 0.05;
    }

    // Spring back to home position
    const homeDistX = this.homeX - this.x;
    const homeDistY = this.homeY - this.y;
    this.vx += homeDistX * this.springForce;
    this.vy += homeDistY * this.springForce;

    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  new ParticleText('particle-canvas');
});

// Weather system with rain, snow, and storm effects

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  drift: number;
}

interface Lightning {
  time: number;
  intensity: number;
  x: number;
  branches: { x1: number; y1: number; x2: number; y2: number }[];
}

const MAX_PARTICLES = 300;

export class WeatherSystem {
  private type: WeatherType = 'clear';
  private intensity: number = 0; // 0-1
  private targetIntensity: number = 0;
  private particles: Particle[] = [];
  private lightning: Lightning | null = null;
  private lastLightningTime: number = 0;
  private transitionSpeed: number = 0.002;
  private windSpeed: number = 0;
  private targetWindSpeed: number = 0;
  private autoChangeTimer: number = 0;
  private autoChangeInterval: number = 45000; // change weather every ~45s

  constructor() {
    this.particles = [];
    this.scheduleNextChange();
  }

  private scheduleNextChange() {
    this.autoChangeInterval = 30000 + Math.random() * 60000;
    this.autoChangeTimer = Date.now() + this.autoChangeInterval;
  }

  setWeather(type: WeatherType, intensity: number = 0.7) {
    this.type = type;
    this.targetIntensity = Math.max(0, Math.min(1, intensity));
    if (type === 'storm') {
      this.targetWindSpeed = 2 + Math.random() * 3;
    } else if (type === 'rain') {
      this.targetWindSpeed = 0.5 + Math.random() * 1.5;
    } else if (type === 'snow') {
      this.targetWindSpeed = 0.3 + Math.random() * 0.8;
    } else {
      this.targetWindSpeed = 0;
    }
  }

  getType(): WeatherType { return this.type; }
  getIntensity(): number { return this.intensity; }

  update(now: number) {
    // Auto weather change
    if (now > this.autoChangeTimer) {
      const types: WeatherType[] = ['clear', 'clear', 'rain', 'rain', 'snow', 'storm'];
      const next = types[Math.floor(Math.random() * types.length)];
      const int = next === 'clear' ? 0 : 0.3 + Math.random() * 0.7;
      this.setWeather(next, int);
      this.scheduleNextChange();
    }

    // Smooth transitions
    this.intensity += (this.targetIntensity - this.intensity) * this.transitionSpeed;
    this.windSpeed += (this.targetWindSpeed - this.windSpeed) * 0.01;

    if (this.intensity < 0.01 && this.type === 'clear') {
      this.particles.length = 0;
      return;
    }

    // Manage particle count
    const targetCount = Math.floor(MAX_PARTICLES * this.intensity);
    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle(true));
    }
    if (this.particles.length > targetCount) {
      this.particles.length = targetCount;
    }

    // Storm lightning
    if (this.type === 'storm' && this.intensity > 0.4) {
      if (now - this.lastLightningTime > 3000 + Math.random() * 8000) {
        if (Math.random() < 0.3) {
          this.createLightning(now);
          this.lastLightningTime = now;
        }
      }
    }
    if (this.lightning && now - this.lightning.time > 300) {
      this.lightning = null;
    }
  }

  private createParticle(randomY: boolean): Particle {
    if (this.type === 'snow') {
      return {
        x: Math.random() * 1.2 - 0.1,
        y: randomY ? Math.random() : -0.02,
        speed: 0.0005 + Math.random() * 0.001,
        size: 1 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.002,
      };
    }
    // Rain / storm
    return {
      x: Math.random() * 1.3 - 0.15,
      y: randomY ? Math.random() : -0.05,
      speed: 0.008 + Math.random() * 0.012 * (this.type === 'storm' ? 1.5 : 1),
      size: 1 + Math.random() * 1.5,
      opacity: 0.2 + Math.random() * 0.4,
      drift: 0,
    };
  }

  private createLightning(now: number) {
    const x = 0.2 + Math.random() * 0.6;
    const branches: Lightning['branches'] = [];
    let cx = x, cy = 0;
    for (let i = 0; i < 4 + Math.floor(Math.random() * 4); i++) {
      const nx = cx + (Math.random() - 0.5) * 0.08;
      const ny = cy + 0.08 + Math.random() * 0.12;
      branches.push({ x1: cx, y1: cy, x2: nx, y2: ny });
      cx = nx;
      cy = ny;
      if (cy > 0.7) break;
      // Side branch
      if (Math.random() < 0.4) {
        const bx = cx + (Math.random() - 0.5) * 0.06;
        const by = cy + 0.03 + Math.random() * 0.06;
        branches.push({ x1: cx, y1: cy, x2: bx, y2: by });
      }
    }
    this.lightning = { time: now, intensity: 0.6 + Math.random() * 0.4, x, branches };
  }

  render(ctx: CanvasRenderingContext2D, W: number, H: number) {
    if (this.intensity < 0.01 && !this.lightning) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Lightning flash
    if (this.lightning) {
      const elapsed = Date.now() - this.lightning.time;
      const flash = Math.max(0, 1 - elapsed / 300) * this.lightning.intensity;
      ctx.fillStyle = `rgba(220, 230, 255, ${flash * 0.25})`;
      ctx.fillRect(0, 0, W, H);

      // Lightning bolts
      ctx.strokeStyle = `rgba(220, 240, 255, ${flash * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(180, 200, 255, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (const b of this.lightning.branches) {
        ctx.moveTo(b.x1 * W, b.y1 * H);
        ctx.lineTo(b.x2 * W, b.y2 * H);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Ambient fog/mist overlay for rain/storm
    if ((this.type === 'rain' || this.type === 'storm') && this.intensity > 0.2) {
      ctx.fillStyle = `rgba(100, 110, 130, ${this.intensity * 0.08})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.type === 'snow' && this.intensity > 0.2) {
      ctx.fillStyle = `rgba(200, 210, 230, ${this.intensity * 0.06})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speed;
      p.x += p.drift + this.windSpeed * 0.001;

      if (p.y > 1.05 || p.x > 1.2 || p.x < -0.1) {
        this.particles[i] = this.createParticle(false);
        continue;
      }

      const px = p.x * W;
      const py = p.y * H;

      if (this.type === 'snow') {
        // Snow wobble
        const wobble = Math.sin(Date.now() * 0.002 + i * 1.7) * 0.5;
        ctx.fillStyle = `rgba(240, 245, 255, ${p.opacity * this.intensity})`;
        ctx.beginPath();
        ctx.arc(px + wobble, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rain streaks
        const len = p.size * (this.type === 'storm' ? 8 : 5);
        ctx.strokeStyle = `rgba(180, 200, 230, ${p.opacity * this.intensity})`;
        ctx.lineWidth = p.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + this.windSpeed * 2, py + len);
        ctx.stroke();
      }
    }

    // Rain puddle ripples on ground
    if ((this.type === 'rain' || this.type === 'storm') && this.intensity > 0.3) {
      const rippleCount = Math.floor(this.intensity * 8);
      const time = Date.now() * 0.003;
      for (let i = 0; i < rippleCount; i++) {
        const rx = (Math.sin(i * 47.3 + time * 0.5) * 0.5 + 0.5) * W;
        const ry = H * 0.7 + (Math.sin(i * 31.7 + time * 0.3) * 0.5 + 0.5) * H * 0.25;
        const ripplePhase = (time + i * 2.1) % 3;
        const rippleAlpha = Math.max(0, 1 - ripplePhase / 3) * this.intensity * 0.3;
        const rippleR = ripplePhase * 4;
        ctx.strokeStyle = `rgba(180, 200, 230, ${rippleAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(rx, ry, rippleR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Modify parallax darkness based on weather
  getParallaxDarkening(): number {
    if (this.type === 'storm') return this.intensity * 0.3;
    if (this.type === 'rain') return this.intensity * 0.15;
    return 0;
  }
}

// Singleton
let weatherInstance: WeatherSystem | null = null;
export function getWeatherSystem(): WeatherSystem {
  if (!weatherInstance) weatherInstance = new WeatherSystem();
  return weatherInstance;
}

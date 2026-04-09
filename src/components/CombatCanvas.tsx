import { useRef, useEffect, useCallback } from 'react';
import { getImage, CHARACTER_SPRITE_PATHS, MONSTER_SPRITE_PATHS, getMonsterSpriteKey, getMonsterSpriteByRarity } from '@/engine/SpriteLoader';
import { CLASS_COLORS, RARITY_SPRITE_COLORS } from '@/engine/constants';

interface CombatCanvasProps {
  characterClass: string;
  creatureName: string;
  creatureRarity: string;
  playerHealth: number;
  playerMaxHealth: number;
  creatureHealth: number;
  creatureMaxHealth: number;
  isPlayerTurn: boolean;
  playerShake: boolean;
  creatureShake: boolean;
  playerFlash: boolean;
  creatureFlash: boolean;
  playerDead: boolean;
  creatureDead: boolean;
  isDefending: boolean;
  playerAttacking?: boolean; // NEW: triggers lunge animation
}

// Battle background biome palettes
const BATTLE_BG = {
  ground: '#2a3a20',
  sky: '#0e1520',
  accent: '#3a5530',
};

export function CombatCanvas({
  characterClass,
  creatureName,
  creatureRarity,
  playerHealth,
  playerMaxHealth,
  creatureHealth,
  creatureMaxHealth,
  isPlayerTurn,
  playerShake,
  creatureShake,
  playerFlash,
  creatureFlash,
  playerDead,
  creatureDead,
  isDefending,
  playerAttacking = false,
}: CombatCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const shakeStartRef = useRef({ player: 0, creature: 0 });
  const prevPlayerShake = useRef(false);
  const prevCreatureShake = useRef(false);
  const lungeStartRef = useRef(0);
  const prevPlayerAttacking = useRef(false);

  // Track shake start times
  useEffect(() => {
    if (playerShake && !prevPlayerShake.current) shakeStartRef.current.player = Date.now();
    prevPlayerShake.current = playerShake;
  }, [playerShake]);

  useEffect(() => {
    if (creatureShake && !prevCreatureShake.current) shakeStartRef.current.creature = Date.now();
    prevCreatureShake.current = creatureShake;
  }, [creatureShake]);

  // Track lunge start
  useEffect(() => {
    if (playerAttacking && !prevPlayerAttacking.current) lungeStartRef.current = Date.now();
    prevPlayerAttacking.current = playerAttacking;
  }, [playerAttacking]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const now = Date.now();
    animFrameRef.current++;
    const af = animFrameRef.current;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    // === BATTLE BACKGROUND ===
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    skyGrad.addColorStop(0, '#0a0e18');
    skyGrad.addColorStop(0.5, '#141e30');
    skyGrad.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.55);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 20; i++) {
      const sx = (Math.sin(i * 73.17) * 0.5 + 0.5) * W;
      const sy = (Math.sin(i * 41.31 + 7) * 0.5 + 0.5) * H * 0.4;
      const twinkle = Math.sin(af * 0.03 + i * 2.7) * 0.3 + 0.7;
      ctx.globalAlpha = twinkle * 0.5;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // Ground
    const groundY = H * 0.55;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#2a3a20');
    groundGrad.addColorStop(0.3, '#1e2e16');
    groundGrad.addColorStop(1, '#121a0e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Ground texture dots
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 40; i++) {
      const gx = (Math.sin(i * 31.4) * 0.5 + 0.5) * W;
      const gy = groundY + 10 + (Math.sin(i * 57.3) * 0.5 + 0.5) * (H - groundY - 20);
      ctx.fillRect(gx, gy, 2, 1);
    }

    // Ground line
    ctx.strokeStyle = 'rgba(100,140,80,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // === DRAW COMBATANTS ===
    const spriteScale = Math.min(W / 400, H / 200) * 3;
    const spriteSize = Math.floor(16 * spriteScale);

    // Player position (left side) with lunge offset
    const lungeDuration = 500;
    let lungeOffsetX = 0;
    if (playerAttacking || (now - lungeStartRef.current < lungeDuration)) {
      const elapsed = now - lungeStartRef.current;
      const t = Math.min(1, elapsed / lungeDuration);
      // Ease out-in: advance to 60% of distance, then retreat
      const lungeDistance = (creatureBaseX - (W * 0.22 - spriteSize / 2)) * 0.6;
      if (t < 0.4) {
        // Advance phase (ease out)
        const p = t / 0.4;
        lungeOffsetX = lungeDistance * (1 - Math.pow(1 - p, 3));
      } else {
        // Retreat phase (ease in)
        const p = (t - 0.4) / 0.6;
        lungeOffsetX = lungeDistance * Math.pow(1 - p, 2);
      }
    }
    const playerBaseX = W * 0.22 - spriteSize / 2 + lungeOffsetX;
    const playerBaseY = groundY - spriteSize + 4;

    // Creature position (right side)
    const creatureBaseX = W * 0.78 - spriteSize / 2;
    const creatureBaseY = groundY - spriteSize + 4;

    // Calculate shake offsets
    const getShakeOffset = (startTime: number, active: boolean) => {
      if (!active) return { x: 0, y: 0 };
      const elapsed = now - startTime;
      if (elapsed > 400) return { x: 0, y: 0 };
      const intensity = Math.max(0, 1 - elapsed / 400);
      return {
        x: Math.sin(elapsed * 0.05) * 8 * intensity,
        y: Math.cos(elapsed * 0.07) * 4 * intensity,
      };
    };

    const pShake = getShakeOffset(shakeStartRef.current.player, playerShake);
    const cShake = getShakeOffset(shakeStartRef.current.creature, creatureShake);

    // Idle float
    const playerFloat = Math.sin(af * 0.04) * 2;
    const creatureFloat = Math.sin(af * 0.05 + 1.5) * 3;

    // === DRAW SHADOWS ===
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    if (!playerDead) {
      ctx.beginPath();
      ctx.ellipse(playerBaseX + spriteSize / 2, groundY + 2, spriteSize * 0.35, spriteSize * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!creatureDead) {
      ctx.beginPath();
      ctx.ellipse(creatureBaseX + spriteSize / 2, groundY + 2, spriteSize * 0.35, spriteSize * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === DRAW PLAYER ===
    const drawPlayer = () => {
      const spritePath = CHARACTER_SPRITE_PATHS[characterClass] || CHARACTER_SPRITE_PATHS.warrior;
      const img = getImage(spritePath);

      let px = playerBaseX + pShake.x;
      let py = playerBaseY + playerFloat + pShake.y;
      let alpha = 1;

      if (playerDead) {
        // Fall animation
        const deathProgress = Math.min(1, (now - shakeStartRef.current.player) / 800);
        alpha = 1 - deathProgress;
        py += deathProgress * 20;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      if (playerFlash) {
        ctx.filter = 'brightness(3) saturate(0)';
      }

      if (isDefending) {
        // Shield glow
        ctx.fillStyle = 'rgba(100,180,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(px + spriteSize / 2, py + spriteSize / 2, spriteSize * 0.6, spriteSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,180,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (img) {
        const frameW = 16;
        const frameH = 16;
        const cols = Math.max(1, Math.floor(img.width / frameW));

        // Face right (row 2 = idle right, row 3 = walk right)
        const row = isPlayerTurn ? 2 : 2;
        const frameIdx = Math.floor(af / 8) % cols;

        ctx.drawImage(img, frameIdx * frameW, row * frameH, frameW, frameH, px, py, spriteSize, spriteSize);
      } else {
        // Fallback rectangle
        const colors = CLASS_COLORS[characterClass] || CLASS_COLORS.warrior;
        ctx.fillStyle = colors.body;
        ctx.fillRect(px + 4, py + spriteSize * 0.3, spriteSize - 8, spriteSize * 0.5);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(px + spriteSize * 0.25, py + spriteSize * 0.1, spriteSize * 0.5, spriteSize * 0.3);
      }

      ctx.filter = 'none';
      ctx.restore();

      // Turn indicator glow under player
      if (isPlayerTurn && !playerDead) {
        const glowAlpha = 0.3 + Math.sin(af * 0.08) * 0.15;
        ctx.fillStyle = `rgba(80,200,120,${glowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(px + spriteSize / 2, groundY + 2, spriteSize * 0.4, spriteSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // === DRAW CREATURE ===
    const drawCreature = () => {
      const spriteKey = getMonsterSpriteKey(creatureName) !== 'slime'
        ? getMonsterSpriteKey(creatureName)
        : getMonsterSpriteByRarity(creatureRarity);
      const spritePath = MONSTER_SPRITE_PATHS[spriteKey];
      const img = spritePath ? getImage(spritePath) : null;

      let cx = creatureBaseX + cShake.x;
      let cy = creatureBaseY + creatureFloat + cShake.y;
      let alpha = 1;

      if (creatureDead) {
        const deathProgress = Math.min(1, (now - shakeStartRef.current.creature) / 800);
        alpha = 1 - deathProgress;
        cy += deathProgress * 15;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      if (creatureFlash) {
        ctx.filter = 'brightness(3) saturate(0)';
      }

      // Rarity aura
      if (creatureRarity !== 'common' && !creatureDead) {
        const rarityColors = RARITY_SPRITE_COLORS[creatureRarity] || RARITY_SPRITE_COLORS.common;
        const auraAlpha = 0.12 + Math.sin(af * 0.06) * 0.06;
        ctx.fillStyle = rarityColors.accent;
        ctx.globalAlpha = alpha * auraAlpha;
        ctx.beginPath();
        ctx.ellipse(cx + spriteSize / 2, cy + spriteSize / 2, spriteSize * 0.65, spriteSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha;
      }

      if (img) {
        const frameW = 16;
        const frameH = 16;
        const cols = Math.max(1, Math.floor(img.width / frameW));
        const rows = Math.max(1, Math.floor(img.height / frameH));

        // Use row 0 for idle, cycle frames
        const frameIdx = Math.floor(af / 8) % cols;
        // Face left if possible (row 6 for left), otherwise flip row 0
        const leftRow = rows > 6 ? 6 : 0;
        const shouldFlip = leftRow === 0;

        if (shouldFlip) {
          ctx.save();
          ctx.translate(cx + spriteSize, cy);
          ctx.scale(-1, 1);
          ctx.drawImage(img, frameIdx * frameW, 0, frameW, frameH, 0, 0, spriteSize, spriteSize);
          ctx.restore();
        } else {
          ctx.drawImage(img, frameIdx * frameW, leftRow * frameH, frameW, frameH, cx, cy, spriteSize, spriteSize);
        }
      } else {
        const colors = RARITY_SPRITE_COLORS[creatureRarity] || RARITY_SPRITE_COLORS.common;
        ctx.fillStyle = colors.body;
        ctx.fillRect(cx + 4, cy + spriteSize * 0.2, spriteSize - 8, spriteSize * 0.6);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(cx + spriteSize * 0.3, cy + spriteSize * 0.3, 4, 4);
        ctx.fillRect(cx + spriteSize * 0.6, cy + spriteSize * 0.3, 4, 4);
      }

      ctx.filter = 'none';
      ctx.restore();

      // Turn indicator glow under creature
      if (!isPlayerTurn && !creatureDead) {
        const glowAlpha = 0.3 + Math.sin(af * 0.08) * 0.15;
        ctx.fillStyle = `rgba(220,60,60,${glowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(cx + spriteSize / 2, groundY + 2, spriteSize * 0.4, spriteSize * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawPlayer();
    drawCreature();

    // === ATTACK LINES / PARTICLES ===
    if (playerShake) {
      // Hit particles on player
      ctx.fillStyle = 'rgba(255,80,80,0.7)';
      for (let i = 0; i < 5; i++) {
        const elapsed = now - shakeStartRef.current.player;
        const t = Math.min(1, elapsed / 400);
        const px = playerBaseX + spriteSize / 2 + Math.sin(i * 2.3 + elapsed * 0.01) * spriteSize * 0.5 * t;
        const py2 = playerBaseY + spriteSize * 0.3 - t * 20 + Math.cos(i * 1.7) * 10;
        const size = (1 - t) * 4;
        ctx.fillRect(px - size / 2, py2 - size / 2, size, size);
      }
    }

    if (creatureShake) {
      // Hit particles on creature
      ctx.fillStyle = 'rgba(255,220,80,0.7)';
      for (let i = 0; i < 6; i++) {
        const elapsed = now - shakeStartRef.current.creature;
        const t = Math.min(1, elapsed / 400);
        const cx2 = creatureBaseX + spriteSize / 2 + Math.sin(i * 2.1 + elapsed * 0.012) * spriteSize * 0.5 * t;
        const cy2 = creatureBaseY + spriteSize * 0.3 - t * 25 + Math.cos(i * 1.9) * 12;
        const size = (1 - t) * 5;
        ctx.fillRect(cx2 - size / 2, cy2 - size / 2, size, size);
      }

      // Slash line
      const elapsed = now - shakeStartRef.current.creature;
      if (elapsed < 200) {
        const t = elapsed / 200;
        ctx.save();
        ctx.strokeStyle = `rgba(255,255,200,${1 - t})`;
        ctx.lineWidth = 3 - t * 2;
        ctx.beginPath();
        ctx.moveTo(creatureBaseX + spriteSize * 0.2, creatureBaseY + spriteSize * 0.2);
        ctx.lineTo(creatureBaseX + spriteSize * 0.8 * t, creatureBaseY + spriteSize * 0.7 * t);
        ctx.stroke();
        ctx.restore();
      }
    }

    // === HP BARS above sprites ===
    const barW = spriteSize * 0.8;
    const barH2 = 4;
    const barRadius = 2;

    // Player HP bar
    if (!playerDead) {
      const bx = playerBaseX + (spriteSize - barW) / 2;
      const by = playerBaseY + playerFloat - 12;
      const hpPct = playerHealth / playerMaxHealth;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH2 + 2);
      ctx.fillStyle = '#1a0808';
      ctx.fillRect(bx, by, barW, barH2);
      const hpColor = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillStyle = hpColor;
      ctx.fillRect(bx, by, barW * hpPct, barH2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(bx, by, barW * hpPct, barH2 / 2);
    }

    // Creature HP bar
    if (!creatureDead) {
      const bx = creatureBaseX + (spriteSize - barW) / 2;
      const by = creatureBaseY + creatureFloat - 12;
      const hpPct = creatureHealth / creatureMaxHealth;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH2 + 2);
      ctx.fillStyle = '#1a0808';
      ctx.fillRect(bx, by, barW, barH2);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(bx, by, barW * hpPct, barH2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(bx, by, barW * hpPct, barH2 / 2);
    }

    // === VS INDICATOR ===
    if (!playerDead && !creatureDead) {
      ctx.fillStyle = 'rgba(255,215,0,0.6)';
      ctx.font = `bold ${Math.floor(spriteSize * 0.25)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('VS', W / 2, groundY - spriteSize * 0.3);
    }
  }, [
    characterClass, creatureName, creatureRarity,
    playerHealth, playerMaxHealth, creatureHealth, creatureMaxHealth,
    isPlayerTurn, playerShake, creatureShake, playerFlash, creatureFlash,
    playerDead, creatureDead, isDefending,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const resize = () => {
      if (!parent) return;
      const w = parent.clientWidth;
      const h = Math.min(220, Math.floor(w * 0.45));
      canvas.width = w * 2;
      canvas.height = h * 2;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    let running = true;
    const loop = () => {
      if (!running) return;
      render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg border border-border/30"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

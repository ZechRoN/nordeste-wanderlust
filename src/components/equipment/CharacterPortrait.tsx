import { useEffect, useRef } from 'react';
import { CHARACTER_SPRITE_PATHS, loadImage } from '@/engine/SpriteLoader';

type Equipment = Record<string, { item: { rarity: string; subtype?: string | null; name?: string } }>;

/** Material tier by rarity: leather → iron → steel → gold → mythic */
const TIER_TOKENS: Record<string, [string, string]> = {
  common: ['--portrait-leather', '--portrait-edge'],
  uncommon: ['--portrait-metal', '--portrait-edge'],
  rare: ['--portrait-steel', '--portrait-edge'],
  epic: ['--portrait-epic', '--portrait-edge'],
  legendary: ['--rpg-frame-light', '--portrait-edge'],
};

export function CharacterPortrait({ characterClass, equipped = {}, compact = false }: {
  characterClass: string; equipped?: Equipment; compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const styles = getComputedStyle(canvas);
    const tone = (name: string) => {
      const v = styles.getPropertyValue(name).trim();
      return v ? `hsl(${v})` : 'hsl(30 20% 40%)';
    };
    const outline = tone('--portrait-outline');
    const gold = tone('--rpg-frame-light');
    const leather = tone('--portrait-leather');
    const wood = tone('--portrait-wood');
    const mat = (slot: string) => {
      const r = equipped[slot]?.item.rarity ?? 'common';
      const [base] = TIER_TOKENS[r] ?? TIER_TOKENS.common;
      return tone(base);
    };
    const draw = (image: HTMLImageElement, time: number) => {
      if (disposed) return;
      ctx.clearRect(0, 0, 128, 128);
      ctx.imageSmoothingEnabled = false;
      const idle = Math.floor(time / 340) % Math.max(1, Math.min(2, Math.floor(image.width / 16)));
      const y = compact ? 16 : 18 + Math.round(Math.sin(time / 500));
      ctx.fillStyle = tone('--portrait-shadow');
      ctx.beginPath(); ctx.ellipse(64, 103, 29, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(image, idle * 16, 0, 16, 16, 24, y, 80, 80);
      // Tibia-like: every piece has a 2px dark outline, flat fill and a top-left highlight.
      const piece = (px: number, py: number, w: number, h: number, color: string, hl = true) => {
        ctx.fillStyle = outline; ctx.fillRect(px - 2, py + y - 2, w + 4, h + 4);
        ctx.fillStyle = color; ctx.fillRect(px, py + y, w, h);
        if (hl && w > 4 && h > 4) {
          ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(px, py + y, w, 2); ctx.fillRect(px, py + y, 2, h);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px, py + y + h - 2, w, 2);
        }
      };
      const flat = (px: number, py: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color; ctx.fillRect(px, py + y, w, h);
      };

      if (equipped.legs) { piece(50, 64, 11, 12, mat('legs')); piece(67, 64, 11, 12, mat('legs')); }
      if (equipped.boots) { piece(46, 75, 15, 6, mat('boots')); piece(67, 75, 15, 6, mat('boots')); }
      if (equipped.chest) {
        piece(48, 42, 32, 21, mat('chest'));
        flat(62, 44, 4, 17, gold); flat(48, 58, 32, 3, leather);
        piece(42, 40, 9, 8, mat('chest')); piece(77, 40, 9, 8, mat('chest')); // pauldrons
      }
      if (equipped.gloves) { piece(38, 50, 8, 9, mat('gloves')); piece(82, 50, 8, 9, mat('gloves')); }
      if (equipped.helmet) {
        piece(46, 9, 36, 11, mat('helmet'));
        piece(44, 18, 6, 12, mat('helmet')); piece(78, 18, 6, 12, mat('helmet'));
        flat(50, 9, 28, 2, gold);
        if (['epic', 'legendary'].includes(equipped.helmet.item.rarity)) { piece(61, 2, 6, 7, gold); }
      }
      const main = equipped.main_hand?.item.subtype ?? '';
      if (equipped.main_hand) {
        const m = mat('main_hand');
        if (main.startsWith('cajado')) {
          piece(89, 22, 4, 54, wood, false); piece(84, 16, 14, 10, m); flat(88, 19, 6, 4, gold);
        } else if (main.startsWith('arco')) {
          piece(93, 26, 4, 40, wood, false); flat(90, 26, 3, 3, m); flat(90, 63, 3, 3, m);
          flat(91, 28, 1, 36, tone('--rpg-text'));
        } else if (/grimorio|tomo|codex/.test(main)) {
          piece(84, 50, 14, 16, m); flat(89, 53, 4, 10, gold);
        } else if (/adaga|katar/.test(main)) {
          piece(89, 42, 4, 16, m); piece(85, 56, 12, 3, gold); flat(89, 59, 4, 6, leather);
          piece(36, 44, 3, 12, m); // second dagger
        } else {
          piece(88, 22, 6, 34, m); flat(88, 22, 2, 34, 'rgba(255,255,255,0.35)');
          piece(81, 55, 20, 4, gold); flat(88, 59, 6, 12, leather);
        }
      }
      const off = equipped.off_hand?.item.subtype ?? '';
      if (equipped.off_hand) {
        const m = mat('off_hand');
        if (off.startsWith('orbe')) {
          ctx.fillStyle = outline; ctx.beginPath(); ctx.arc(36, 56 + y, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = m; ctx.beginPath(); ctx.arc(36, 56 + y, 7, 0, Math.PI * 2); ctx.fill();
          flat(33, 51, 3, 3, 'rgba(255,255,255,0.6)');
        } else if (off.startsWith('runa')) {
          piece(30, 48, 12, 14, m); flat(35, 50, 2, 10, gold); flat(32, 54, 8, 2, gold);
        } else if (off.startsWith('bolsa')) {
          piece(96, 30, 8, 26, leather); flat(97, 24, 2, 6, m); flat(101, 24, 2, 6, m);
        } else {
          piece(27, 41, 24, 27, m); flat(37, 44, 4, 21, gold); flat(30, 52, 18, 4, gold);
        }
      }
      if (!compact && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        frame = requestAnimationFrame(t => draw(image, t));
      }
    };
    loadImage(CHARACTER_SPRITE_PATHS[characterClass] ?? CHARACTER_SPRITE_PATHS.warrior)
      .then(image => draw(image, 0)).catch(() => {});
    return () => { disposed = true; cancelAnimationFrame(frame); };
  }, [characterClass, equipped, compact]);
  return <canvas ref={canvasRef} width={128} height={128} className={compact ? 'character-portrait character-portrait--compact' : 'character-portrait'} role="img" aria-label={`Personagem ${characterClass}`} />;
}

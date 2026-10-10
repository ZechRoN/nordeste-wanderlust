import { useEffect, useRef } from 'react';
import { CHARACTER_SPRITE_PATHS, loadImage } from '@/engine/SpriteLoader';

type Equipment = Record<string, { item: { rarity: string; subtype?: string | null } }>;

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
    const tone = (name: string) => `hsl(${styles.getPropertyValue(name).trim()})`;
    const metal = tone('--portrait-metal');
    const edge = tone('--portrait-edge');
    const gold = tone('--rpg-frame-light');
    const leather = tone('--portrait-leather');
    const draw = (image: HTMLImageElement, time: number) => {
      if (disposed) return;
      ctx.clearRect(0, 0, 128, 128);
      ctx.imageSmoothingEnabled = false;
      const idle = Math.floor(time / 340) % Math.min(2, Math.floor(image.width / 16));
      const y = compact ? 16 : 18 + Math.round(Math.sin(time / 500));
      const x = 24;
      const size = 80;
      ctx.fillStyle = tone('--portrait-shadow');
      ctx.beginPath(); ctx.ellipse(64, 103, 29, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(image, idle * 16, 0, 16, 16, x, y, size, size);
      const pixel = (px: number, py: number, w: number, h: number, color: string) => {
        ctx.fillStyle = color; ctx.fillRect(px, py + y, w, h);
      };
      if (equipped.chest) {
        pixel(49, 42, 30, 20, edge); pixel(52, 42, 24, 15, metal);
        pixel(61, 44, 4, 12, gold); pixel(49, 60, 30, 4, leather);
      }
      if (equipped.legs) { pixel(51, 64, 10, 12, metal); pixel(67, 64, 10, 12, metal); }
      if (equipped.boots) { pixel(46, 74, 15, 7, edge); pixel(67, 74, 15, 7, edge); }
      if (equipped.gloves) { pixel(39, 49, 8, 10, leather); pixel(81, 49, 8, 10, leather); }
      if (equipped.helmet) {
        pixel(44, 13, 40, 7, edge); pixel(48, 9, 32, 9, metal);
        pixel(51, 9, 26, 3, gold); pixel(44, 18, 7, 12, metal); pixel(77, 18, 7, 12, metal);
      }
      if (equipped.main_hand) {
        if (characterClass === 'mage' || characterClass === 'healer') {
          pixel(88, 25, 4, 51, leather); pixel(82, 21, 16, 10, gold);
        } else if (characterClass === 'archer') {
          pixel(92, 32, 4, 31, gold); pixel(87, 27, 5, 5, leather); pixel(87, 63, 5, 5, leather);
        } else {
          pixel(88, 24, 6, 33, metal); pixel(88, 24, 2, 33, gold);
          pixel(81, 55, 20, 4, gold); pixel(88, 59, 5, 13, leather);
        }
      }
      if (equipped.off_hand) {
        pixel(27, 41, 24, 27, edge); pixel(30, 44, 18, 20, metal);
        pixel(37, 44, 4, 21, gold); pixel(31, 52, 16, 4, gold); pixel(33, 68, 12, 4, edge);
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
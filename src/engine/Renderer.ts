import { TILE_SIZE, TILE_COLORS, TILE_DETAIL_COLORS, TileType, CLASS_COLORS, RARITY_SPRITE_COLORS, Direction, PLAYER_SIZE } from './constants';
import { TileMapData, MapPOI } from './TileMap';
import { getImage, getSpriteSheet, drawFrame, CHARACTER_SPRITE_PATHS, MONSTER_SPRITE_PATHS, getMonsterSpriteKey, getMonsterSpriteByRarity } from './SpriteLoader';

// Cache rendered tiles for performance
const tileCache = new Map<string, HTMLCanvasElement>();

// Sprite-based tile cache
const spriteTileCache = new Map<string, HTMLCanvasElement>();
const biomeTileCache = new Map<string, HTMLCanvasElement>();
const groundVariantCache = new Map<string, HTMLCanvasElement>();

type ParallaxLayerKey = 'far' | 'mid' | 'near';
const parallaxCanvasCache = new Map<ParallaxLayerKey, HTMLCanvasElement>();

function getParallaxCanvas(key: ParallaxLayerKey): HTMLCanvasElement {
  const cached = parallaxCanvasCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;

  // Transparent base
  ctx.clearRect(0, 0, W, H);

  const seed = key === 'far' ? 13 : key === 'mid' ? 37 : 71;

  if (key === 'far') {
    // Distant mountains / rolling hills silhouette
    ctx.fillStyle = 'rgba(20, 35, 60, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const h1 = Math.sin(x * 0.008 + seed) * 60 + 80;
      const h2 = Math.sin(x * 0.015 + seed * 2) * 30;
      ctx.lineTo(x, H - h1 - h2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Stars / distant lights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 50; i++) {
      const sx = (Math.sin(i * 73.17 + seed) * 0.5 + 0.5) * W;
      const sy = (Math.sin(i * 41.31 + seed * 3) * 0.5 + 0.5) * (H * 0.5);
      const r = (i % 3 === 0) ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (key === 'mid') {
    // Mid-ground: tree line / forest silhouette
    ctx.fillStyle = 'rgba(15, 30, 20, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) {
      const base = H * 0.5;
      const treeHeight = Math.sin(x * 0.02 + seed) * 40 + Math.sin(x * 0.05 + seed * 1.5) * 20 + 50;
      // Jagged tree-top effect
      const jagged = (Math.sin(x * 0.3 + seed) * 8 + Math.sin(x * 0.7 + seed * 2) * 4);
      ctx.lineTo(x, base - treeHeight - jagged);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Occasional glowing spots (fireflies / windows)
    for (let i = 0; i < 15; i++) {
      const fx = (Math.sin(i * 47.3 + seed) * 0.5 + 0.5) * W;
      const fy = H * 0.35 + (Math.sin(i * 31.7 + seed * 2) * 0.5 + 0.5) * (H * 0.3);
      ctx.fillStyle = `rgba(200, 180, 100, 0.15)`;
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Near layer: grass tufts / foliage hints at bottom
    ctx.fillStyle = 'rgba(10, 20, 10, 0.45)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 3) {
      const grassH = Math.sin(x * 0.04 + seed) * 15 + Math.sin(x * 0.12 + seed * 3) * 8 + 25;
      const spikes = Math.sin(x * 0.5 + seed) * 6;
      ctx.lineTo(x, H - grassH - spikes);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Particle dust
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    for (let i = 0; i < 30; i++) {
      const px = (Math.sin(i * 61.7 + seed) * 0.5 + 0.5) * W;
      const py = (Math.sin(i * 37.3 + seed * 2) * 0.5 + 0.5) * H;
      ctx.fillRect(px, py, 2, 1);
    }
  }

  parallaxCanvasCache.set(key, canvas);
  return canvas;
}

export function renderParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number,
  animFrame: number,
  dayFactor: number
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const skyTop = `rgba(${Math.round(12 + 50 * dayFactor)}, ${Math.round(18 + 70 * dayFactor)}, ${Math.round(30 + 100 * dayFactor)}, 1)`;
  const skyBottom = `rgba(${Math.round(6 + 28 * dayFactor)}, ${Math.round(10 + 40 * dayFactor)}, ${Math.round(18 + 70 * dayFactor)}, 1)`;
  const g = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  g.addColorStop(0, skyTop);
  g.addColorStop(1, skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const layers: Array<{ key: ParallaxLayerKey; factor: number; alpha: number; driftX: number; driftY: number }> = [
    { key: 'far', factor: 0.12, alpha: 0.55, driftX: 0.08, driftY: 0.02 },
    { key: 'mid', factor: 0.22, alpha: 0.75, driftX: 0.12, driftY: 0.04 },
    { key: 'near', factor: 0.35, alpha: 0.55, driftX: 0.18, driftY: 0.06 },
  ];

  const t = animFrame;
  for (const layer of layers) {
    const img = getParallaxCanvas(layer.key);
    const ox = -(cameraX * layer.factor) + Math.sin(t * 0.01) * (img.width * layer.driftX);
    const oy = -(cameraY * layer.factor) + Math.cos(t * 0.008) * (img.height * layer.driftY);
    ctx.globalAlpha = layer.alpha;
    for (let x = -img.width; x < canvasWidth + img.width; x += img.width) {
      for (let y = -img.height; y < canvasHeight + img.height; y += img.height) {
        ctx.drawImage(img, x + (ox % img.width), y + (oy % img.height));
      }
    }
  }

  ctx.restore();
}

export function getDayFactor(timeOfDay01: number) {
  const t = ((timeOfDay01 % 1) + 1) % 1;
  const sun = Math.sin((t * Math.PI * 2) - Math.PI / 2) * 0.5 + 0.5;
  return Math.max(0, Math.min(1, sun));
}

export function renderDayNightOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  timeOfDay01: number
) {
  const day = getDayFactor(timeOfDay01);
  const night = 1 - day;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const dusk = Math.max(0, 1 - Math.abs(((timeOfDay01 % 1) + 1) % 1 - 0.5) * 6);
  const baseAlpha = 0.62 * night;
  if (baseAlpha > 0.01) {
    ctx.fillStyle = `rgba(10, 18, 34, ${baseAlpha})`;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (dusk > 0.01) {
    ctx.globalAlpha = 0.18 * dusk * (0.6 + 0.4 * day);
    const g = ctx.createRadialGradient(canvasWidth * 0.35, canvasHeight * 0.1, 0, canvasWidth * 0.35, canvasHeight * 0.1, canvasHeight);
    g.addColorStop(0, 'rgba(255, 160, 80, 0.9)');
    g.addColorStop(1, 'rgba(255, 160, 80, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  ctx.restore();
}

function getSpriteTile(type: TileType): HTMLCanvasElement | null {
  const key = `stile_${type}`;
  if (spriteTileCache.has(key)) return spriteTileCache.get(key)!;

  // Map tile types to sprite images and frame positions
  let imgSrc: string | null = null;
  let sx = 0, sy = 0, sw = 16, sh = 16;

  switch (type) {
    case TileType.GRASS:
    case TileType.FLOWER:
    case TileType.BUSH:
      imgSrc = '/sprites/tiles/grass_middle.png';
      break;
    case TileType.WATER:
    case TileType.CORAL:
      imgSrc = '/sprites/tiles/water_middle.png';
      break;
    case TileType.SAND:
      imgSrc = '/sprites/tiles/grass.png';
      sx = 32;
      break;
    case TileType.PATH:
    case TileType.BRIDGE:
      imgSrc = '/sprites/tiles/path_middle.png';
      break;
    default:
      return null;
  }

  const img = getImage(imgSrc);
  if (!img) return null;

  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Draw the 16x16 sprite scaled to TILE_SIZE
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TILE_SIZE, TILE_SIZE);

  // Add detail overlays for specific types
  if (type === TileType.FLOWER) {
    ctx.fillStyle = '#e05080';
    ctx.fillRect(14, 10, 4, 4);
    ctx.fillStyle = '#ff70a0';
    ctx.fillRect(12, 12, 2, 2);
    ctx.fillRect(18, 12, 2, 2);
  } else if (type === TileType.BUSH) {
    ctx.fillStyle = 'rgba(30,80,20,0.4)';
    ctx.fillRect(6, 14, 20, 14);
  }

  // Subtle grid line
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

  spriteTileCache.set(key, canvas);
  return canvas;
}

function getCachedTile(type: TileType): HTMLCanvasElement {
  // Try sprite-based tile first
  const spriteTile = getSpriteTile(type);
  if (spriteTile) return spriteTile;

  const key = `tile_${type}`;
  if (tileCache.has(key)) return tileCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = TILE_COLORS[type];
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Pixel art details
  const detail = TILE_DETAIL_COLORS[type];
  if (detail) {
    ctx.fillStyle = detail;
    switch (type) {
      case TileType.STONE:
        ctx.fillRect(2, 2, 28, 2);
        ctx.fillRect(2, 28, 28, 2);
        ctx.fillRect(2, 14, 10, 2);
        ctx.fillRect(20, 14, 10, 2);
        break;
      case TileType.BUILDING:
        ctx.fillStyle = '#9b8365';
        ctx.fillRect(2, 2, 28, 28);
        ctx.fillStyle = '#6b5335';
        ctx.fillRect(4, 0, 24, 4);
        ctx.fillStyle = '#4a6aa0';
        ctx.fillRect(8, 10, 6, 6);
        ctx.fillRect(18, 10, 6, 6);
        ctx.fillStyle = '#5b3216';
        ctx.fillRect(12, 18, 8, 14);
        break;
      case TileType.DOOR:
        ctx.fillStyle = '#8b5e2a';
        ctx.fillRect(4, 2, 24, 28);
        ctx.fillStyle = '#6b4226';
        ctx.fillRect(6, 4, 20, 24);
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(20, 14, 3, 3);
        break;
    }
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

  tileCache.set(key, canvas);
  return canvas;
}

function tileHash(x: number, y: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function biomeAtFast(x: number, y: number): 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz' {
  if (x < 40) return y < 30 ? 'caatinga' : 'litoral';
  return y < 30 ? 'agreste' : 'santa_cruz';
}

function pickSpriteCell(img: HTMLImageElement, cellW: number, cellH: number, pick: number) {
  const cols = Math.max(1, Math.floor(img.width / cellW));
  const rows = Math.max(1, Math.floor(img.height / cellH));
  const idx = Math.max(0, Math.floor(pick * cols * rows)) % (cols * rows);
  return { col: idx % cols, row: Math.floor(idx / cols) % rows, cols, rows };
}

function getGroundForNature(tile: TileType, biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz') {
  if (tile === TileType.CACTUS) return TileType.SAND;
  if (tile === TileType.PALM) return TileType.SAND;
  if (tile === TileType.ROCK) return biome === 'agreste' || biome === 'santa_cruz' ? TileType.GRASS : TileType.SAND;
  return biome === 'caatinga' || biome === 'litoral' ? TileType.SAND : TileType.GRASS;
}

function getBiomeSpecificTile(type: TileType, biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz'): HTMLCanvasElement | null {
  const key = `biome_${biome}_${type}`;
  if (biomeTileCache.has(key)) return biomeTileCache.get(key)!;

  let imgSrc: string | null = null;
  if (biome === 'caatinga' && type === TileType.GRASS) {
    imgSrc = '/sprites/tiles/dead_grass.png';
  }
  if (!imgSrc) return null;

  const img = getImage(imgSrc);
  if (!img) return null;

  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, 16, 16, 0, 0, TILE_SIZE, TILE_SIZE);
  biomeTileCache.set(key, canvas);
  return canvas;
}

function decorateGroundVariant(
  ctx: CanvasRenderingContext2D,
  type: TileType,
  biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz',
  variant: number
) {
  if (variant === 0) return;
  const seed = variant * 97 + (biome === 'caatinga' ? 13 : biome === 'litoral' ? 37 : 71);

  if (type === TileType.SAND) {
    ctx.fillStyle = biome === 'caatinga' ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.06)';
    for (let i = 0; i < 6; i++) {
      const x = Math.floor((Math.sin((seed + i) * 1.7) * 0.5 + 0.5) * (TILE_SIZE - 2));
      const y = Math.floor((Math.sin((seed + i) * 2.3) * 0.5 + 0.5) * (TILE_SIZE - 2));
      ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, 1);
    }
    if (biome === 'litoral') {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(6 + (variant % 5), 18 + (variant % 3), 2, 1);
    }
    if (biome === 'caatinga') {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(10 + (variant % 4), 8 + (variant % 5), 8, 1);
    }
    return;
  }

  if (type === TileType.GRASS) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(6 + (variant % 7), 8 + (variant % 5), 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(16 + (variant % 6), 18 + (variant % 4), 2, 1);
    return;
  }

  if (type === TileType.PATH) {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(8 + (variant % 6), 14, 10, 1);
    return;
  }

  if (type === TileType.WATER || type === TileType.CORAL) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(6 + (variant % 8), 10 + (variant % 6), 2, 1);
  }
}

function getGroundVariantTile(
  type: TileType,
  biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz',
  variant: number
) {
  const key = `gvar_${biome}_${type}_${variant}`;
  const cached = groundVariantCache.get(key);
  if (cached) return cached;

  const base = getBiomeSpecificTile(type, biome) ?? getCachedTile(type);
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0);
  decorateGroundVariant(ctx, type, biome, variant);
  groundVariantCache.set(key, canvas);
  return canvas;
}

// Draw nature objects (trees, cacti, rocks) using sprites
function renderNatureSprite(
  ctx: CanvasRenderingContext2D,
  type: TileType,
  sx: number, sy: number,
  tileX: number,
  tileY: number,
  animFrame: number
) {
  switch (type) {
    case TileType.TREE: {
      const biome = biomeAtFast(tileX, tileY);
      const roll = tileHash(tileX, tileY, 17);

      const oakLarge = getImage('/sprites/nature/oak_tree.png');
      const pine = getImage('/sprites/nature/pine_trees.png');
      const oakSmall = getImage('/sprites/nature/oak_tree_small.png');
      const trees = getImage('/sprites/nature/trees.png');
      const dead = getImage('/sprites/nature/dead_trees.png');

      ctx.imageSmoothingEnabled = false;

      const sway = Math.sin(animFrame * 0.06 + tileX * 0.7 + tileY * 1.3) * 1.2;
      const shadowAlpha = 0.18;
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(sx + TILE_SIZE / 2, sy + TILE_SIZE - 5, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (biome === 'caatinga' && dead) {
        const cell = pickSpriteCell(dead, 16, 32, roll);
        const targetH = TILE_SIZE * 1.9;
        const scale = targetH / 32;
        const dw = 16 * scale;
        const dh = 32 * scale;
        ctx.drawImage(dead, cell.col * 16, cell.row * 32, 16, 32, sx + TILE_SIZE / 2 - dw / 2, sy + TILE_SIZE - dh + sway, dw, dh);
        return;
      }

      if (roll < 0.18 && oakLarge) {
        const targetH = TILE_SIZE * 2.4;
        const scale = targetH / oakLarge.height;
        const dw = oakLarge.width * scale;
        const dh = oakLarge.height * scale;
        ctx.drawImage(oakLarge, 0, 0, oakLarge.width, oakLarge.height, sx + TILE_SIZE / 2 - dw / 2, sy + TILE_SIZE - dh + sway, dw, dh);
        return;
      }

      if (roll < 0.42 && pine) {
        const cell = pickSpriteCell(pine, 16, 32, roll);
        const targetH = TILE_SIZE * 2.0;
        const scale = targetH / 32;
        const dw = 16 * scale;
        const dh = 32 * scale;
        ctx.drawImage(pine, cell.col * 16, cell.row * 32, 16, 32, sx + TILE_SIZE / 2 - dw / 2, sy + TILE_SIZE - dh + sway, dw, dh);
        return;
      }

      if (roll < 0.62 && oakSmall) {
        const cell = pickSpriteCell(oakSmall, 16, 32, roll);
        const targetH = TILE_SIZE * 2.0;
        const scale = targetH / 32;
        const dw = 16 * scale;
        const dh = 32 * scale;
        ctx.drawImage(oakSmall, cell.col * 16, cell.row * 32, 16, 32, sx + TILE_SIZE / 2 - dw / 2, sy + TILE_SIZE - dh + sway, dw, dh);
        return;
      }

      if (trees) {
        const cell = pickSpriteCell(trees, 16, 16, roll);
        ctx.drawImage(trees, cell.col * 16, cell.row * 16, 16, 16, sx - 6, sy - 22 + sway, TILE_SIZE + 12, TILE_SIZE + 20);
        return;
      }
      // Fallback: canvas tree
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(sx + 10, sy + 20, 12, 8);
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(sx + 13, sy + 18, 6, 14);
      ctx.fillStyle = '#1d6a17';
      ctx.fillRect(sx + 6, sy + 2, 20, 16);
      ctx.fillStyle = '#2d8a27';
      ctx.fillRect(sx + 8, sy + 4, 16, 12);
      break;
    }
    case TileType.PALM: {
      const img = getImage('/sprites/nature/coconut_trees.png');
      if (img) {
        ctx.imageSmoothingEnabled = false;
        const pick = tileHash(tileX, tileY, 29);
        const cell = pickSpriteCell(img, 16, 16, pick);
        const sway = Math.sin(animFrame * 0.07 + tileX * 0.9 + tileY * 1.1) * 1.2;
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.beginPath();
        ctx.ellipse(sx + TILE_SIZE / 2, sy + TILE_SIZE - 5, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, cell.col * 16, cell.row * 16, 16, 16, sx - 6, sy - 22 + sway, TILE_SIZE + 12, TILE_SIZE + 20);
        return;
      }
      ctx.fillStyle = '#6b4a2a';
      ctx.fillRect(sx + 14, sy + 12, 4, 20);
      ctx.fillStyle = '#2b8a20';
      ctx.fillRect(sx + 4, sy + 2, 12, 6);
      ctx.fillRect(sx + 16, sy + 4, 12, 6);
      break;
    }
    case TileType.CACTUS: {
      const img = getImage('/sprites/nature/cactus.png');
      if (img) {
        ctx.imageSmoothingEnabled = false;
        const pick = tileHash(tileX, tileY, 41);
        const cell = pickSpriteCell(img, 16, 16, pick);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(sx + TILE_SIZE / 2, sy + TILE_SIZE - 6, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, cell.col * 16, cell.row * 16, 16, 16, sx - 1, sy - 6, TILE_SIZE + 2, TILE_SIZE + 6);
        return;
      }
      ctx.fillStyle = '#3a6a1a';
      ctx.fillRect(sx + 13, sy + 6, 6, 22);
      ctx.fillRect(sx + 7, sy + 10, 6, 4);
      ctx.fillRect(sx + 19, sy + 14, 6, 4);
      break;
    }
    case TileType.ROCK: {
      const img = getImage('/sprites/nature/rocks.png');
      if (img) {
        ctx.imageSmoothingEnabled = false;
        const pick = tileHash(tileX, tileY, 53);
        const cell = pickSpriteCell(img, 16, 16, pick);
        ctx.fillStyle = 'rgba(0,0,0,0.16)';
        ctx.beginPath();
        ctx.ellipse(sx + TILE_SIZE / 2, sy + TILE_SIZE - 6, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, cell.col * 16, cell.row * 16, 16, 16, sx + 1, sy + 2, TILE_SIZE - 2, TILE_SIZE - 2);
        return;
      }
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(sx + 6, sy + 10, 20, 16);
      ctx.fillStyle = '#6a6a6a';
      ctx.fillRect(sx + 8, sy + 12, 8, 4);
      break;
    }
  }
}

export function renderMap(
  ctx: CanvasRenderingContext2D,
  map: TileMapData,
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number,
  animFrame: number = 0
) {
  const startTileX = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
  const startTileY = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 1);
  const endTileX = Math.min(map.width, Math.ceil((cameraX + canvasWidth) / TILE_SIZE) + 1);
  const endTileY = Math.min(map.height, Math.ceil((cameraY + canvasHeight) / TILE_SIZE) + 1);

  const natureTiles: { x: number; y: number; tile: TileType; sx: number; sy: number }[] = [];

  for (let y = startTileY; y < endTileY; y++) {
    for (let x = startTileX; x < endTileX; x++) {
      const tile = map.tiles[y]?.[x] ?? TileType.EMPTY;
      const sx = x * TILE_SIZE - cameraX;
      const sy = y * TILE_SIZE - cameraY;

      // For nature objects, draw grass underneath then queue the object
      if (tile === TileType.TREE || tile === TileType.PALM || tile === TileType.CACTUS || tile === TileType.ROCK) {
        const biome = biomeAtFast(x, y);
        const ground = getGroundForNature(tile, biome);
        const groundSprite = getSpriteTile(ground);
        if (groundSprite) ctx.drawImage(groundSprite, sx, sy);
        else {
          ctx.fillStyle = TILE_COLORS[ground];
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
        natureTiles.push({ x, y, tile, sx, sy });
        continue;
      }

      const biome = biomeAtFast(x, y);
      const variantIndex = Math.floor(tileHash(x, y, 123) * 6);
      const tileCanvas =
        tile === TileType.SAND || tile === TileType.GRASS || tile === TileType.PATH || tile === TileType.WATER || tile === TileType.CORAL
          ? getGroundVariantTile(tile, biome, variantIndex)
          : getCachedTile(tile);
      ctx.drawImage(tileCanvas, sx, sy);

      // Water animation
      if (tile === TileType.WATER || tile === TileType.CORAL) {
        const phase = (animFrame + x * 7 + y * 11) % 48;
        ctx.fillStyle = phase < 24 ? 'rgba(255,255,255,0.1)' : 'rgba(0,80,180,0.08)';
        ctx.fillRect(sx + 3, sy + 10 + (phase % 6), 10, 2);
        ctx.fillRect(sx + 18, sy + 20 - (phase % 5), 11, 2);
      }

      // Biome transition blending
      if (tile === TileType.GRASS) {
        const right = map.tiles[y]?.[x + 1] ?? TileType.EMPTY;
        const down = map.tiles[y + 1]?.[x] ?? TileType.EMPTY;
        if (right === TileType.SAND) {
          ctx.fillStyle = 'rgba(194, 166, 69, 0.25)';
          ctx.fillRect(sx + TILE_SIZE - 4, sy + 2, 4, TILE_SIZE - 4);
        }
        if (down === TileType.SAND) {
          ctx.fillStyle = 'rgba(194, 166, 69, 0.25)';
          ctx.fillRect(sx + 2, sy + TILE_SIZE - 4, TILE_SIZE - 4, 4);
        }
      }

      // Litoral: borda areia/água (foam) sem depender de spritesheet de shoreline
      if (biome === 'litoral') {
        const left = map.tiles[y]?.[x - 1] ?? TileType.EMPTY;
        const up = map.tiles[y - 1]?.[x] ?? TileType.EMPTY;
        const right = map.tiles[y]?.[x + 1] ?? TileType.EMPTY;
        const down = map.tiles[y + 1]?.[x] ?? TileType.EMPTY;

        const isWater = (t: TileType) => t === TileType.WATER || t === TileType.CORAL;
        const isSand = (t: TileType) => t === TileType.SAND;

        if (tile === TileType.SAND) {
          const waterLeft = isWater(left);
          const waterUp = isWater(up);
          const waterRight = isWater(right);
          const waterDown = isWater(down);
          const touches = waterLeft || waterUp || waterRight || waterDown;
          if (touches) {
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            if (waterUp) ctx.fillRect(sx, sy, TILE_SIZE, 2);
            if (waterLeft) ctx.fillRect(sx, sy, 2, TILE_SIZE);
            if (waterRight) ctx.fillRect(sx + TILE_SIZE - 2, sy, 2, TILE_SIZE);
            if (waterDown) ctx.fillRect(sx, sy + TILE_SIZE - 2, TILE_SIZE, 2);

            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            if (waterUp) ctx.fillRect(sx, sy + 2, TILE_SIZE, 1);
            if (waterLeft) ctx.fillRect(sx + 2, sy, 1, TILE_SIZE);
            if (waterRight) ctx.fillRect(sx + TILE_SIZE - 3, sy, 1, TILE_SIZE);
            if (waterDown) ctx.fillRect(sx, sy + TILE_SIZE - 3, TILE_SIZE, 1);
          }
        }

        if (tile === TileType.WATER || tile === TileType.CORAL) {
          const sandLeft = isSand(left);
          const sandUp = isSand(up);
          const sandRight = isSand(right);
          const sandDown = isSand(down);
          const touches = sandLeft || sandUp || sandRight || sandDown;
          if (touches) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            if (sandUp) ctx.fillRect(sx, sy, TILE_SIZE, 2);
            if (sandLeft) ctx.fillRect(sx, sy, 2, TILE_SIZE);
            if (sandRight) ctx.fillRect(sx + TILE_SIZE - 2, sy, 2, TILE_SIZE);
            if (sandDown) ctx.fillRect(sx, sy + TILE_SIZE - 2, TILE_SIZE, 2);
          }
        }
      }
    }
  }

  // Render nature objects on top (sorted by Y for depth)
  natureTiles.sort((a, b) => a.y - b.y);
  for (const t of natureTiles) {
    renderNatureSprite(ctx, t.tile, t.sx, t.sy, t.x, t.y, animFrame);
  }
}

// Draw player sprite using sprite sheets
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  cameraX: number, cameraY: number,
  direction: Direction,
  characterClass: string,
  animFrame: number,
  isMoving: boolean,
  action?: 'idle' | 'walk' | 'attack' | 'hurt' | 'death',
  actionTimeMs?: number
) {
  const spritePath = CHARACTER_SPRITE_PATHS[characterClass] || CHARACTER_SPRITE_PATHS.warrior;
  const img = getImage(spritePath);
  
  const screenX = x * TILE_SIZE - cameraX;
  const screenY = y * TILE_SIZE - cameraY;
  let bounce = isMoving ? Math.sin(animFrame * 0.3) * 1.5 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 2, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    ctx.imageSmoothingEnabled = false;
    
    // MiniWorld character sheets: 16px per frame
    // Layout varies: melee (80px wide = 5 cols, 192px tall = 12 rows)
    //                ranged (96px wide = 6 cols, 128px tall = 8 rows)
    const frameW = 16;
    const frameH = 16;
    const cols = Math.max(1, Math.floor(img.width / frameW));
    const rows = Math.max(1, Math.floor(img.height / frameH));

    const dirIdx = direction === Direction.RIGHT ? 1 : direction === Direction.UP ? 2 : direction === Direction.LEFT ? 3 : 0;
    const idleRow = dirIdx * 2;
    const walkRow = idleRow + 1;
    const attackRow = 8 + dirIdx;
    const hurtRow = 12 + dirIdx;
    const deathRow = 16 + dirIdx;

    let wanted = action ?? (isMoving ? 'walk' : 'idle');
    if (wanted === 'death' && deathRow >= rows) wanted = 'idle';
    if (wanted === 'hurt' && hurtRow >= rows) wanted = 'idle';
    if (wanted === 'attack' && attackRow >= rows) wanted = isMoving && walkRow < rows ? 'walk' : 'idle';

    const pickedRow =
      wanted === 'death' ? Math.min(deathRow, rows - 1)
      : wanted === 'hurt' ? Math.min(hurtRow, rows - 1)
      : wanted === 'attack' ? Math.min(attackRow, rows - 1)
      : wanted === 'walk' ? Math.min(walkRow, rows - 1)
      : Math.min(idleRow, rows - 1);

    bounce = wanted === 'walk' && isMoving ? Math.sin(animFrame * 0.3) * 1.5 : 0;

    const time = Math.max(0, actionTimeMs ?? 0);
    const frameCap = wanted === 'walk' ? cols : Math.min(cols, 5);
    const frameIdx =
      wanted === 'death'
        ? Math.min(frameCap - 1, Math.floor(time / 120))
        : wanted === 'hurt'
          ? Math.min(frameCap - 1, Math.floor(time / 90))
          : wanted === 'attack'
            ? Math.min(frameCap - 1, Math.floor(time / 80))
            : isMoving ? Math.floor(animFrame / 4) % cols : 0;
    
    // Draw character scaled from 16x16 to display size
    const drawSize = TILE_SIZE + 8;
    const drawX = screenX - 4;
    const drawY = screenY - 8 + bounce;
    
    ctx.drawImage(
      img,
      frameIdx * frameW, pickedRow * frameH, frameW, frameH,
      drawX, drawY, drawSize, drawSize
    );
  } else {
    // Fallback: canvas-drawn character
    const colors = CLASS_COLORS[characterClass] || CLASS_COLORS.warrior;
    const drawX = screenX + (TILE_SIZE - PLAYER_SIZE) / 2;
    const drawY = screenY + (TILE_SIZE - PLAYER_SIZE) / 2 + bounce;

    ctx.fillStyle = colors.body;
    ctx.fillRect(drawX + 6, drawY + 10, PLAYER_SIZE - 12, 14);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(drawX + 6, drawY + 16, PLAYER_SIZE - 12, 3);
    ctx.fillStyle = colors.skin;
    ctx.fillRect(drawX + 8, drawY + 2, PLAYER_SIZE - 16, 10);
    ctx.fillStyle = '#1a1a1a';
    if (direction === Direction.DOWN) {
      ctx.fillRect(drawX + 10, drawY + 6, 2, 2);
      ctx.fillRect(drawX + 16, drawY + 6, 2, 2);
    } else if (direction === Direction.LEFT) {
      ctx.fillRect(drawX + 9, drawY + 6, 2, 2);
    } else if (direction === Direction.RIGHT) {
      ctx.fillRect(drawX + 17, drawY + 6, 2, 2);
    }
    ctx.fillStyle = colors.body;
    ctx.fillRect(drawX + 7, drawY + 1, PLAYER_SIZE - 14, 4);
    ctx.fillRect(drawX + 8, drawY + 24, 4, 4);
    ctx.fillRect(drawX + 16, drawY + 24, 4, 4);
  }

  // Name tag
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
}

// Draw creature sprite using sprite sheets
export function renderCreature(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  cameraX: number, cameraY: number,
  rarity: string,
  animFrame: number,
  name: string
) {
  const screenX = x * TILE_SIZE - cameraX;
  const screenY = y * TILE_SIZE - cameraY;
  const float = Math.sin(animFrame * 0.05) * 2;

  // Try to find a specific monster sprite by name, then fallback by rarity
  const spriteKey = getMonsterSpriteKey(name) !== 'slime' 
    ? getMonsterSpriteKey(name) 
    : getMonsterSpriteByRarity(rarity);
  const spritePath = MONSTER_SPRITE_PATHS[spriteKey];
  const img = spritePath ? getImage(spritePath) : null;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (img) {
    ctx.imageSmoothingEnabled = false;
    const frameW = 16;
    const frameH = 16;
    const cols = Math.floor(img.width / frameW);
    
    // Idle animation: cycle through first row frames
    const frameIdx = Math.floor(animFrame / 6) % Math.max(1, cols);
    
    const drawSize = TILE_SIZE + 4;
    ctx.drawImage(
      img,
      frameIdx * frameW, 0, frameW, frameH,
      screenX - 2, screenY - 4 + float, drawSize, drawSize
    );

    // Rarity glow
    if (rarity !== 'common') {
      const colors = RARITY_SPRITE_COLORS[rarity] || RARITY_SPRITE_COLORS.common;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5 + Math.sin(animFrame * 0.08) * 0.3;
      ctx.strokeRect(screenX - 3, screenY - 5 + float, drawSize + 2, drawSize + 2);
      ctx.globalAlpha = 1;
    }
  } else {
    // Fallback: canvas-drawn creature
    const colors = RARITY_SPRITE_COLORS[rarity] || RARITY_SPRITE_COLORS.common;
    const size = TILE_SIZE - 4;
    ctx.fillStyle = colors.body;
    ctx.fillRect(screenX + 4, screenY + 6 + float, size - 8, size - 10);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(screenX + 8, screenY + 10 + float, 3, 3);
    ctx.fillRect(screenX + size - 7, screenY + 10 + float, 3, 3);
    if (rarity !== 'common') {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + 2, screenY + 4 + float, size - 4, size - 6);
    }
  }

  // Name with background
  const nameW = ctx.measureText(name).width;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(screenX + TILE_SIZE / 2 - nameW / 2 - 2, screenY - 8, nameW + 4, 10);
  
  const rarityNameColors: Record<string, string> = {
    common: '#cccccc',
    uncommon: '#2ecc71',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f1c40f',
  };
  ctx.fillStyle = rarityNameColors[rarity] || '#cccccc';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, screenX + TILE_SIZE / 2, screenY - 1);
}

// Draw POI marker
export function renderPOI(
  ctx: CanvasRenderingContext2D,
  poi: MapPOI,
  cameraX: number,
  cameraY: number,
  animFrame: number
) {
  const screenX = poi.x * TILE_SIZE - cameraX;
  const screenY = poi.y * TILE_SIZE - cameraY;
  const float = Math.sin(animFrame * 0.03 + poi.x) * 3;

  const markerColors: Record<string, string> = {
    npc: '#3498db',
    creature: '#e74c3c',
    shop: '#f39c12',
    quest: '#e74c3c',
    rest: '#2ecc71',
  };

  ctx.fillStyle = markerColors[poi.type] || '#95a5a6';
  ctx.fillRect(screenX + 4, screenY - 8 + float, 24, 14);
  
  ctx.beginPath();
  ctx.moveTo(screenX + 12, screenY + 6 + float);
  ctx.lineTo(screenX + 16, screenY + 12 + float);
  ctx.lineTo(screenX + 20, screenY + 6 + float);
  ctx.fill();

  ctx.font = '14px serif';
  ctx.textAlign = 'center';
  ctx.fillText(poi.emoji, screenX + TILE_SIZE / 2, screenY + float);
}

// Draw minimap
export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  map: TileMapData,
  playerX: number,
  playerY: number,
  canvasWidth: number,
  canvasHeight: number,
  minimapSize: number = 150,
  options?: {
    zoom?: number;
    alpha?: number;
    explored?: Uint8Array;
    pois?: MapPOI[];
    trackedPoiTypes?: string[];
    showLabels?: boolean;
    position?: { x: number; y: number };
    size?: number;
    showPlayer?: boolean;
    allowPoiTypes?: string[];
  }
) {
  const zoom = options?.zoom ?? 2;
  const alpha = options?.alpha ?? 0.92;
  const explored = options?.explored;
  const pois = options?.pois ?? [];
  const trackedPoiTypes = options?.trackedPoiTypes ?? ['quest'];
  const showLabels = options?.showLabels ?? false;
  const showPlayer = options?.showPlayer ?? true;
  const allowPoiTypes = options?.allowPoiTypes;

  const size = options?.size ?? Math.max(120, Math.min(minimapSize, Math.floor(canvasWidth * 0.22)));
  const mx = options?.position?.x ?? (canvasWidth - size - 12);
  const my = options?.position?.y ?? 12;

  const tilePx = Math.max(2, Math.min(6, zoom * 2));
  const tilesVisibleX = Math.max(10, Math.floor(size / tilePx));
  const tilesVisibleY = tilesVisibleX;

  const halfX = Math.floor(tilesVisibleX / 2);
  const halfY = Math.floor(tilesVisibleY / 2);

  const startX = Math.max(0, Math.min(map.width - tilesVisibleX, playerX - halfX));
  const startY = Math.max(0, Math.min(map.height - tilesVisibleY, playerY - halfY));

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(mx - 2, my - 2, size + 4, size + 4);

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(mx, my, size, size);

  for (let y = 0; y < tilesVisibleY; y++) {
    const ty = startY + y;
    for (let x = 0; x < tilesVisibleX; x++) {
      const tx = startX + x;
      const idx = ty * map.width + tx;
      const isExplored = explored ? explored[idx] === 1 : true;
      const tile = map.tiles[ty]?.[tx] ?? TileType.EMPTY;

      const drawX = mx + x * tilePx;
      const drawY = my + y * tilePx;

      if (!isExplored) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(drawX, drawY, tilePx, tilePx);
        continue;
      }

      ctx.fillStyle = TILE_COLORS[tile] ?? '#1a1a2e';
      ctx.fillRect(drawX, drawY, tilePx, tilePx);
    }
  }

  const poiColors: Record<string, string> = {
    npc: '#3498db',
    creature: '#e74c3c',
    shop: '#f39c12',
    quest: '#e74c3c',
    rest: '#2ecc71',
  };

  for (const poi of pois) {
    if (allowPoiTypes && !allowPoiTypes.includes(poi.type)) continue;
    if (poi.x < startX || poi.x >= startX + tilesVisibleX || poi.y < startY || poi.y >= startY + tilesVisibleY) continue;
    const idx = poi.y * map.width + poi.x;
    if (explored && explored[idx] !== 1) continue;

    const px = mx + (poi.x - startX) * tilePx;
    const py = my + (poi.y - startY) * tilePx;
    const color = poiColors[poi.type] ?? '#ffffff';
    const isTracked = trackedPoiTypes.includes(poi.type);
    ctx.fillStyle = color;
    ctx.fillRect(px, py, tilePx, tilePx);
    if (isTracked) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 1, py - 1, tilePx + 2, tilePx + 2);
    }
  }

  if (showPlayer) {
    const playerPx = mx + (playerX - startX) * tilePx;
    const playerPy = my + (playerY - startY) * tilePx;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playerPx - 1, playerPy - 1, tilePx + 2, tilePx + 2);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(playerPx, playerPy, tilePx, tilePx);
  }

  ctx.strokeStyle = '#d49d2b';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx - 2, my - 2, size + 4, size + 4);

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, size, size);

  if (showLabels) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MAP', mx + 6, my + 12);
  }

  ctx.restore();
}

// Draw HUD overlay
export function renderHUD(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  character: {
    name: string;
    level: number;
    health: number;
    max_health: number;
    mana: number;
    max_mana: number;
    gold: number;
    current_biome: string;
  }
) {
  const hudW = 260;
  const hudH = 100;
  const hudX = 10;
  const hudY = 10;
  const barW = 190;
  const barH = 14;
  const padding = 12;

  ctx.save();
  ctx.fillStyle = 'rgba(12, 10, 8, 0.88)';
  ctx.fillRect(hudX, hudY, hudW, hudH);

  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(hudX + 1, hudY + 1, hudW - 2, hudH - 2);
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX + 4, hudY + 4, hudW - 8, hudH - 8);

  const corners = [[hudX + 2, hudY + 2], [hudX + hudW - 8, hudY + 2], [hudX + 2, hudY + hudH - 8], [hudX + hudW - 8, hudY + hudH - 8]];
  ctx.fillStyle = '#c9a84c';
  corners.forEach(([cx, cy]) => ctx.fillRect(cx, cy, 6, 6));
  ctx.fillStyle = '#8b6914';
  corners.forEach(([cx, cy]) => ctx.fillRect(cx + 1, cy + 1, 4, 4));

  ctx.fillStyle = '#f5d442';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 3;
  ctx.fillText(character.name, hudX + padding, hudY + 22);

  const lvlText = `Nv.${character.level}`;
  const lvlW = ctx.measureText(lvlText).width + 10;
  ctx.fillStyle = 'rgba(245, 212, 66, 0.15)';
  ctx.fillRect(hudX + hudW - padding - lvlW, hudY + 10, lvlW, 18);
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX + hudW - padding - lvlW, hudY + 10, lvlW, 18);
  ctx.fillStyle = '#f5d442';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(lvlText, hudX + hudW - padding - lvlW + 5, hudY + 23);

  ctx.shadowBlur = 0;

  const hpY = hudY + 32;
  ctx.fillStyle = '#1a1215';
  ctx.fillRect(hudX + padding, hpY, barW, barH);
  ctx.strokeStyle = '#4a2020';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX + padding, hpY, barW, barH);
  const hpPct = character.health / character.max_health;
  const hpGrad = ctx.createLinearGradient(hudX + padding, hpY, hudX + padding + barW * hpPct, hpY);
  hpGrad.addColorStop(0, '#8b1a1a');
  hpGrad.addColorStop(0.5, '#d42020');
  hpGrad.addColorStop(1, '#ff4040');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(hudX + padding + 1, hpY + 1, (barW - 2) * hpPct, barH - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(hudX + padding + 1, hpY + 1, (barW - 2) * hpPct, (barH - 2) / 2);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 2;
  ctx.fillText(`❤ ${character.health}/${character.max_health}`, hudX + padding + 4, hpY + 11);
  ctx.shadowBlur = 0;

  const mpY = hpY + barH + 4;
  ctx.fillStyle = '#0f1520';
  ctx.fillRect(hudX + padding, mpY, barW, barH);
  ctx.strokeStyle = '#1a3060';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX + padding, mpY, barW, barH);
  const mpPct = character.mana / character.max_mana;
  const mpGrad = ctx.createLinearGradient(hudX + padding, mpY, hudX + padding + barW * mpPct, mpY);
  mpGrad.addColorStop(0, '#1a3a8b');
  mpGrad.addColorStop(0.5, '#2060d4');
  mpGrad.addColorStop(1, '#4090ff');
  ctx.fillStyle = mpGrad;
  ctx.fillRect(hudX + padding + 1, mpY + 1, (barW - 2) * mpPct, barH - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(hudX + padding + 1, mpY + 1, (barW - 2) * mpPct, (barH - 2) / 2);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 2;
  ctx.fillText(`💧 ${character.mana}/${character.max_mana}`, hudX + padding + 4, mpY + 11);
  ctx.shadowBlur = 0;

  const infoY = mpY + barH + 6;
  ctx.fillStyle = '#f5d442';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`🪙 ${character.gold}`, hudX + padding, infoY);

  const biomeNames: Record<string, string> = { caatinga: 'Caatinga', agreste: 'Agreste', litoral: 'Litoral', santa_cruz: 'Santa Cruz' };
  ctx.fillStyle = '#8a8a8a';
  ctx.font = '10px monospace';
  ctx.fillText(`📍 ${biomeNames[character.current_biome] || character.current_biome}`, hudX + padding + 80, infoY);

  ctx.restore();
}

// Draw controls hint at bottom
export function renderControls(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(8, canvasHeight - 30, 360, 24);
  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('WASD/Setas: Mover | E: Interagir | Espaço/F: Ataque | H: Hurt | I: Inventário | M: Menu | ESC: Sair', 14, canvasHeight - 14);
}

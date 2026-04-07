import { TILE_SIZE, TILE_COLORS, TILE_DETAIL_COLORS, TileType, CLASS_COLORS, RARITY_SPRITE_COLORS, Direction, PLAYER_SIZE } from './constants';
import { TileMapData, MapPOI } from './TileMap';
import { getImage, getSpriteSheet, drawFrame, CHARACTER_SPRITE_PATHS, MONSTER_SPRITE_PATHS, getMonsterSpriteKey, getMonsterSpriteByRarity } from './SpriteLoader';

// Cache rendered tiles for performance
const tileCache = new Map<string, HTMLCanvasElement>();

// Sprite-based tile cache
const spriteTileCache = new Map<string, HTMLCanvasElement>();

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
      imgSrc = '/sprites/tiles/beach_tile.png';
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

// Draw nature objects (trees, cacti, rocks) using sprites
function renderNatureSprite(
  ctx: CanvasRenderingContext2D,
  type: TileType,
  sx: number, sy: number,
  animFrame: number
) {
  switch (type) {
    case TileType.TREE: {
      const img = getImage('/sprites/nature/trees.png');
      if (img) {
        ctx.imageSmoothingEnabled = false;
        // trees.png is 64x16, 4 tree variations of 16x16
        const variant = Math.abs((sx + sy) * 7) % 4;
        // Draw tree shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sx + 6, sy + TILE_SIZE - 8, TILE_SIZE - 12, 6);
        // Draw tree scaled up, offset upward for canopy
        ctx.drawImage(img, variant * 16, 0, 16, 16, sx - 4, sy - 16, TILE_SIZE + 8, TILE_SIZE + 16);
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
        const variant = Math.abs((sx + sy) * 3) % (Math.floor(img.width / 16));
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(sx + 8, sy + TILE_SIZE - 6, TILE_SIZE - 16, 4);
        ctx.drawImage(img, variant * 16, 0, 16, 16, sx - 4, sy - 16, TILE_SIZE + 8, TILE_SIZE + 16);
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
        const variant = Math.abs((sx + sy) * 5) % Math.floor(img.width / 16);
        ctx.drawImage(img, variant * 16, 0, 16, 16, sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
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
        // rocks.png is 48x64 - extract a 16x16 portion
        const variant = Math.abs((sx + sy) * 11) % 3;
        ctx.drawImage(img, variant * 16, 0, 16, 16, sx + 4, sy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
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
        const grassTile = getSpriteTile(TileType.GRASS);
        if (grassTile) {
          ctx.drawImage(grassTile, sx, sy);
        } else {
          ctx.fillStyle = TILE_COLORS[TileType.GRASS];
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
        natureTiles.push({ x, y, tile, sx, sy });
        continue;
      }

      const tileCanvas = getCachedTile(tile);
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
    }
  }

  // Render nature objects on top (sorted by Y for depth)
  natureTiles.sort((a, b) => a.y - b.y);
  for (const t of natureTiles) {
    renderNatureSprite(ctx, t.tile, t.sx, t.sy, animFrame);
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
  isMoving: boolean
) {
  const spritePath = CHARACTER_SPRITE_PATHS[characterClass] || CHARACTER_SPRITE_PATHS.warrior;
  const img = getImage(spritePath);
  
  const screenX = x * TILE_SIZE - cameraX;
  const screenY = y * TILE_SIZE - cameraY;
  const bounce = isMoving ? Math.sin(animFrame * 0.3) * 1.5 : 0;

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
    const cols = Math.floor(img.width / frameW);
    
    // Direction mapping for MiniWorld sprites:
    // Rows: 0=idle_down, 1=walk_down, 2=idle_right, 3=walk_right, 
    //        4=idle_up, 5=walk_up, 6=idle_left, 7=walk_left
    // Some sheets have attack rows after walk rows
    const dirMap: Record<string, number> = { down: 0, right: 2, up: 4, left: 6 };
    const baseRow = dirMap[direction] ?? 0;
    const row = isMoving ? baseRow + 1 : baseRow;
    const maxRow = Math.floor(img.height / frameH);
    const safeRow = Math.min(row, maxRow - 1);
    
    // Animation frame cycling
    const frameIdx = isMoving ? Math.floor(animFrame / 4) % cols : 0;
    
    // Draw character scaled from 16x16 to display size
    const drawSize = TILE_SIZE + 8;
    const drawX = screenX - 4;
    const drawY = screenY - 8 + bounce;
    
    ctx.drawImage(
      img,
      frameIdx * frameW, safeRow * frameH, frameW, frameH,
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
  ctx.fillText('WASD/Setas: Mover | E: Interagir | I: Inventário | M: Menu | ESC: Sair', 14, canvasHeight - 14);
}

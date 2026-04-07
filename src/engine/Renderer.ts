import { TILE_SIZE, TILE_COLORS, TILE_DETAIL_COLORS, TileType, CLASS_COLORS, RARITY_SPRITE_COLORS, Direction, PLAYER_SIZE } from './constants';
import { TileMapData, MapPOI } from './TileMap';

// Cache rendered tiles for performance
const tileCache = new Map<string, HTMLCanvasElement>();

function getCachedTile(type: TileType): HTMLCanvasElement {
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
      case TileType.GRASS:
        // Grass blades
        for (let i = 0; i < 6; i++) {
          const gx = (i * 5 + 3) % TILE_SIZE;
          const gy = (i * 7 + 2) % TILE_SIZE;
          ctx.fillRect(gx, gy, 2, 4);
        }
        break;
      case TileType.SAND:
        // Sand dots
        for (let i = 0; i < 4; i++) {
          ctx.fillRect((i * 8 + 4) % TILE_SIZE, (i * 9 + 3) % TILE_SIZE, 2, 2);
        }
        break;
      case TileType.WATER:
        // Wave lines
        ctx.fillRect(4, 12, 10, 2);
        ctx.fillRect(18, 20, 10, 2);
        ctx.fillRect(8, 28, 8, 2);
        break;
      case TileType.TREE:
        // Tree trunk and canopy
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(13, 18, 6, 14);
        ctx.fillStyle = '#1d6a17';
        ctx.fillRect(6, 4, 20, 16);
        ctx.fillStyle = '#2d8a27';
        ctx.fillRect(8, 6, 16, 12);
        break;
      case TileType.CACTUS:
        // Cactus shape
        ctx.fillStyle = '#3a6a1a';
        ctx.fillRect(13, 6, 6, 22);
        ctx.fillRect(7, 10, 6, 4);
        ctx.fillRect(19, 14, 6, 4);
        ctx.fillStyle = '#5aaa3a';
        ctx.fillRect(14, 7, 4, 2);
        break;
      case TileType.BUSH:
        ctx.fillRect(6, 14, 20, 14);
        ctx.fillStyle = TILE_COLORS[type];
        ctx.fillRect(8, 16, 16, 10);
        break;
      case TileType.FLOWER:
        // Flower on grass
        ctx.fillStyle = '#e05080';
        ctx.fillRect(14, 10, 4, 4);
        ctx.fillStyle = '#ff70a0';
        ctx.fillRect(12, 12, 2, 2);
        ctx.fillRect(18, 12, 2, 2);
        ctx.fillRect(14, 8, 2, 2);
        ctx.fillRect(14, 14, 2, 2);
        break;
      case TileType.PATH:
        ctx.fillRect(4, 4, 4, 2);
        ctx.fillRect(20, 14, 4, 2);
        ctx.fillRect(10, 24, 4, 2);
        break;
      case TileType.BUILDING:
        // Building face
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
      case TileType.CORAL:
        ctx.fillRect(8, 8, 4, 12);
        ctx.fillRect(18, 6, 4, 14);
        ctx.fillStyle = '#ff9080';
        ctx.fillRect(6, 6, 2, 4);
        ctx.fillRect(20, 4, 2, 4);
        break;
      case TileType.PALM:
        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(14, 12, 4, 20);
        ctx.fillStyle = '#2b8a20';
        ctx.fillRect(4, 2, 12, 6);
        ctx.fillRect(16, 4, 12, 6);
        ctx.fillRect(8, 8, 8, 4);
        break;
      case TileType.ROCK:
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(6, 10, 20, 16);
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(8, 12, 8, 4);
        break;
      case TileType.STONE:
        ctx.fillRect(2, 2, 28, 2);
        ctx.fillRect(2, 28, 28, 2);
        break;
      case TileType.BRIDGE:
        ctx.fillStyle = '#7b6b4b';
        ctx.fillRect(0, 6, TILE_SIZE, 4);
        ctx.fillRect(0, 22, TILE_SIZE, 4);
        break;
    }
  }

  // Subtle grid line
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

  tileCache.set(key, canvas);
  return canvas;
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

  const visibleTiles: { x: number; y: number; tile: TileType }[] = [];

  for (let y = startTileY; y < endTileY; y++) {
    for (let x = startTileX; x < endTileX; x++) {
      const tile = map.tiles[y]?.[x] ?? TileType.EMPTY;
      const tileCanvas = getCachedTile(tile);
      ctx.drawImage(
        tileCanvas,
        x * TILE_SIZE - cameraX,
        y * TILE_SIZE - cameraY
      );

      visibleTiles.push({ x, y, tile });

      if (tile === TileType.WATER) {
        const sx = x * TILE_SIZE - cameraX;
        const sy = y * TILE_SIZE - cameraY;
        const phase = (animFrame + x * 7 + y * 11) % 48;
        ctx.fillStyle = phase < 24 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(sx + 3, sy + 10 + (phase % 6), 10, 2);
        ctx.fillRect(sx + 18, sy + 20 - (phase % 5), 11, 2);
      }

      if (tile === TileType.GRASS) {
        const right = map.tiles[y]?.[x + 1] ?? TileType.EMPTY;
        const down = map.tiles[y + 1]?.[x] ?? TileType.EMPTY;
        const sx = x * TILE_SIZE - cameraX;
        const sy = y * TILE_SIZE - cameraY;
        if (right === TileType.SAND) {
          ctx.fillStyle = 'rgba(194, 166, 69, 0.28)';
          ctx.fillRect(sx + TILE_SIZE - 4, sy + 2, 4, TILE_SIZE - 4);
        }
        if (down === TileType.SAND) {
          ctx.fillStyle = 'rgba(194, 166, 69, 0.28)';
          ctx.fillRect(sx + 2, sy + TILE_SIZE - 4, TILE_SIZE - 4, 4);
        }
      }
    }
  }

  for (const t of visibleTiles) {
    const sx = t.x * TILE_SIZE - cameraX;
    const sy = t.y * TILE_SIZE - cameraY;

    if (t.tile === TileType.TREE) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(sx + 10, sy + 20, 12, 8);
      ctx.fillStyle = '#1d6a17';
      ctx.fillRect(sx + 6, sy - 10, 20, 16);
      ctx.fillStyle = '#2d8a27';
      ctx.fillRect(sx + 8, sy - 8, 16, 12);
    }

    if (t.tile === TileType.PALM) {
      ctx.fillStyle = '#2b8a20';
      ctx.fillRect(sx + 2, sy - 8, 14, 6);
      ctx.fillRect(sx + 16, sy - 6, 14, 6);
      ctx.fillRect(sx + 10, sy - 2, 10, 4);
    }
  }
}

// Draw player sprite (pixel art style)
export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  cameraX: number, cameraY: number,
  direction: Direction,
  characterClass: string,
  animFrame: number,
  isMoving: boolean
) {
  const colors = CLASS_COLORS[characterClass] || CLASS_COLORS.warrior;
  const screenX = x * TILE_SIZE - cameraX + (TILE_SIZE - PLAYER_SIZE) / 2;
  const screenY = y * TILE_SIZE - cameraY + (TILE_SIZE - PLAYER_SIZE) / 2;

  // Bounce animation
  const bounce = isMoving ? Math.sin(animFrame * 0.3) * 2 : 0;
  const drawY = screenY + bounce;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(screenX + 4, screenY + PLAYER_SIZE - 4, PLAYER_SIZE - 8, 4);

  // Body
  ctx.fillStyle = colors.body;
  ctx.fillRect(screenX + 6, drawY + 10, PLAYER_SIZE - 12, 14);

  // Accent (belt/detail)
  ctx.fillStyle = colors.accent;
  ctx.fillRect(screenX + 6, drawY + 16, PLAYER_SIZE - 12, 3);

  // Head
  ctx.fillStyle = colors.skin;
  ctx.fillRect(screenX + 8, drawY + 2, PLAYER_SIZE - 16, 10);

  // Eyes based on direction
  ctx.fillStyle = '#1a1a1a';
  switch (direction) {
    case Direction.DOWN:
      ctx.fillRect(screenX + 10, drawY + 6, 2, 2);
      ctx.fillRect(screenX + 16, drawY + 6, 2, 2);
      break;
    case Direction.UP:
      break; // No eyes visible from back
    case Direction.LEFT:
      ctx.fillRect(screenX + 9, drawY + 6, 2, 2);
      break;
    case Direction.RIGHT:
      ctx.fillRect(screenX + 17, drawY + 6, 2, 2);
      break;
  }

  // Hair/helmet (class specific)
  ctx.fillStyle = colors.body;
  ctx.fillRect(screenX + 7, drawY + 1, PLAYER_SIZE - 14, 4);

  // Legs with walk animation
  ctx.fillStyle = colors.body;
  if (isMoving) {
    const legOffset = Math.sin(animFrame * 0.4) * 2;
    ctx.fillRect(screenX + 8, drawY + 24, 4, 4 + legOffset);
    ctx.fillRect(screenX + 16, drawY + 24, 4, 4 - legOffset);
  } else {
    ctx.fillRect(screenX + 8, drawY + 24, 4, 4);
    ctx.fillRect(screenX + 16, drawY + 24, 4, 4);
  }

  // Name tag
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  // Name is drawn by the canvas component
}

// Draw creature sprite
export function renderCreature(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  cameraX: number, cameraY: number,
  rarity: string,
  animFrame: number,
  name: string
) {
  const colors = RARITY_SPRITE_COLORS[rarity] || RARITY_SPRITE_COLORS.common;
  const screenX = x * TILE_SIZE - cameraX + 2;
  const screenY = y * TILE_SIZE - cameraY + 2;
  const size = TILE_SIZE - 4;

  const float = Math.sin(animFrame * 0.05) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(screenX + 4, screenY + size - 2, size - 8, 4);

  // Body
  ctx.fillStyle = colors.body;
  ctx.fillRect(screenX + 4, screenY + 6 + float, size - 8, size - 10);

  // Eyes
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(screenX + 8, screenY + 10 + float, 3, 3);
  ctx.fillRect(screenX + size - 11, screenY + 10 + float, 3, 3);

  // Rarity glow
  if (rarity !== 'common') {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX + 2, screenY + 4 + float, size - 4, size - 6);
  }

  // Name
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(name, screenX + size / 2, screenY + 2);
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

  // Marker background
  const markerColors: Record<string, string> = {
    npc: '#3498db',
    creature: '#e74c3c',
    shop: '#f39c12',
    quest: '#e74c3c',
    rest: '#2ecc71',
  };

  ctx.fillStyle = markerColors[poi.type] || '#95a5a6';
  ctx.fillRect(screenX + 4, screenY - 8 + float, 24, 14);
  
  // Arrow
  ctx.beginPath();
  ctx.moveTo(screenX + 12, screenY + 6 + float);
  ctx.lineTo(screenX + 16, screenY + 12 + float);
  ctx.lineTo(screenX + 20, screenY + 6 + float);
  ctx.fill();

  // Emoji
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

  // Background with gradient effect
  ctx.save();
  ctx.fillStyle = 'rgba(12, 10, 8, 0.88)';
  ctx.fillRect(hudX, hudY, hudW, hudH);

  // Ornamental frame - double border
  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(hudX + 1, hudY + 1, hudW - 2, hudH - 2);
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX + 4, hudY + 4, hudW - 8, hudH - 8);

  // Corner ornaments
  const corners = [[hudX + 2, hudY + 2], [hudX + hudW - 8, hudY + 2], [hudX + 2, hudY + hudH - 8], [hudX + hudW - 8, hudY + hudH - 8]];
  ctx.fillStyle = '#c9a84c';
  corners.forEach(([cx, cy]) => ctx.fillRect(cx, cy, 6, 6));
  ctx.fillStyle = '#8b6914';
  corners.forEach(([cx, cy]) => ctx.fillRect(cx + 1, cy + 1, 4, 4));

  // Name & level with better typography
  ctx.fillStyle = '#f5d442';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 3;
  ctx.fillText(character.name, hudX + padding, hudY + 22);

  // Level badge
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

  // Health bar
  const hpY = hudY + 32;
  // Bar background
  ctx.fillStyle = '#1a1215';
  ctx.fillRect(hudX + padding, hpY, barW, barH);
  // Bar border
  ctx.strokeStyle = '#4a2020';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX + padding, hpY, barW, barH);
  // Bar fill with gradient
  const hpPct = character.health / character.max_health;
  const hpGrad = ctx.createLinearGradient(hudX + padding, hpY, hudX + padding + barW * hpPct, hpY);
  hpGrad.addColorStop(0, '#8b1a1a');
  hpGrad.addColorStop(0.5, '#d42020');
  hpGrad.addColorStop(1, '#ff4040');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(hudX + padding + 1, hpY + 1, (barW - 2) * hpPct, barH - 2);
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(hudX + padding + 1, hpY + 1, (barW - 2) * hpPct, (barH - 2) / 2);
  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 2;
  ctx.fillText(`❤ ${character.health}/${character.max_health}`, hudX + padding + 4, hpY + 11);
  ctx.shadowBlur = 0;

  // Mana bar
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

  // Gold and biome row
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

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
  canvasHeight: number
) {
  const startTileX = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
  const startTileY = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 1);
  const endTileX = Math.min(map.width, Math.ceil((cameraX + canvasWidth) / TILE_SIZE) + 1);
  const endTileY = Math.min(map.height, Math.ceil((cameraY + canvasHeight) / TILE_SIZE) + 1);

  for (let y = startTileY; y < endTileY; y++) {
    for (let x = startTileX; x < endTileX; x++) {
      const tile = map.tiles[y]?.[x] ?? TileType.EMPTY;
      const tileCanvas = getCachedTile(tile);
      ctx.drawImage(
        tileCanvas,
        x * TILE_SIZE - cameraX,
        y * TILE_SIZE - cameraY
      );
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
  minimapSize: number = 150
) {
  const mx = canvasWidth - minimapSize - 12;
  const my = 12;
  const scaleX = minimapSize / map.width;
  const scaleY = minimapSize / map.height;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(mx - 2, my - 2, minimapSize + 4, minimapSize + 4);

  // Biome colors
  const biomeColors: Record<string, string> = {
    caatinga: '#c2a645',
    agreste: '#4a7c3f',
    litoral: '#2d6a9f',
    santa_cruz: '#8b7355',
  };

  // Draw biome regions
  ctx.fillStyle = biomeColors.caatinga;
  ctx.fillRect(mx, my, minimapSize / 2, minimapSize / 2);
  ctx.fillStyle = biomeColors.agreste;
  ctx.fillRect(mx + minimapSize / 2, my, minimapSize / 2, minimapSize / 2);
  ctx.fillStyle = biomeColors.litoral;
  ctx.fillRect(mx, my + minimapSize / 2, minimapSize / 2, minimapSize / 2);
  ctx.fillStyle = biomeColors.santa_cruz;
  ctx.fillRect(mx + minimapSize / 2, my + minimapSize / 2, minimapSize / 2, minimapSize / 2);

  // Player dot
  ctx.fillStyle = '#ff0000';
  const px = mx + playerX * scaleX;
  const py = my + playerY * scaleY;
  ctx.fillRect(px - 2, py - 2, 5, 5);

  // Border
  ctx.strokeStyle = 'hsl(35, 75%, 55%)';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx - 2, my - 2, minimapSize + 4, minimapSize + 4);

  // Labels
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Caatinga', mx + minimapSize / 4, my + 12);
  ctx.fillText('Agreste', mx + 3 * minimapSize / 4, my + 12);
  ctx.fillText('Litoral', mx + minimapSize / 4, my + minimapSize / 2 + 12);
  ctx.fillText('S. Cruz', mx + 3 * minimapSize / 4, my + minimapSize / 2 + 12);
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
  // HUD background
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(8, 8, 220, 90);
  ctx.strokeStyle = 'hsl(35, 75%, 55%)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 220, 90);

  // Name & level
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`${character.name} (Nv.${character.level})`, 16, 26);

  // Health bar
  ctx.fillStyle = '#333';
  ctx.fillRect(16, 34, 180, 12);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(16, 34, 180 * (character.health / character.max_health), 12);
  ctx.fillStyle = '#fff';
  ctx.font = '9px monospace';
  ctx.fillText(`❤ ${character.health}/${character.max_health}`, 18, 44);

  // Mana bar
  ctx.fillStyle = '#333';
  ctx.fillRect(16, 50, 180, 12);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(16, 50, 180 * (character.mana / character.max_mana), 12);
  ctx.fillStyle = '#fff';
  ctx.fillText(`💧 ${character.mana}/${character.max_mana}`, 18, 60);

  // Gold
  ctx.fillStyle = '#f1c40f';
  ctx.font = '10px monospace';
  ctx.fillText(`🪙 ${character.gold}`, 16, 78);

  // Biome
  ctx.fillStyle = '#aaa';
  ctx.fillText(`📍 ${character.current_biome}`, 100, 78);

  // Controls help (bottom)
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(8, canvasWidth > 600 ? canvasWidth - 40 : 480 - 32, 300, 22);
  // We render at bottom of canvas height, let's use a fixed position
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

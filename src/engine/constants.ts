// Game engine constants
export const TILE_SIZE = 32;
export const PLAYER_SIZE = 28;
export const CAMERA_LERP = 0.1;

// Map dimensions in tiles
export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 60;

// Biome tile types
export enum TileType {
  EMPTY = 0,
  GRASS = 1,
  SAND = 2,
  WATER = 3,
  STONE = 4,
  TREE = 5,
  CACTUS = 6,
  BUSH = 7,
  FLOWER = 8,
  PATH = 9,
  BUILDING = 10,
  DOOR = 11,
  BRIDGE = 12,
  CORAL = 13,
  PALM = 14,
  ROCK = 15,
}

// Tile colors per type
export const TILE_COLORS: Record<TileType, string> = {
  [TileType.EMPTY]: '#1a1a2e',
  [TileType.GRASS]: '#4a7c3f',
  [TileType.SAND]: '#c2a645',
  [TileType.WATER]: '#2d6a9f',
  [TileType.STONE]: '#6b6b6b',
  [TileType.TREE]: '#2d5a27',
  [TileType.CACTUS]: '#5a8a3a',
  [TileType.BUSH]: '#3d6b33',
  [TileType.FLOWER]: '#4a7c3f',
  [TileType.PATH]: '#b5a06b',
  [TileType.BUILDING]: '#8b7355',
  [TileType.DOOR]: '#6b4226',
  [TileType.BRIDGE]: '#9b8b6b',
  [TileType.CORAL]: '#e06050',
  [TileType.PALM]: '#3b7a30',
  [TileType.ROCK]: '#555555',
};

// Tile detail colors (for pixel art depth)
export const TILE_DETAIL_COLORS: Record<TileType, string | null> = {
  [TileType.EMPTY]: null,
  [TileType.GRASS]: '#5a9c4f',
  [TileType.SAND]: '#d4b855',
  [TileType.WATER]: '#3d8abf',
  [TileType.STONE]: '#7b7b7b',
  [TileType.TREE]: '#1d4a17',
  [TileType.CACTUS]: '#4a7a2a',
  [TileType.BUSH]: '#2d5b23',
  [TileType.FLOWER]: '#e05080',
  [TileType.PATH]: '#a59055',
  [TileType.BUILDING]: '#7b6345',
  [TileType.DOOR]: '#5b3216',
  [TileType.BRIDGE]: '#8b7b5b',
  [TileType.CORAL]: '#ff7060',
  [TileType.PALM]: '#2b6a20',
  [TileType.ROCK]: '#454545',
};

// Player sprite colors by class
export const CLASS_COLORS: Record<string, { body: string; accent: string; skin: string }> = {
  warrior: { body: '#c0392b', accent: '#e74c3c', skin: '#f5cba7' },
  mage: { body: '#2980b9', accent: '#3498db', skin: '#f5cba7' },
  archer: { body: '#27ae60', accent: '#2ecc71', skin: '#f5cba7' },
  healer: { body: '#f39c12', accent: '#f1c40f', skin: '#f5cba7' },
  assassin: { body: '#8e44ad', accent: '#9b59b6', skin: '#f5cba7' },
  guerreiro: { body: '#c0392b', accent: '#e74c3c', skin: '#f5cba7' },
  mago: { body: '#2980b9', accent: '#3498db', skin: '#f5cba7' },
  ladino: { body: '#8e44ad', accent: '#9b59b6', skin: '#f5cba7' },
  clerigo: { body: '#f39c12', accent: '#f1c40f', skin: '#f5cba7' },
};

// Creature sprite colors by rarity
export const RARITY_SPRITE_COLORS: Record<string, { body: string; accent: string }> = {
  common: { body: '#7f8c8d', accent: '#95a5a6' },
  uncommon: { body: '#27ae60', accent: '#2ecc71' },
  rare: { body: '#2980b9', accent: '#3498db' },
  epic: { body: '#8e44ad', accent: '#9b59b6' },
  legendary: { body: '#f39c12', accent: '#f1c40f' },
};

// Directions
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

// Animation frames
export const WALK_SPEED = 3;
export const ANIMATION_FRAME_DURATION = 150; // ms per frame

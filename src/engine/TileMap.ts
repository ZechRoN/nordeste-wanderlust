import { TileType, MAP_WIDTH, MAP_HEIGHT } from './constants';

// Seeded random for deterministic maps
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Simple noise function
function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number, scale: number): number {
  const sx = x / scale;
  const sy = y / scale;
  const ix = Math.floor(sx);
  const iy = Math.floor(sy);
  const fx = sx - ix;
  const fy = sy - iy;
  
  const a = noise2D(ix, iy, seed);
  const b = noise2D(ix + 1, iy, seed);
  const c = noise2D(ix, iy + 1, seed);
  const d = noise2D(ix + 1, iy + 1, seed);
  
  const top = a + (b - a) * fx;
  const bottom = c + (d - c) * fx;
  return top + (bottom - top) * fy;
}

// Biome map regions
interface BiomeRegion {
  biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const BIOME_REGIONS: BiomeRegion[] = [
  { biome: 'caatinga', startX: 0, startY: 0, endX: 40, endY: 30 },
  { biome: 'agreste', startX: 40, startY: 0, endX: 80, endY: 30 },
  { biome: 'litoral', startX: 0, startY: 30, endX: 40, endY: 60 },
  { biome: 'santa_cruz', startX: 40, startY: 30, endX: 80, endY: 60 },
];

export function getBiomeAt(x: number, y: number): 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz' {
  for (const region of BIOME_REGIONS) {
    if (x >= region.startX && x < region.endX && y >= region.startY && y < region.endY) {
      return region.biome;
    }
  }
  return 'caatinga';
}

export function getBiomeSpawnPoint(biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz'): { x: number; y: number } {
  const region = BIOME_REGIONS.find(r => r.biome === biome)!;
  return {
    x: Math.floor((region.startX + region.endX) / 2),
    y: Math.floor((region.startY + region.endY) / 2),
  };
}

function generateBiomeTiles(
  biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz',
  x: number, y: number, seed: number
): TileType {
  const n1 = smoothNoise(x, y, seed, 8);
  const n2 = smoothNoise(x, y, seed + 100, 4);
  const n3 = smoothNoise(x, y, seed + 200, 12);
  
  switch (biome) {
    case 'caatinga':
      if (n1 > 0.85) return TileType.CACTUS;
      if (n1 > 0.78) return TileType.ROCK;
      if (n2 > 0.8) return TileType.BUSH;
      if (n3 > 0.7 && n1 < 0.3) return TileType.PATH;
      return TileType.SAND;
      
    case 'agreste':
      if (n1 > 0.82) return TileType.TREE;
      if (n1 > 0.75) return TileType.BUSH;
      if (n2 > 0.85) return TileType.FLOWER;
      if (n2 > 0.78) return TileType.ROCK;
      if (n3 > 0.7 && n1 < 0.3) return TileType.PATH;
      return TileType.GRASS;
      
    case 'litoral':
      if (n1 > 0.8) return TileType.WATER;
      if (n1 > 0.72) return TileType.CORAL;
      if (n2 > 0.82) return TileType.PALM;
      if (n2 > 0.75) return TileType.ROCK;
      if (n3 > 0.65 && n1 < 0.4) return TileType.WATER;
      if (n1 < 0.25) return TileType.WATER;
      return TileType.SAND;
      
    case 'santa_cruz':
      if (n1 > 0.85) return TileType.BUILDING;
      if (n1 > 0.8) return TileType.STONE;
      if (n2 > 0.82) return TileType.TREE;
      if (n3 > 0.6 && n1 < 0.4) return TileType.PATH;
      if (n1 < 0.15) return TileType.PATH;
      return TileType.GRASS;
      
    default:
      return TileType.GRASS;
  }
}

export interface TileMapData {
  tiles: TileType[][];
  width: number;
  height: number;
}

export function generateTileMap(seed: number = 42): TileMapData {
  const tiles: TileType[][] = [];
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      const biome = getBiomeAt(x, y);
      tiles[y][x] = generateBiomeTiles(biome, x, y, seed);
    }
  }
  
  // Add biome border transitions (paths between biomes)
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      // Horizontal border
      if (x === 39 || x === 40) {
        if (y % 3 !== 0) tiles[y][x] = TileType.PATH;
      }
      // Vertical border  
      if (y === 29 || y === 30) {
        if (x % 3 !== 0) tiles[y][x] = TileType.PATH;
      }
    }
  }
  
  return { tiles, width: MAP_WIDTH, height: MAP_HEIGHT };
}

// Check if a tile is walkable
export function isWalkable(tile: TileType): boolean {
  return tile !== TileType.WATER && 
         tile !== TileType.TREE && 
         tile !== TileType.CACTUS && 
         tile !== TileType.BUILDING &&
         tile !== TileType.ROCK &&
         tile !== TileType.PALM;
}

// Points of interest on the map
export interface MapPOI {
  x: number;
  y: number;
  name: string;
  type: 'npc' | 'creature' | 'shop' | 'quest' | 'rest';
  biome: string;
  emoji: string;
}

export function getMapPOIs(): MapPOI[] {
  return [
    // Caatinga POIs
    { x: 10, y: 8, name: 'Velho Sertanejo', type: 'npc', biome: 'caatinga', emoji: '👴' },
    { x: 20, y: 12, name: 'Ninho do Tatu', type: 'creature', biome: 'caatinga', emoji: '🐾' },
    { x: 15, y: 5, name: 'Barraca do Mercador', type: 'shop', biome: 'caatinga', emoji: '🏪' },
    { x: 25, y: 18, name: 'Fogueira', type: 'rest', biome: 'caatinga', emoji: '🔥' },
    { x: 30, y: 10, name: 'Missão: Caça ao Tatu', type: 'quest', biome: 'caatinga', emoji: '❗' },
    
    // Agreste POIs
    { x: 55, y: 8, name: 'Curandeira', type: 'npc', biome: 'agreste', emoji: '🧙‍♀️' },
    { x: 50, y: 15, name: 'Toca da Capivara', type: 'creature', biome: 'agreste', emoji: '🐾' },
    { x: 65, y: 12, name: 'Feira do Agreste', type: 'shop', biome: 'agreste', emoji: '🏪' },
    { x: 60, y: 20, name: 'Cabana', type: 'rest', biome: 'agreste', emoji: '🏠' },
    { x: 70, y: 8, name: 'Missão: Ervas Medicinais', type: 'quest', biome: 'agreste', emoji: '❗' },
    
    // Litoral POIs
    { x: 10, y: 42, name: 'Pescador', type: 'npc', biome: 'litoral', emoji: '🎣' },
    { x: 20, y: 45, name: 'Recife de Corais', type: 'creature', biome: 'litoral', emoji: '🐾' },
    { x: 15, y: 38, name: 'Mercado de Peixes', type: 'shop', biome: 'litoral', emoji: '🏪' },
    { x: 30, y: 50, name: 'Rede na Praia', type: 'rest', biome: 'litoral', emoji: '🏖️' },
    { x: 25, y: 40, name: 'Missão: Tesouro Marinho', type: 'quest', biome: 'litoral', emoji: '❗' },
    
    // Santa Cruz POIs
    { x: 55, y: 42, name: 'Prefeito', type: 'npc', biome: 'santa_cruz', emoji: '🎩' },
    { x: 65, y: 45, name: 'Rato de Esgoto', type: 'creature', biome: 'santa_cruz', emoji: '🐾' },
    { x: 60, y: 38, name: 'Loja Central', type: 'shop', biome: 'santa_cruz', emoji: '🏪' },
    { x: 50, y: 50, name: 'Pousada', type: 'rest', biome: 'santa_cruz', emoji: '🏨' },
    { x: 70, y: 48, name: 'Missão: Ordem na Cidade', type: 'quest', biome: 'santa_cruz', emoji: '❗' },
  ];
}

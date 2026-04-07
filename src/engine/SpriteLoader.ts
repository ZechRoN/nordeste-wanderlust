// Sprite sheet loader and frame extractor
const imageCache = new Map<string, HTMLImageElement>();
const loadPromises = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  if (loadPromises.has(src)) return loadPromises.get(src)!;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
  loadPromises.set(src, promise);
  return promise;
}

export function getImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null;
}

// Sprite sheet definition
export interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
}

export function getSpriteSheet(src: string, frameW: number, frameH: number): SpriteSheet | null {
  const img = getImage(src);
  if (!img) return null;
  return {
    image: img,
    frameWidth: frameW,
    frameHeight: frameH,
    columns: Math.floor(img.width / frameW),
    rows: Math.floor(img.height / frameH),
  };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  col: number,
  row: number,
  dx: number, dy: number,
  dw: number, dh: number
) {
  ctx.drawImage(
    sheet.image,
    col * sheet.frameWidth,
    row * sheet.frameHeight,
    sheet.frameWidth,
    sheet.frameHeight,
    dx, dy, dw, dh
  );
}

// Character sprite paths mapped by class
export const CHARACTER_SPRITE_PATHS: Record<string, string> = {
  warrior: '/sprites/characters/warrior.png',
  guerreiro: '/sprites/characters/warrior.png',
  mage: '/sprites/characters/mage.png',
  mago: '/sprites/characters/mage.png',
  archer: '/sprites/characters/archer.png',
  healer: '/sprites/characters/healer.png',
  clerigo: '/sprites/characters/healer.png',
  assassin: '/sprites/characters/assassin.png',
  ladino: '/sprites/characters/assassin.png',
};

// Character sprite sheets are 80x192 (5 cols x 12 rows) for melee, 
// 96x128 (6 cols x 8 rows) for ranged classes
// MiniWorld format: each row is a direction/action, each col is a frame
export const CHARACTER_FRAME_SIZE: Record<string, { w: number; h: number }> = {
  warrior: { w: 16, h: 16 },
  guerreiro: { w: 16, h: 16 },
  mage: { w: 16, h: 16 },
  mago: { w: 16, h: 16 },
  archer: { w: 16, h: 16 },
  healer: { w: 16, h: 16 },
  clerigo: { w: 16, h: 16 },
  assassin: { w: 16, h: 16 },
  ladino: { w: 16, h: 16 },
};

// Direction to sprite row mapping (MiniWorld format)
// Row 0: idle down, Row 1: walk down, Row 2: idle right, Row 3: walk right, etc.
export const DIRECTION_ROW: Record<string, number> = {
  down: 0,
  right: 2,
  up: 4,
  left: 6,
};

export const DIRECTION_WALK_ROW: Record<string, number> = {
  down: 1,
  right: 3,
  up: 5,
  left: 7,
};

// Monster sprite paths
export const MONSTER_SPRITE_PATHS: Record<string, string> = {
  slime: '/sprites/monsters/slime.png',
  slime_blue: '/sprites/monsters/slime_blue.png',
  orc: '/sprites/monsters/orc.png',
  goblin: '/sprites/monsters/goblin.png',
  skeleton: '/sprites/monsters/skeleton.png',
  dragon: '/sprites/monsters/dragon_red.png',
  demon: '/sprites/monsters/demon.png',
  minotaur: '/sprites/monsters/minotaur.png',
  necromancer: '/sprites/monsters/necromancer.png',
  yeti: '/sprites/monsters/yeti.png',
  pirate: '/sprites/monsters/pirate.png',
  giant_crab: '/sprites/monsters/giant_crab.png',
};

// Map monster name keywords to sprite keys
export function getMonsterSpriteKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('slime') || lower.includes('gosma')) return 'slime';
  if (lower.includes('dragão') || lower.includes('dragon') || lower.includes('dragao')) return 'dragon';
  if (lower.includes('demônio') || lower.includes('demon') || lower.includes('demonio')) return 'demon';
  if (lower.includes('orc')) return 'orc';
  if (lower.includes('goblin') || lower.includes('duende')) return 'goblin';
  if (lower.includes('esqueleto') || lower.includes('skeleton')) return 'skeleton';
  if (lower.includes('minotauro') || lower.includes('minotaur')) return 'minotaur';
  if (lower.includes('necro')) return 'necromancer';
  if (lower.includes('yeti') || lower.includes('gelo')) return 'yeti';
  if (lower.includes('pirata') || lower.includes('pirate')) return 'pirate';
  if (lower.includes('caranguejo') || lower.includes('crab')) return 'giant_crab';
  // Rarity-based fallback
  return 'slime';
}

export function getMonsterSpriteByRarity(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'dragon';
    case 'epic': return 'demon';
    case 'rare': return 'orc';
    case 'uncommon': return 'goblin';
    default: return 'slime';
  }
}

// Tile sprite paths
export const TILE_SPRITE_PATHS = {
  grass: '/sprites/tiles/grass_middle.png',
  water: '/sprites/tiles/water_middle.png',
  sand: '/sprites/tiles/beach_tile.png',
  path: '/sprites/tiles/path_middle.png',
};

// Nature/object sprite paths  
export const NATURE_SPRITE_PATHS = {
  trees: '/sprites/nature/trees.png',
  oak_tree: '/sprites/nature/oak_tree.png',
  coconut: '/sprites/nature/coconut_trees.png',
  cactus: '/sprites/nature/cactus.png',
  rocks: '/sprites/nature/rocks.png',
};

// Preload all sprites
export async function preloadAllSprites(): Promise<void> {
  const allPaths = [
    ...Object.values(CHARACTER_SPRITE_PATHS),
    ...Object.values(MONSTER_SPRITE_PATHS),
    ...Object.values(TILE_SPRITE_PATHS),
    ...Object.values(NATURE_SPRITE_PATHS),
  ];
  // Deduplicate
  const unique = [...new Set(allPaths)];
  await Promise.allSettled(unique.map(p => loadImage(p)));
}

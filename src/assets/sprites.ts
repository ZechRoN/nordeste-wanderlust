// Sprite constants for pixel art game
export const SPRITE_SIZES = {
  TILE: 32,
  CHARACTER: 32,
  ITEM: 24,
  UI: 16,
} as const;

// Character sprite mappings
export const CHARACTER_SPRITES = {
  warrior: '⚔️',
  mage: '🧙‍♀️',
  archer: '🏹',
  healer: '💚',
  assassin: '🗡️',
} as const;

// Biome sprite mappings
export const BIOME_SPRITES = {
  caatinga: '🌵',
  agreste: '🌾',
  litoral: '🏖️',
  santa_cruz: '🏛️',
} as const;

// Item type sprites
export const ITEM_SPRITES = {
  weapon: '⚔️',
  armor: '🛡️',
  consumable: '🧪',
  material: '💎',
  mount: '🐎',
} as const;

// Rarity colors (pixel art style)
export const RARITY_COLORS = {
  common: '#9CA3AF',     // Gray
  uncommon: '#10B981',   // Green
  rare: '#3B82F6',       // Blue
  epic: '#8B5CF6',       // Purple
  legendary: '#F59E0B',  // Golden
} as const;

// UI sprites and icons
export const UI_SPRITES = {
  health: '❤️',
  mana: '💙',
  gold: '🪙',
  experience: '⭐',
  level: '🔥',
  attack: '⚔️',
  defense: '🛡️',
  speed: '💨',
  location: '📍',
} as const;
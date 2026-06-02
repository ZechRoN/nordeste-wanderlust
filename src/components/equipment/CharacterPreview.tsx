import { motion } from 'framer-motion';
import { Div } from '@/components/ui/Div';

interface CharacterItem {
  id: string;
  item: {
    name: string; rarity: string; equipment_slot: string | null; subtype: string | null;
  };
}

interface CharacterPreviewProps {
  characterClass: string;
  equipped: Record<string, CharacterItem>;
}

const CLASS_SPRITES: Record<string, string> = {
  warrior: '/sprites/characters/warrior.png',
  mage: '/sprites/characters/mage.png',
  archer: '/sprites/characters/archer.png',
  healer: '/sprites/characters/healer.png',
  assassin: '/sprites/characters/assassin.png',
};

// Item visual per equipment slot
const SLOT_GLYPH: Record<string, string> = {
  helmet: '🪖',
  chest: '🛡️',
  legs: '👖',
  gloves: '🧤',
  boots: '👢',
  main_hand: '⚔️',
  off_hand: '🛡️',
};

export function CharacterPreview({ characterClass, equipped }: CharacterPreviewProps) {
  const spriteUrl = CLASS_SPRITES[characterClass] || CLASS_SPRITES.warrior;
  const equippedSlots = Object.keys(equipped);

  return (
    <Div className="equip-char-preview" style={{ position: 'relative' }}>
      {/* Character sprite — first idle frame (16x16) scaled up */}
      <motion.div
        className="equip-char-body"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage: `url(${spriteUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          backgroundSize: 'auto',
          imageRendering: 'pixelated',
          // scale the first 16x16 frame to 64x64
          transform: 'scale(4)',
          transformOrigin: 'top left',
          width: 16,
          height: 16,
          marginLeft: 32,
          marginTop: 16,
        }}
        aria-label={`Sprite ${characterClass}`}
      />

      {/* Equipment overlays positioned anatomically */}
      <Div
        className="equip-char-overlays"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {equipped.helmet && (
          <motion.span
            key="helm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 18, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }}
          >{SLOT_GLYPH.helmet}</motion.span>
        )}
        {equipped.chest && (
          <motion.span
            key="chest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.6))' }}
          >🦺</motion.span>
        )}
        {equipped.legs && (
          <motion.span
            key="legs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', fontSize: 16 }}
          >{SLOT_GLYPH.legs}</motion.span>
        )}
        {equipped.gloves && (
          <motion.span
            key="gloves"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'absolute', top: '48%', left: 10, fontSize: 14 }}
          >{SLOT_GLYPH.gloves}</motion.span>
        )}
        {equipped.boots && (
          <motion.span
            key="boots"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', fontSize: 14 }}
          >{SLOT_GLYPH.boots}</motion.span>
        )}
        {equipped.main_hand && (
          <motion.span
            key="weapon"
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: -15, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ position: 'absolute', top: '38%', right: 8, fontSize: 22, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}
          >⚔️</motion.span>
        )}
        {equipped.off_hand && (
          <motion.span
            key="offhand"
            initial={{ rotate: 45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ position: 'absolute', top: '40%', left: 8, fontSize: 20, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}
          >🛡️</motion.span>
        )}
      </Div>

      {/* Equipped count indicator */}
      <Div className="equip-char-count">
        {equippedSlots.length}/7
      </Div>
    </Div>
  );
}

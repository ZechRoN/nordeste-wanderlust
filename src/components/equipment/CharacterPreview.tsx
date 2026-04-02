import { useMemo } from 'react';
import { motion } from 'framer-motion';

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

const CLASS_SPRITES: Record<string, { body: string; color: string }> = {
  warrior: { body: '🗡️', color: '#C0392B' },
  mage: { body: '🧙', color: '#8E44AD' },
  archer: { body: '🏹', color: '#27AE60' },
  healer: { body: '💚', color: '#2ECC71' },
  assassin: { body: '🥷', color: '#2C3E50' },
};

const EQUIPMENT_VISUALS: Record<string, string> = {
  helmet: '👑', chest: '🛡️', legs: '👖', gloves: '🧤', boots: '👢',
  main_hand: '⚔️', off_hand: '🔮',
};

export function CharacterPreview({ characterClass, equipped }: CharacterPreviewProps) {
  const classInfo = CLASS_SPRITES[characterClass] || CLASS_SPRITES.warrior;
  const equippedSlots = Object.keys(equipped);

  return (
    <div className="equip-char-preview">
      {/* Base body layer */}
      <motion.div
        className="equip-char-body"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-4xl">{classInfo.body}</span>
      </motion.div>

      {/* Equipment overlays */}
      <div className="equip-char-overlays">
        {equipped.helmet && (
          <motion.span
            key="helm"
            className="equip-overlay-helm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >👑</motion.span>
        )}
        {equipped.main_hand && (
          <motion.span
            key="weapon"
            className="equip-overlay-weapon"
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >⚔️</motion.span>
        )}
        {equipped.off_hand && (
          <motion.span
            key="offhand"
            className="equip-overlay-offhand"
            initial={{ rotate: 45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >🔮</motion.span>
        )}
        {equipped.chest && (
          <motion.span
            key="chest"
            className="equip-overlay-chest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          >🛡️</motion.span>
        )}
        {equipped.boots && (
          <motion.span
            key="boots"
            className="equip-overlay-boots"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >👢</motion.span>
        )}
      </div>

      {/* Equipped count indicator */}
      <div className="equip-char-count">
        {equippedSlots.length}/7
      </div>
    </div>
  );
}

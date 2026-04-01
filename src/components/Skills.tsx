import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameButton } from '@/components/ui/game-panel';

interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  manaCost: number;
  cooldown: number; // turns
  damageMultiplier: number;
  effect?: 'heal' | 'burn' | 'stun' | 'bleed' | 'buff';
  effectValue?: number;
}

const CLASS_SKILLS: Record<string, Skill[]> = {
  warrior: [
    { id: 'w1', name: 'Golpe Brutal', description: 'Ataque devastador com 2x de dano', icon: '⚔️', manaCost: 15, cooldown: 2, damageMultiplier: 2.0 },
    { id: 'w2', name: 'Grito de Guerra', description: '+30% força por 3 turnos', icon: '📢', manaCost: 20, cooldown: 4, damageMultiplier: 0, effect: 'buff', effectValue: 30 },
    { id: 'w3', name: 'Esmagar', description: 'Ataque com chance de atordoar', icon: '🔨', manaCost: 25, cooldown: 3, damageMultiplier: 1.5, effect: 'stun', effectValue: 1 },
    { id: 'w4', name: 'Fúria do Sertão', description: 'Ataque massivo com 3x de dano', icon: '🌪️', manaCost: 40, cooldown: 5, damageMultiplier: 3.0 },
  ],
  mage: [
    { id: 'm1', name: 'Bola de Fogo', description: 'Projetil flamejante com queimadura', icon: '🔥', manaCost: 15, cooldown: 1, damageMultiplier: 1.8, effect: 'burn', effectValue: 5 },
    { id: 'm2', name: 'Raio Arcano', description: 'Raio mágico de alto dano', icon: '⚡', manaCost: 25, cooldown: 2, damageMultiplier: 2.5 },
    { id: 'm3', name: 'Cura Mística', description: 'Restaura 40% da vida máxima', icon: '💚', manaCost: 30, cooldown: 4, damageMultiplier: 0, effect: 'heal', effectValue: 40 },
    { id: 'm4', name: 'Tempestade de Gelo', description: 'Ataque área com atordoamento', icon: '❄️', manaCost: 45, cooldown: 5, damageMultiplier: 2.0, effect: 'stun', effectValue: 2 },
  ],
  archer: [
    { id: 'a1', name: 'Flecha Envenenada', description: 'Flecha com veneno sangrante', icon: '🏹', manaCost: 12, cooldown: 1, damageMultiplier: 1.5, effect: 'bleed', effectValue: 3 },
    { id: 'a2', name: 'Tiro Certeiro', description: 'Acerto crítico garantido', icon: '🎯', manaCost: 20, cooldown: 3, damageMultiplier: 2.5 },
    { id: 'a3', name: 'Chuva de Flechas', description: 'Múltiplas flechas de alto dano', icon: '🌧️', manaCost: 35, cooldown: 4, damageMultiplier: 2.0 },
    { id: 'a4', name: 'Emboscada', description: '+50% dano no próximo ataque', icon: '🥷', manaCost: 15, cooldown: 3, damageMultiplier: 0, effect: 'buff', effectValue: 50 },
  ],
  healer: [
    { id: 'h1', name: 'Cura Divina', description: 'Restaura 50% da vida', icon: '✨', manaCost: 20, cooldown: 2, damageMultiplier: 0, effect: 'heal', effectValue: 50 },
    { id: 'h2', name: 'Luz Sagrada', description: 'Dano sagrado ao inimigo', icon: '☀️', manaCost: 15, cooldown: 1, damageMultiplier: 1.8 },
    { id: 'h3', name: 'Barreira', description: '+40% defesa por 3 turnos', icon: '🛡️', manaCost: 25, cooldown: 4, damageMultiplier: 0, effect: 'buff', effectValue: 40 },
    { id: 'h4', name: 'Ressurgência', description: 'Restaura 80% de vida e mana', icon: '🌟', manaCost: 50, cooldown: 6, damageMultiplier: 0, effect: 'heal', effectValue: 80 },
  ],
  assassin: [
    { id: 's1', name: 'Golpe Furtivo', description: 'Ataque com 2.5x de dano', icon: '🗡️', manaCost: 15, cooldown: 2, damageMultiplier: 2.5 },
    { id: 's2', name: 'Veneno Mortal', description: 'Envenena causando dano contínuo', icon: '☠️', manaCost: 20, cooldown: 3, damageMultiplier: 1.0, effect: 'bleed', effectValue: 8 },
    { id: 's3', name: 'Sombras', description: '+40% evasão por 2 turnos', icon: '👥', manaCost: 18, cooldown: 3, damageMultiplier: 0, effect: 'buff', effectValue: 40 },
    { id: 's4', name: 'Execução', description: '4x dano em alvos com <30% HP', icon: '💀', manaCost: 40, cooldown: 5, damageMultiplier: 4.0 },
  ],
};

interface SkillBarProps {
  characterClass: string;
  mana: number;
  isPlayerTurn: boolean;
  onUseSkill: (skill: Skill) => void;
  cooldowns: Record<string, number>;
}

export function SkillBar({ characterClass, mana, isPlayerTurn, onUseSkill, cooldowns }: SkillBarProps) {
  const skills = CLASS_SKILLS[characterClass] || CLASS_SKILLS.warrior;

  return (
    <div className="flex gap-1 justify-center flex-wrap">
      {skills.map((skill, i) => {
        const cd = cooldowns[skill.id] || 0;
        const canUse = isPlayerTurn && mana >= skill.manaCost && cd === 0;

        return (
          <div key={skill.id} className="relative group">
            <GameButton
              size="sm"
              variant={canUse ? 'gold' : 'secondary'}
              onClick={() => canUse && onUseSkill(skill)}
              disabled={!canUse}
              className="relative"
            >
              <span className="text-base">{skill.icon}</span>
              {cd > 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/70 rounded text-[10px] font-bold">
                  {cd}
                </span>
              )}
            </GameButton>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 w-36 pointer-events-none">
              <div className="rpg-item-detail !p-2 text-[10px]">
                <div className="font-bold pixel-text text-xs">{skill.icon} {skill.name}</div>
                <p className="opacity-70 mt-0.5">{skill.description}</p>
                <div className="flex gap-2 mt-1">
                  <span>💧 {skill.manaCost}</span>
                  <span>⏱ {skill.cooldown} turnos</span>
                </div>
                <span className="opacity-40">Tecla {i + 4}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Skill visual effect overlay
export function SkillEffect({ skillId, onComplete }: { skillId: string; onComplete: () => void }) {
  const effects: Record<string, { color: string; icon: string }> = {
    burn: { color: '#FF6B35', icon: '🔥' },
    stun: { color: '#FFD700', icon: '⚡' },
    bleed: { color: '#DC2626', icon: '🩸' },
    heal: { color: '#22C55E', icon: '💚' },
    buff: { color: '#3B82F6', icon: '⬆️' },
  };

  // Find the skill effect type
  let effectType = '';
  Object.values(CLASS_SKILLS).forEach(skills => {
    const s = skills.find(sk => sk.id === skillId);
    if (s?.effect) effectType = s.effect;
  });

  const eff = effects[effectType] || { color: '#FFD700', icon: '✦' };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        onAnimationComplete={onComplete}
      >
        <span className="text-4xl" style={{ filter: `drop-shadow(0 0 12px ${eff.color})` }}>{eff.icon}</span>
      </motion.div>
    </AnimatePresence>
  );
}

export { CLASS_SKILLS };
export type { Skill };

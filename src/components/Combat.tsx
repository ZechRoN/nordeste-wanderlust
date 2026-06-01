import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Heart, Zap, Shield, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionFeedback } from './ActionFeedback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { SFX } from '@/hooks/useGameAudio';
import { GamePanel, GameButton } from '@/components/ui/game-panel';
import { SkillBar, SkillEffect, CLASS_SKILLS } from './Skills';
import type { Skill } from './Skills';
import { Div } from '@/components/ui/Div';
import { CombatCanvas } from './CombatCanvas';

interface Character {
  id: string; name: string; class: string; level: number;
  health: number; max_health: number; mana: number; max_mana: number;
  strength: number; agility: number; intelligence: number; vitality: number; luck: number;
  experience: number; gold: number;
}

interface Creature {
  id: string; name: string; description: string; level: number;
  health: number; max_health: number;
  strength: number; agility: number; intelligence: number; vitality: number; luck: number;
  experience_reward: number; gold_reward: number; rarity: string; special_ability: string;
}

interface CombatProps {
  character: Character;
  creature: Creature;
  onCombatEnd: (victory: boolean, updatedCharacter?: any) => void;
}

type CombatAction = 'attack' | 'defend' | 'special';
interface DamageResult { damage: number; isCritical: boolean; isMiss: boolean; }

export function Combat({ character, creature, onCombatEnd }: CombatProps) {
  const [playerHealth, setPlayerHealth] = useState(character.health);
  const [playerMana, setPlayerMana] = useState(character.mana);
  const [creatureHealth, setCreatureHealth] = useState(creature.health);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isDefending, setIsDefending] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; text: string; type: 'damage' | 'heal' | 'critical' | 'miss' | 'levelup' }>({
    show: false, text: '', type: 'damage'
  });
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});
  const [activeSkillEffect, setActiveSkillEffect] = useState<string | null>(null);
  const [petBonuses, setPetBonuses] = useState({ strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 });

  // Animation states
  const [playerShake, setPlayerShake] = useState(false);
  const [creatureShake, setCreatureShake] = useState(false);
  const [playerFlash, setPlayerFlash] = useState(false);
  const [creatureFlash, setCreatureFlash] = useState(false);
  const [creatureDead, setCreatureDead] = useState(false);
  const [playerDead, setPlayerDead] = useState(false);
  const [playerAttacking, setPlayerAttacking] = useState(false);

  const { updateKillProgress } = useQuestProgress();

  // Load pet bonuses
  useEffect(() => {
    const loadPet = async () => {
      const { data } = await supabase
        .from('character_pets')
        .select('*, pet:pets(*)')
        .eq('character_id', character.id)
        .eq('is_active', true)
        .maybeSingle();
      if (data?.pet) {
        setPetBonuses({
          strength: data.pet.strength_bonus,
          agility: data.pet.agility_bonus,
          intelligence: data.pet.intelligence_bonus,
          vitality: data.pet.vitality_bonus,
          luck: data.pet.luck_bonus,
        });
      }
    };
    loadPet();
  }, [character.id]);

  useKeyboardShortcuts(isPlayerTurn && playerHealth > 0 && creatureHealth > 0, {
    attack: () => playerAttack('attack'),
    defend: () => playerAttack('defend'),
    special: () => playerAttack('special')
  });

  const addToCombatLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-4), message]);
  };

  const triggerShake = (target: 'player' | 'creature', isCritical: boolean) => {
    if (target === 'player') {
      setPlayerShake(true);
      if (isCritical) setPlayerFlash(true);
      setTimeout(() => { setPlayerShake(false); setPlayerFlash(false); }, 500);
    } else {
      setCreatureShake(true);
      if (isCritical) setCreatureFlash(true);
      setTimeout(() => { setCreatureShake(false); setCreatureFlash(false); }, 500);
    }
  };

  const calculateDamage = (attacker: any, defender: any, isSpecial = false, multiplier = 1): DamageResult => {
    const atkStr = attacker === character ? attacker.strength + petBonuses.strength : attacker.strength;
    const atkInt = attacker === character ? attacker.intelligence + petBonuses.intelligence : attacker.intelligence;
    const atkLuck = attacker === character ? attacker.luck + petBonuses.luck : attacker.luck;
    const atkAgi = attacker === character ? attacker.agility + petBonuses.agility : attacker.agility;
    const defVit = defender === character ? defender.vitality + petBonuses.vitality : defender.vitality;
    const defAgi = defender === character ? defender.agility + petBonuses.agility : defender.agility;

    const levelMultiplier = 1 + (attacker.level - 1) * 0.1;
    const baseDamage = (atkStr + (isSpecial ? atkInt : 0)) * levelMultiplier * multiplier;
    const defense = defVit * (1 + (defender.level - 1) * 0.05);
    const critChance = Math.min(0.3, atkLuck / 100);
    let damage = Math.max(1, baseDamage - defense / 3);
    const hitChance = 0.9 - (defAgi - atkAgi) / 200;
    if (Math.random() > hitChance) return { damage: 0, isCritical: false, isMiss: true };
    if (Math.random() < critChance) {
      damage *= 2.5;
      return { damage: Math.floor(damage), isCritical: true, isMiss: false };
    }
    return { damage: Math.floor(damage), isCritical: false, isMiss: false };
  };

  const playerAttack = (action: CombatAction) => {
    if (!isPlayerTurn) return;
    // Trigger lunge for attack actions
    if (action === 'attack' || action === 'special') {
      setPlayerAttacking(true);
      setTimeout(() => setPlayerAttacking(false), 500);
    }
    let damageResult: DamageResult = { damage: 0, isCritical: false, isMiss: false };
    let manaCost = 0;

    switch (action) {
      case 'attack':
        damageResult = calculateDamage(character, creature);
        if (damageResult.isMiss) {
          SFX.miss();
          addToCombatLog(`${character.name} erra o ataque!`);
          setFeedback({ show: true, text: 'ERROU!', type: 'miss' });
        } else {
          if (damageResult.isCritical) SFX.critical();
          else SFX.attack();
          triggerShake('creature', damageResult.isCritical);
          addToCombatLog(`${character.name} ataca com ${damageResult.damage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
          setFeedback({ show: true, text: `-${damageResult.damage}`, type: damageResult.isCritical ? 'critical' : 'damage' });
        }
        break;
      case 'defend':
        setIsDefending(true);
        addToCombatLog(`${character.name} assume posição defensiva!`);
        setFeedback({ show: true, text: 'DEFENDENDO', type: 'heal' });
        break;
      case 'special':
        if (playerMana < 20) { toast.error('Mana insuficiente!'); return; }
        manaCost = 20;
        damageResult = calculateDamage(character, creature, true);
        if (damageResult.isMiss) {
          addToCombatLog(`${character.name} erra a habilidade especial!`);
          setFeedback({ show: true, text: 'ERROU!', type: 'miss' });
        } else {
          triggerShake('creature', damageResult.isCritical);
          addToCombatLog(`${character.name} usa habilidade especial com ${damageResult.damage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
          setFeedback({ show: true, text: `-${damageResult.damage} ✦`, type: damageResult.isCritical ? 'critical' : 'damage' });
        }
        break;
    }

    const newCreatureHealth = Math.max(0, creatureHealth - damageResult.damage);
    const newPlayerMana = Math.max(0, playerMana - manaCost);
    setCreatureHealth(newCreatureHealth);
    setPlayerMana(newPlayerMana);

    if (newCreatureHealth <= 0) { setCreatureDead(true); SFX.victory(); setTimeout(() => handleVictory(), 800); return; }
    setIsPlayerTurn(false);
    setTimeout(creatureAttack, 1500);
  };

  const useSkill = (skill: Skill) => {
    if (!isPlayerTurn || playerMana < skill.manaCost || (skillCooldowns[skill.id] || 0) > 0) return;

    setActiveSkillEffect(skill.id);

    if (skill.effect === 'heal' && skill.damageMultiplier === 0) {
      const healAmount = Math.floor(character.max_health * (skill.effectValue! / 100));
      const newHealth = Math.min(character.max_health, playerHealth + healAmount);
      setPlayerHealth(newHealth);
      setPlayerMana(playerMana - skill.manaCost);
      addToCombatLog(`${character.name} usa ${skill.name}! Restaura ${healAmount} HP!`);
      setFeedback({ show: true, text: `+${healAmount}`, type: 'heal' });
      SFX.attack();
    } else if (skill.effect === 'buff' && skill.damageMultiplier === 0) {
      addToCombatLog(`${character.name} usa ${skill.name}! +${skill.effectValue}% buff!`);
      setFeedback({ show: true, text: `${skill.icon} BUFF!`, type: 'heal' });
      setPlayerMana(playerMana - skill.manaCost);
    } else {
      const result = calculateDamage(character, creature, true, skill.damageMultiplier);
      if (result.isMiss) {
        addToCombatLog(`${character.name} erra ${skill.name}!`);
        setFeedback({ show: true, text: 'ERROU!', type: 'miss' });
      } else {
        triggerShake('creature', result.isCritical);
        const newCreatureHp = Math.max(0, creatureHealth - result.damage);
        setCreatureHealth(newCreatureHp);
        addToCombatLog(`${character.name} usa ${skill.name}! ${result.damage} de dano${result.isCritical ? ' (CRÍTICO!)' : ''}!`);
        setFeedback({ show: true, text: `-${result.damage} ${skill.icon}`, type: result.isCritical ? 'critical' : 'damage' });
        if (result.isCritical) SFX.critical();
        else SFX.attack();

        if (newCreatureHp <= 0) {
          setCreatureDead(true);
          SFX.victory();
          setPlayerMana(playerMana - skill.manaCost);
          setSkillCooldowns(prev => ({ ...prev, [skill.id]: skill.cooldown }));
          setTimeout(() => handleVictory(), 800);
          return;
        }
      }
      setPlayerMana(playerMana - skill.manaCost);
    }

    setSkillCooldowns(prev => ({ ...prev, [skill.id]: skill.cooldown }));

    setIsPlayerTurn(false);
    setTimeout(() => {
      setSkillCooldowns(prev => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) next[k] = Math.max(0, v - 1);
        return next;
      });
      creatureAttack();
    }, 1500);
  };

  const creatureAttack = () => {
    const damageResult = calculateDamage(creature, character);
    let finalDamage = damageResult.damage;
    if (isDefending) {
      finalDamage = Math.floor(finalDamage / 2);
      addToCombatLog(`${creature.name} ataca, mas ${character.name} defende! Dano reduzido para ${finalDamage}!`);
      setIsDefending(false);
    } else {
      SFX.hit();
      triggerShake('player', damageResult.isCritical);
      addToCombatLog(`${creature.name} ataca com ${finalDamage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
    }
    const newPlayerHealth = Math.max(0, playerHealth - finalDamage);
    setPlayerHealth(newPlayerHealth);
    if (newPlayerHealth <= 0) { setPlayerDead(true); SFX.defeat(); setTimeout(() => handleDefeat(), 800); return; }
    setIsPlayerTurn(true);
  };

  const handleVictory = async () => {
    try {
      await updateKillProgress(character.id, creature.name);
      const levelDifference = creature.level - character.level;
      const difficultyBonus = Math.max(1, 1 + levelDifference * 0.2);
      const rarityBonus = creature.rarity === 'rare' ? 1.5 : creature.rarity === 'uncommon' ? 1.2 : 1;
      const baseExpReward = creature.experience_reward * difficultyBonus * rarityBonus;
      const baseGoldReward = creature.gold_reward * difficultyBonus * rarityBonus;
      const newExperience = character.experience + Math.floor(baseExpReward);
      const newGold = character.gold + Math.floor(baseGoldReward);
      const currentLevel = character.level;
      // XP curve: dobra de dificuldade a cada 5 níveis
      const experienceForNextLevel = Math.floor(100 * currentLevel * Math.pow(2, Math.floor(currentLevel / 5)));
      let newLevel = currentLevel;
      let finalExperience = newExperience;

      if (newExperience >= experienceForNextLevel) {
        newLevel = currentLevel + 1;
        finalExperience = newExperience - experienceForNextLevel;
        const statIncrease = {
          max_health: character.max_health + 20, max_mana: character.max_mana + 10,
          strength: character.strength + 2, agility: character.agility + 2,
          intelligence: character.intelligence + 2, vitality: character.vitality + 2, luck: character.luck + 1
        };
        await supabase.from('characters').update({
          level: newLevel, experience: finalExperience, gold: newGold,
          health: playerHealth, mana: playerMana, ...statIncrease
        }).eq('id', character.id);
        toast.success(`Level Up! Agora você é nível ${newLevel}!`);
        setFeedback({ show: true, text: `LEVEL UP! ${newLevel}`, type: 'levelup' });
      } else {
        await supabase.from('characters').update({
          experience: finalExperience, gold: newGold, health: playerHealth, mana: playerMana
        }).eq('id', character.id);
      }

      const { data: drops } = await supabase.from('creature_drops').select('*, item:items(*)').eq('creature_id', creature.id);
      if (drops && drops.length > 0) {
        for (const drop of drops) {
          if (Math.random() < drop.drop_chance) {
            await supabase.from('character_items').insert({
              character_id: character.id, item_id: drop.item_id,
              quantity: Math.floor(Math.random() * (drop.quantity_max - drop.quantity_min + 1)) + drop.quantity_min
            });
            toast.success(`Item obtido: ${drop.item.name}!`);
          }
        }
      }

      addToCombatLog(`VITÓRIA! Ganhou ${Math.floor(baseExpReward)} XP e ${Math.floor(baseGoldReward)} moedas!`);
      setTimeout(() => {
        onCombatEnd(true, { ...character, level: newLevel, experience: finalExperience, gold: newGold, health: playerHealth, mana: playerMana });
      }, 2000);
    } catch {
      toast.error('Erro ao processar vitória');
      onCombatEnd(true);
    }
  };

  const handleDefeat = async () => {
    try {
      const goldLoss = Math.floor(character.gold * 0.1);
      const newGold = Math.max(0, character.gold - goldLoss);
      await supabase.from('characters').update({
        health: Math.floor(character.max_health * 0.1), gold: newGold
      }).eq('id', character.id);
      addToCombatLog(`DERROTA! Perdeu ${goldLoss} moedas...`);
      setTimeout(() => {
        onCombatEnd(false, { ...character, health: Math.floor(character.max_health * 0.1), gold: newGold });
      }, 2000);
    } catch {
      toast.error('Erro ao processar derrota');
      onCombatEnd(false);
    }
  };

  const playerHealthPercent = (playerHealth / character.max_health) * 100;
  const playerManaPercent = (playerMana / character.max_mana) * 100;
  const creatureHealthPercent = (creatureHealth / creature.max_health) * 100;
  const isCombatActive = playerHealth > 0 && creatureHealth > 0;

  return (
    <Div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Div className="w-full max-w-2xl">
        <GamePanel
          title="⚔ Combate"
          icon={<Swords className="h-5 w-5" />}
          footer={
            isCombatActive ? (
              <Div className="flex flex-col items-center gap-2 w-full">
                <Div className="flex gap-2 justify-center">
                  <GameButton size="md" variant="primary" onClick={() => playerAttack('attack')} disabled={!isPlayerTurn}>
                    <Swords className="h-4 w-4 mr-1" /> Atacar
                  </GameButton>
                  <GameButton size="md" onClick={() => playerAttack('defend')} disabled={!isPlayerTurn}>
                    <Shield className="h-4 w-4 mr-1" /> Defender
                  </GameButton>
                  <GameButton size="md" variant="gold" onClick={() => playerAttack('special')} disabled={!isPlayerTurn || playerMana < 20}>
                    <Zap className="h-4 w-4 mr-1" /> Especial
                  </GameButton>
                </Div>
                <SkillBar
                  characterClass={character.class}
                  mana={playerMana}
                  isPlayerTurn={isPlayerTurn}
                  onUseSkill={useSkill}
                  cooldowns={skillCooldowns}
                />
                <span className="text-[10px] opacity-50">Habilidades de classe acima • Pet ativo dá bônus passivo</span>
              </Div>
            ) : (
              <Div className="flex justify-center w-full">
                <GameButton size="md" variant="primary" onClick={() => onCombatEnd(playerHealth > 0)}>
                  Continuar
                </GameButton>
              </Div>
            )
          }
        >
          {activeSkillEffect && (
            <SkillEffect skillId={activeSkillEffect} onComplete={() => setActiveSkillEffect(null)} />
          )}
          <ActionFeedback
            show={feedback.show}
            text={feedback.text}
            type={feedback.type}
            onComplete={() => setFeedback({ ...feedback, show: false })}
          />

          {/* VISUAL COMBAT CANVAS */}
          <Div className="mb-3">
            <CombatCanvas
              characterClass={character.class}
              creatureName={creature.name}
              creatureRarity={creature.rarity}
              playerHealth={playerHealth}
              playerMaxHealth={character.max_health}
              creatureHealth={creatureHealth}
              creatureMaxHealth={creature.max_health}
              isPlayerTurn={isPlayerTurn}
              playerShake={playerShake}
              creatureShake={creatureShake}
              playerFlash={playerFlash}
              creatureFlash={creatureFlash}
              playerDead={playerDead}
              creatureDead={creatureDead}
              isDefending={isDefending}
              playerAttacking={playerAttacking}
            />
          </Div>

          {/* Combatant info cards */}
          <Div className="grid grid-cols-2 gap-3 mb-3">
            {/* Player info */}
            <Div className="rpg-combatant p-2">
              <Div className="rpg-combatant-name text-sm">{character.name}</Div>
              <span className="rpg-combatant-level text-[10px]">Nv.{character.level}</span>
              <Div className="rpg-bar-group mt-1">
                <Div className="rpg-bar-label text-[10px]"><Heart className="h-2.5 w-2.5" /> {playerHealth}/{character.max_health}</Div>
                <Div className="rpg-bar rpg-bar-hp" style={{ height: '6px' }}>
                  <motion.div className="rpg-bar-fill rpg-bar-fill-hp"
                    animate={{ width: `${playerHealthPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </Div>
                <Div className="rpg-bar-label text-[10px]"><Zap className="h-2.5 w-2.5" /> {playerMana}/{character.max_mana}</Div>
                <Div className="rpg-bar rpg-bar-mp" style={{ height: '6px' }}>
                  <motion.div className="rpg-bar-fill rpg-bar-fill-mp"
                    animate={{ width: `${playerManaPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </Div>
              </Div>
              {isDefending && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="rpg-defending-badge mt-1">
                  <Shield className="h-2.5 w-2.5" /> Defendendo
                </motion.div>
              )}
            </Div>

            {/* Creature info */}
            <Div className="rpg-combatant p-2">
              <Div className="rpg-combatant-name text-sm">{creature.name}</Div>
              <span className={`rpg-combatant-level rpg-rarity-label-${creature.rarity} text-[10px]`}>Nv.{creature.level} • {creature.rarity}</span>
              <Div className="rpg-bar-group mt-1">
                <Div className="rpg-bar-label text-[10px]"><Heart className="h-2.5 w-2.5" /> {creatureHealth}/{creature.max_health}</Div>
                <Div className="rpg-bar rpg-bar-hp" style={{ height: '6px' }}>
                  <motion.div className="rpg-bar-fill rpg-bar-fill-hp"
                    animate={{ width: `${creatureHealthPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </Div>
              </Div>
              {creature.special_ability && (
                <p className="text-[9px] mt-0.5" style={{ color: 'hsl(var(--rpg-gold))' }}>✦ {creature.special_ability}</p>
              )}
            </Div>
          </Div>

          {/* Turn indicator */}
          {isCombatActive && (
            <Div className="text-center mb-2">
              <motion.span
                key={isPlayerTurn ? 'player' : 'enemy'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`rpg-turn-indicator ${isPlayerTurn ? 'rpg-turn-player' : 'rpg-turn-enemy'}`}
              >
                {isPlayerTurn ? '🎯 Seu Turno!' : '⏳ Turno do Inimigo'}
              </motion.span>
            </Div>
          )}

          {/* Combat Log */}
          <Div className="rpg-combat-log">
            <Div className="rpg-combat-log-title">Log de Combate</Div>
            <Div className="rpg-combat-log-entries" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
              {combatLog.map((message, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rpg-combat-log-entry"
                >
                  {message}
                </motion.p>
              ))}
              {combatLog.length === 0 && (
                <p className="rpg-combat-log-entry opacity-40">O combate começou...</p>
              )}
            </Div>
          </Div>
        </GamePanel>
      </Div>
    </Div>
  );
}

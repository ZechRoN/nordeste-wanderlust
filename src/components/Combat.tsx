import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Heart, Zap, Shield, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { ActionFeedback } from './ActionFeedback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { GamePanel, GameButton } from '@/components/ui/game-panel';

interface Character {
  id: string; name: string; level: number;
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

  const { updateKillProgress } = useQuestProgress();

  useKeyboardShortcuts(isPlayerTurn && playerHealth > 0 && creatureHealth > 0, {
    attack: () => playerAttack('attack'),
    defend: () => playerAttack('defend'),
    special: () => playerAttack('special')
  });

  const addToCombatLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-4), message]);
  };

  const calculateDamage = (attacker: any, defender: any, isSpecial = false): DamageResult => {
    const levelMultiplier = 1 + (attacker.level - 1) * 0.1;
    const baseDamage = (attacker.strength + (isSpecial ? attacker.intelligence : 0)) * levelMultiplier;
    const defense = defender.vitality * (1 + (defender.level - 1) * 0.05);
    const critChance = Math.min(0.3, attacker.luck / 100);
    let damage = Math.max(1, baseDamage - defense / 3);
    const hitChance = 0.9 - (defender.agility - attacker.agility) / 200;
    if (Math.random() > hitChance) return { damage: 0, isCritical: false, isMiss: true };
    if (Math.random() < critChance) {
      damage *= 2.5;
      return { damage: Math.floor(damage), isCritical: true, isMiss: false };
    }
    return { damage: Math.floor(damage), isCritical: false, isMiss: false };
  };

  const playerAttack = (action: CombatAction) => {
    if (!isPlayerTurn) return;
    let damageResult: DamageResult = { damage: 0, isCritical: false, isMiss: false };
    let manaCost = 0;

    switch (action) {
      case 'attack':
        damageResult = calculateDamage(character, creature);
        if (damageResult.isMiss) {
          addToCombatLog(`${character.name} erra o ataque!`);
          setFeedback({ show: true, text: 'ERROU!', type: 'miss' });
        } else {
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
          addToCombatLog(`${character.name} usa habilidade especial com ${damageResult.damage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
          setFeedback({ show: true, text: `-${damageResult.damage} ✦`, type: damageResult.isCritical ? 'critical' : 'damage' });
        }
        break;
    }

    const newCreatureHealth = Math.max(0, creatureHealth - damageResult.damage);
    const newPlayerMana = Math.max(0, playerMana - manaCost);
    setCreatureHealth(newCreatureHealth);
    setPlayerMana(newPlayerMana);

    if (newCreatureHealth <= 0) { handleVictory(); return; }
    setIsPlayerTurn(false);
    setTimeout(creatureAttack, 1500);
  };

  const creatureAttack = () => {
    const damageResult = calculateDamage(creature, character);
    let finalDamage = damageResult.damage;
    if (isDefending) {
      finalDamage = Math.floor(finalDamage / 2);
      addToCombatLog(`${creature.name} ataca, mas ${character.name} defende! Dano reduzido para ${finalDamage}!`);
      setIsDefending(false);
    } else {
      addToCombatLog(`${creature.name} ataca com ${finalDamage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
    }
    const newPlayerHealth = Math.max(0, playerHealth - finalDamage);
    setPlayerHealth(newPlayerHealth);
    if (newPlayerHealth <= 0) { handleDefeat(); return; }
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
      const experienceForNextLevel = currentLevel * 100;
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

  const rarityClass = `rpg-rarity-label-${creature.rarity}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl">
        <GamePanel
          title="⚔ Combate"
          icon={<Swords className="h-5 w-5" />}
          footer={
            isCombatActive ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex gap-2 justify-center">
                  <GameButton size="md" variant="primary" onClick={() => playerAttack('attack')} disabled={!isPlayerTurn}>
                    <Swords className="h-4 w-4 mr-1" /> Atacar (1)
                  </GameButton>
                  <GameButton size="md" onClick={() => playerAttack('defend')} disabled={!isPlayerTurn}>
                    <Shield className="h-4 w-4 mr-1" /> Defender (2)
                  </GameButton>
                  <GameButton size="md" variant="gold" onClick={() => playerAttack('special')} disabled={!isPlayerTurn || playerMana < 20}>
                    <Zap className="h-4 w-4 mr-1" /> Especial (3)
                  </GameButton>
                </div>
                <span className="text-[10px] opacity-50">Teclas 1, 2, 3 ou A, D, S</span>
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <GameButton size="md" variant="primary" onClick={() => onCombatEnd(playerHealth > 0)}>
                  Continuar
                </GameButton>
              </div>
            )
          }
        >
          <ActionFeedback
            show={feedback.show}
            text={feedback.text}
            type={feedback.type}
            onComplete={() => setFeedback({ ...feedback, show: false })}
          />

          {/* Combatants */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Player */}
            <div className="rpg-combatant">
              <div className="rpg-combatant-name">{character.name}</div>
              <span className="rpg-combatant-level">Nível {character.level}</span>
              <div className="rpg-bar-group">
                <div className="rpg-bar-label"><Heart className="h-3 w-3" /> {playerHealth}/{character.max_health}</div>
                <div className="rpg-bar rpg-bar-hp">
                  <div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${playerHealthPercent}%` }} />
                </div>
                <div className="rpg-bar-label"><Zap className="h-3 w-3" /> {playerMana}/{character.max_mana}</div>
                <div className="rpg-bar rpg-bar-mp">
                  <div className="rpg-bar-fill rpg-bar-fill-mp" style={{ width: `${playerManaPercent}%` }} />
                </div>
              </div>
              {isDefending && (
                <div className="rpg-defending-badge"><Shield className="h-3 w-3" /> Defendendo</div>
              )}
            </div>

            {/* VS */}
            <div className="rpg-combatant">
              <div className="rpg-combatant-name">{creature.name}</div>
              <span className={`rpg-combatant-level ${rarityClass}`}>Nível {creature.level} • {creature.rarity}</span>
              <div className="rpg-bar-group">
                <div className="rpg-bar-label"><Heart className="h-3 w-3" /> {creatureHealth}/{creature.max_health}</div>
                <div className="rpg-bar rpg-bar-hp">
                  <div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${creatureHealthPercent}%` }} />
                </div>
              </div>
              <p className="text-[10px] opacity-60 mt-1">{creature.description}</p>
              {creature.special_ability && (
                <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--rpg-gold))' }}>✦ {creature.special_ability}</p>
              )}
            </div>
          </div>

          {/* Turn indicator */}
          {isCombatActive && (
            <div className="text-center mb-3">
              <span className={`rpg-turn-indicator ${isPlayerTurn ? 'rpg-turn-player' : 'rpg-turn-enemy'}`}>
                {isPlayerTurn ? '🎯 Seu Turno!' : '⏳ Turno do Inimigo'}
              </span>
            </div>
          )}

          {/* Combat Log */}
          <div className="rpg-combat-log">
            <div className="rpg-combat-log-title">Log de Combate</div>
            <div className="rpg-combat-log-entries" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
              {combatLog.map((message, index) => (
                <p key={index} className="rpg-combat-log-entry animate-fade-in">{message}</p>
              ))}
              {combatLog.length === 0 && (
                <p className="rpg-combat-log-entry opacity-40">O combate começou...</p>
              )}
            </div>
          </div>
        </GamePanel>
      </div>
    </div>
  );
}

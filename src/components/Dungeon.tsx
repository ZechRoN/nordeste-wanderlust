import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '@/components/ui/game-panel';
import { Skull, Shield, Swords, ChevronRight, Trophy, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { SFX } from '@/hooks/useGameAudio';

interface DungeonProps {
  character: any;
  onCharacterUpdate: (c: any) => void;
}

interface DungeonPhase {
  name: string;
  description: string;
  enemies: { name: string; level: number; hp: number; maxHp: number; str: number; def: number; emoji: string }[];
  boss: { name: string; level: number; hp: number; maxHp: number; str: number; def: number; special: string; emoji: string };
  rewards: { gold: number; exp: number; };
}

const DUNGEONS: { name: string; emoji: string; requiredLevel: number; biome: string; phases: DungeonPhase[] }[] = [
  {
    name: 'Caverna do Mandacaru',
    emoji: '🌵',
    requiredLevel: 3,
    biome: 'caatinga',
    phases: [
      {
        name: 'Entrada da Caverna',
        description: 'Criaturas rastejantes guardam a entrada...',
        enemies: [
          { name: 'Escorpião', level: 3, hp: 40, maxHp: 40, str: 8, def: 3, emoji: '🦂' },
          { name: 'Cobra Coral', level: 4, hp: 35, maxHp: 35, str: 10, def: 2, emoji: '🐍' },
        ],
        boss: { name: 'Aranha Rainha', level: 5, hp: 120, maxHp: 120, str: 14, def: 6, special: 'Teia Paralisante', emoji: '🕷️' },
        rewards: { gold: 50, exp: 80 },
      },
      {
        name: 'Câmara Profunda',
        description: 'O ar fica pesado e as sombras se movem...',
        enemies: [
          { name: 'Golem de Pedra', level: 6, hp: 80, maxHp: 80, str: 12, def: 10, emoji: '🪨' },
          { name: 'Morcego Vampiro', level: 5, hp: 50, maxHp: 50, str: 15, def: 4, emoji: '🦇' },
        ],
        boss: { name: 'Mandacaru Vivo', level: 8, hp: 200, maxHp: 200, str: 20, def: 12, special: 'Espinhos Venenosos', emoji: '🌵' },
        rewards: { gold: 100, exp: 150 },
      },
      {
        name: 'Coração da Caverna',
        description: 'O boss final aguarda no centro...',
        enemies: [
          { name: 'Elemental de Areia', level: 8, hp: 100, maxHp: 100, str: 18, def: 8, emoji: '🏜️' },
        ],
        boss: { name: 'Dragão da Caatinga', level: 12, hp: 500, maxHp: 500, str: 30, def: 18, special: 'Sopro de Fogo Solar', emoji: '🐉' },
        rewards: { gold: 250, exp: 400 },
      },
    ],
  },
  {
    name: 'Ruínas do Litoral',
    emoji: '🏛️',
    requiredLevel: 8,
    biome: 'litoral',
    phases: [
      {
        name: 'Portão das Ruínas',
        description: 'Guardiões ancestrais protegem a entrada...',
        enemies: [
          { name: 'Caranguejo Gigante', level: 8, hp: 70, maxHp: 70, str: 14, def: 12, emoji: '🦀' },
          { name: 'Água-viva Elétrica', level: 9, hp: 55, maxHp: 55, str: 18, def: 3, emoji: '🪼' },
        ],
        boss: { name: 'Tubarão Fantasma', level: 10, hp: 180, maxHp: 180, str: 22, def: 8, special: 'Mordida Espectral', emoji: '🦈' },
        rewards: { gold: 120, exp: 200 },
      },
      {
        name: 'Templo Submerso',
        description: 'Correntes mágicas percorrem as paredes...',
        enemies: [
          { name: 'Sereia Corrompida', level: 11, hp: 90, maxHp: 90, str: 20, def: 10, emoji: '🧜' },
          { name: 'Polvo Arcano', level: 12, hp: 110, maxHp: 110, str: 16, def: 14, emoji: '🐙' },
        ],
        boss: { name: 'Leviatã Menor', level: 14, hp: 350, maxHp: 350, str: 28, def: 16, special: 'Maremoto', emoji: '🐋' },
        rewards: { gold: 200, exp: 350 },
      },
      {
        name: 'Abismo Final',
        description: 'A criatura ancestral desperta...',
        enemies: [
          { name: 'Elemental da Água', level: 14, hp: 140, maxHp: 140, str: 24, def: 12, emoji: '💧' },
        ],
        boss: { name: 'Kraken Ancestral', level: 18, hp: 800, maxHp: 800, str: 40, def: 22, special: 'Tentáculos do Abismo', emoji: '🦑' },
        rewards: { gold: 500, exp: 700 },
      },
    ],
  },
  {
    name: 'Floresta Sombria',
    emoji: '🌲',
    requiredLevel: 5,
    biome: 'agreste',
    phases: [
      {
        name: 'Trilha Perdida',
        description: 'Árvores vivas bloqueiam o caminho...',
        enemies: [
          { name: 'Lobo Sombrio', level: 5, hp: 55, maxHp: 55, str: 12, def: 5, emoji: '🐺' },
          { name: 'Ent Corrompido', level: 6, hp: 80, maxHp: 80, str: 10, def: 14, emoji: '🌳' },
        ],
        boss: { name: 'Curupira Furioso', level: 7, hp: 150, maxHp: 150, str: 18, def: 10, special: 'Confusão Florestal', emoji: '👹' },
        rewards: { gold: 80, exp: 120 },
      },
      {
        name: 'Clareira Maldita',
        description: 'Espíritos da floresta surgem das sombras...',
        enemies: [
          { name: 'Espírito da Mata', level: 8, hp: 70, maxHp: 70, str: 16, def: 6, emoji: '👻' },
          { name: 'Jaguar Noturno', level: 9, hp: 90, maxHp: 90, str: 22, def: 8, emoji: '🐆' },
        ],
        boss: { name: 'Boitatá', level: 11, hp: 280, maxHp: 280, str: 26, def: 14, special: 'Chama Eterna', emoji: '🔥' },
        rewards: { gold: 160, exp: 280 },
      },
      {
        name: 'Coração da Floresta',
        description: 'O guardião final da floresta te espera...',
        enemies: [
          { name: 'Treant Ancião', level: 12, hp: 130, maxHp: 130, str: 20, def: 18, emoji: '🌿' },
        ],
        boss: { name: 'Caipora Supremo', level: 15, hp: 600, maxHp: 600, str: 35, def: 20, special: 'Comando da Natureza', emoji: '🦜' },
        rewards: { gold: 350, exp: 500 },
      },
    ],
  },
];

type DungeonState = 'select' | 'exploring' | 'combat' | 'boss' | 'victory' | 'defeat';

export function Dungeon({ character, onCharacterUpdate }: DungeonProps) {
  const [state, setState] = useState<DungeonState>('select');
  const [selectedDungeon, setSelectedDungeon] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentEnemy, setCurrentEnemy] = useState(0);
  const [playerHp, setPlayerHp] = useState(character.health);
  const [enemyHp, setEnemyHp] = useState(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isBoss, setIsBoss] = useState(false);
  const [totalRewards, setTotalRewards] = useState({ gold: 0, exp: 0 });
  const [isAttacking, setIsAttacking] = useState(false);

  const dungeon = selectedDungeon !== null ? DUNGEONS[selectedDungeon] : null;
  const phase = dungeon ? dungeon.phases[currentPhase] : null;

  const getCurrentEnemy = () => {
    if (!phase) return null;
    if (isBoss) return phase.boss;
    return phase.enemies[currentEnemy] || null;
  };

  const startDungeon = (idx: number) => {
    const d = DUNGEONS[idx];
    if (character.level < d.requiredLevel) { toast.error(`Nível ${d.requiredLevel} necessário!`); return; }
    if (character.health <= 0) { toast.error('Recupere sua vida primeiro!'); return; }

    setSelectedDungeon(idx);
    setCurrentPhase(0);
    setCurrentEnemy(0);
    setPlayerHp(character.health);
    setIsBoss(false);
    setTotalRewards({ gold: 0, exp: 0 });
    setCombatLog([`⚔ Entrando em ${d.name}...`]);
    
    const firstEnemy = d.phases[0].enemies[0];
    setEnemyHp(firstEnemy.hp);
    setState('combat');
    SFX.menuClick();
  };

  const attack = () => {
    const enemy = getCurrentEnemy();
    if (!enemy || isAttacking) return;
    setIsAttacking(true);
    SFX.attack();

    const baseDmg = character.strength + character.intelligence * 0.3;
    const critChance = Math.min(0.3, character.luck / 100);
    const isCrit = Math.random() < critChance;
    let dmg = Math.floor(baseDmg * (1 + (character.level - 1) * 0.08) - enemy.def * 0.3);
    dmg = Math.max(1, dmg);
    if (isCrit) { dmg = Math.floor(dmg * 2.5); SFX.critical(); }

    const newEnemyHp = Math.max(0, enemyHp - dmg);
    setEnemyHp(newEnemyHp);

    const enemyDmg = Math.max(1, Math.floor(enemy.str * 0.8 - character.vitality * 0.2));
    const newPlayerHp = Math.max(0, playerHp - enemyDmg);
    setPlayerHp(newPlayerHp);

    const logMsg = `${isCrit ? '💥 CRÍTICO! ' : ''}Causou ${dmg} → ${enemy.name}. Recebeu ${enemyDmg}.`;
    setCombatLog(prev => [...prev.slice(-8), logMsg]);

    if (newPlayerHp <= 0) {
      setCombatLog(prev => [...prev, '💀 Você foi derrotado...']);
      setState('defeat');
      setIsAttacking(false);
      return;
    }

    if (newEnemyHp <= 0) {
      setCombatLog(prev => [...prev, `✅ ${enemy.name} derrotado!`]);
      setTimeout(() => advanceEnemy(), 600);
    }

    setTimeout(() => setIsAttacking(false), 400);
  };

  const advanceEnemy = () => {
    if (!phase || !dungeon) return;

    if (isBoss) {
      // Phase complete
      const newRewards = { gold: totalRewards.gold + phase.rewards.gold, exp: totalRewards.exp + phase.rewards.exp };
      setTotalRewards(newRewards);

      if (currentPhase + 1 < dungeon.phases.length) {
        // Next phase
        const nextPhase = dungeon.phases[currentPhase + 1];
        setCurrentPhase(currentPhase + 1);
        setCurrentEnemy(0);
        setIsBoss(false);
        setEnemyHp(nextPhase.enemies[0].hp);
        setCombatLog(prev => [...prev, `📍 ${nextPhase.name} - ${nextPhase.description}`]);
      } else {
        // Dungeon complete!
        setState('victory');
        SFX.victory();
        // Apply rewards
        const finalGold = character.gold + newRewards.gold;
        const finalExp = character.experience + newRewards.exp;
        supabase.from('characters').update({ gold: finalGold, experience: finalExp, health: playerHp }).eq('id', character.id);
        onCharacterUpdate({ ...character, gold: finalGold, experience: finalExp, health: playerHp });
      }
    } else if (currentEnemy + 1 < phase.enemies.length) {
      // Next enemy
      const nextIdx = currentEnemy + 1;
      setCurrentEnemy(nextIdx);
      setEnemyHp(phase.enemies[nextIdx].hp);
      setCombatLog(prev => [...prev, `⚔ ${phase.enemies[nextIdx].name} apareceu!`]);
    } else {
      // Boss time
      setIsBoss(true);
      setEnemyHp(phase.boss.hp);
      setCombatLog(prev => [...prev, `👹 BOSS: ${phase.boss.name} apareceu! "${phase.boss.special}"`]);
    }
  };

  const defend = () => {
    const enemy = getCurrentEnemy();
    if (!enemy || isAttacking) return;
    setIsAttacking(true);

    const reducedDmg = Math.max(1, Math.floor(enemy.str * 0.3 - character.vitality * 0.3));
    const healAmt = Math.floor(character.vitality * 0.5);
    const newHp = Math.min(character.max_health, Math.max(0, playerHp - reducedDmg + healAmt));
    setPlayerHp(newHp);

    setCombatLog(prev => [...prev.slice(-8), `🛡️ Defendeu! Recebeu ${reducedDmg}. Recuperou ${healAmt} HP.`]);
    setTimeout(() => setIsAttacking(false), 400);
  };

  const exitDungeon = async () => {
    await supabase.from('characters').update({ health: playerHp }).eq('id', character.id);
    onCharacterUpdate({ ...character, health: playerHp });
    setState('select');
    setSelectedDungeon(null);
    setCurrentPhase(0);
  };

  // SELECT SCREEN
  if (state === 'select') {
    return (
      <div className="space-y-3">
        {DUNGEONS.map((d, idx) => {
          const canEnter = character.level >= d.requiredLevel;
          return (
            <motion.div key={idx} className="rpg-item-detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold pixel-text text-sm" style={{ color: canEnter ? 'hsl(var(--rpg-gold))' : 'hsl(var(--rpg-text-dim))' }}>
                  {d.emoji} {d.name}
                </span>
                <span className="text-[10px] opacity-60">Nv.{d.requiredLevel}+</span>
              </div>
              <div className="flex gap-2 text-[10px] mb-2 opacity-70">
                <span>📍 {d.biome}</span>
                <span>🗺️ {d.phases.length} fases</span>
                <span>🪙 {d.phases.reduce((s, p) => s + p.rewards.gold, 0)} ouro</span>
              </div>
              <div className="flex gap-1 mb-2">
                {d.phases.map((p, pi) => (
                  <div key={pi} className="text-[9px] px-2 py-1 rpg-combatant-level">
                    {pi + 1}. {p.name}
                  </div>
                ))}
              </div>
              <GameButton variant={canEnter ? 'gold' : 'secondary'} size="sm" onClick={() => startDungeon(idx)} disabled={!canEnter}>
                <Skull className="h-3 w-3 mr-1" />
                {canEnter ? 'Entrar' : `Nv.${d.requiredLevel} necessário`}
              </GameButton>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // COMBAT / BOSS
  if ((state === 'combat' || state === 'boss') && dungeon && phase) {
    const enemy = getCurrentEnemy();
    if (!enemy) return null;
    const enemyHpPct = (enemyHp / enemy.maxHp) * 100;
    const playerHpPct = (playerHp / character.max_health) * 100;

    return (
      <div className="space-y-3">
        {/* Phase indicator */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold" style={{ color: 'hsl(var(--rpg-gold))' }}>
            {dungeon.emoji} {dungeon.name} — Fase {currentPhase + 1}/{dungeon.phases.length}
          </span>
          {isBoss && <span className="rpg-turn-indicator rpg-turn-enemy text-[9px]">⚠ BOSS</span>}
        </div>

        {/* Enemy */}
        <motion.div className="rpg-combatant" animate={isAttacking ? { x: [0, -3, 3, -3, 0] } : {}} transition={{ duration: 0.3 }}>
          <div className="flex items-center justify-between">
            <span className="rpg-combatant-name" style={{ color: isBoss ? 'hsl(var(--rpg-legendary))' : 'hsl(0 60% 60%)' }}>
              {enemy.emoji} {enemy.name}
            </span>
            <span className="rpg-combatant-level">Nv.{enemy.level}</span>
          </div>
          {isBoss && 'special' in enemy && (
            <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--rpg-gold))' }}>✦ {(enemy as any).special}</p>
          )}
          <div className="rpg-bar-group">
            <div className="rpg-bar-label text-[10px]">❤ {enemyHp}/{enemy.maxHp}</div>
            <div className="rpg-bar rpg-bar-hp">
              <motion.div className="rpg-bar-fill rpg-bar-fill-hp" animate={{ width: `${enemyHpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </motion.div>

        {/* Player */}
        <div className="rpg-combatant">
          <div className="flex items-center justify-between">
            <span className="rpg-combatant-name" style={{ color: 'hsl(var(--rpg-gold))' }}>⚔ {character.name}</span>
            <span className="rpg-combatant-level">Nv.{character.level}</span>
          </div>
          <div className="rpg-bar-group">
            <div className="rpg-bar-label text-[10px]">❤ {playerHp}/{character.max_health}</div>
            <div className="rpg-bar rpg-bar-hp">
              <motion.div className="rpg-bar-fill rpg-bar-fill-hp" animate={{ width: `${playerHpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <GameButton variant="danger" size="sm" onClick={attack} disabled={isAttacking}>
            <Swords className="h-3 w-3 mr-1" /> Atacar
          </GameButton>
          <GameButton variant="primary" size="sm" onClick={defend} disabled={isAttacking}>
            <Shield className="h-3 w-3 mr-1" /> Defender
          </GameButton>
          <GameButton variant="secondary" size="sm" onClick={exitDungeon}>
            Fugir
          </GameButton>
        </div>

        {/* Combat log */}
        <div className="rpg-combat-log">
          <div className="rpg-combat-log-title">📜 Log</div>
          <div className="rpg-combat-log-entries">
            {combatLog.slice(-6).map((msg, i) => (
              <div key={i} className="rpg-combat-log-entry">{msg}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VICTORY
  if (state === 'victory') {
    return (
      <motion.div className="text-center py-6 space-y-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Trophy className="h-12 w-12 mx-auto" style={{ color: 'hsl(var(--rpg-gold))' }} />
        <h3 className="font-bold pixel-text text-lg" style={{ color: 'hsl(var(--rpg-gold))' }}>🏆 Dungeon Concluída!</h3>
        <p className="text-xs opacity-70">{dungeon?.name}</p>
        <div className="rpg-item-detail inline-block">
          <div className="text-sm font-bold">Recompensas:</div>
          <div className="flex gap-4 text-xs mt-1">
            <span>🪙 {totalRewards.gold} Ouro</span>
            <span>⭐ {totalRewards.exp} XP</span>
          </div>
        </div>
        <GameButton variant="gold" onClick={() => { setState('select'); setSelectedDungeon(null); }}>
          Voltar às Dungeons
        </GameButton>
      </motion.div>
    );
  }

  // DEFEAT
  if (state === 'defeat') {
    return (
      <motion.div className="text-center py-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Skull className="h-12 w-12 mx-auto text-red-400" />
        <h3 className="font-bold pixel-text text-lg text-red-400">💀 Derrotado!</h3>
        <p className="text-xs opacity-70">Você caiu na fase {currentPhase + 1} de {dungeon?.name}</p>
        {totalRewards.gold > 0 && (
          <div className="rpg-item-detail inline-block">
            <div className="text-[10px] opacity-60">Recompensas parciais:</div>
            <div className="text-xs">🪙 {Math.floor(totalRewards.gold * 0.5)} • ⭐ {Math.floor(totalRewards.exp * 0.5)}</div>
          </div>
        )}
        <GameButton variant="secondary" onClick={exitDungeon}>
          Voltar
        </GameButton>
      </motion.div>
    );
  }

  return null;
}

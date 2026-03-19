import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Trophy, Users, Clock, Heart, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { GamePanelTabs, GameButton } from '@/components/ui/game-panel';

interface ArenaOpponent {
  id: string; name: string; class: string; level: number;
  health: number; max_health: number;
  strength: number; agility: number; intelligence: number; vitality: number; luck: number;
  current_biome: string;
}

interface ArenaProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

const CLASS_NAMES: Record<string, string> = {
  warrior: 'Guerreiro', mage: 'Mago', archer: 'Arqueiro', healer: 'Curandeiro', assassin: 'Assassino'
};
const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️', mage: '🔮', archer: '🏹', healer: '💚', assassin: '🗡️'
};

export function Arena({ character, onCharacterUpdate }: ArenaProps) {
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [combatInProgress, setCombatInProgress] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [playerHealth, setPlayerHealth] = useState(character.health);
  const [opponentHealth, setOpponentHealth] = useState(0);
  const [selectedOpponent, setSelectedOpponent] = useState<ArenaOpponent | null>(null);
  const [activeTab, setActiveTab] = useState('ranked');

  useEffect(() => { loadArenaData(); }, [character.id]);

  const loadArenaData = async () => {
    const { data: opp } = await supabase.from('characters').select('*')
      .neq('id', character.id).gte('level', character.level - 5).lte('level', character.level + 5).limit(20);
    setOpponents((opp as any) || []);

    const { data: matches } = await supabase.from('arena_matches').select('*, player1:characters!arena_matches_player1_id_fkey(name, level, class), player2:characters!arena_matches_player2_id_fkey(name, level, class), winner:characters!arena_matches_winner_id_fkey(name)')
      .or(`player1_id.eq.${character.id},player2_id.eq.${character.id}`).order('created_at', { ascending: false }).limit(10);
    setRecentMatches(matches || []);
    setLoading(false);
  };

  const calculateMatchup = (opp: ArenaOpponent) => {
    const diff = (character.strength + character.agility + character.intelligence + character.vitality) -
      (opp.strength + opp.agility + opp.intelligence + opp.vitality);
    if (diff > 20) return { text: 'Fácil', chance: 85 };
    if (diff > 0) return { text: 'Vantagem', chance: 65 };
    if (diff > -20) return { text: 'Equilibrado', chance: 50 };
    return { text: 'Difícil', chance: 35 };
  };

  const startDuel = async (opp: ArenaOpponent) => {
    setSelectedOpponent(opp);
    setPlayerHealth(character.max_health);
    setOpponentHealth(opp.max_health);
    setCombatLog([]);
    setCombatInProgress(true);

    const { data: match, error } = await supabase.from('arena_matches')
      .insert({ player1_id: character.id, player2_id: opp.id }).select().single();
    if (error) { toast.error('Erro ao iniciar duelo'); setCombatInProgress(false); return; }

    simulateCombat(opp, match.id);
  };

  const simulateCombat = async (opp: ArenaOpponent, matchId: string) => {
    const log: string[] = [];
    let pH = character.max_health, oH = opp.max_health;
    log.push(`🥊 ${character.name} vs ${opp.name}!`);

    while (pH > 0 && oH > 0) {
      await new Promise(r => setTimeout(r, 800));
      const pDmg = Math.floor(character.strength * 0.8 + character.intelligence * 0.5 + Math.random() * character.luck);
      oH -= pDmg;
      log.push(`⚔️ ${character.name}: ${pDmg} dmg (HP: ${Math.max(0, oH)})`);
      setOpponentHealth(Math.max(0, oH));
      setCombatLog([...log]);
      if (oH <= 0) break;

      await new Promise(r => setTimeout(r, 800));
      const oDmg = Math.floor(opp.strength * 0.8 + opp.intelligence * 0.5 + Math.random() * opp.luck);
      pH -= oDmg;
      log.push(`🗡️ ${opp.name}: ${oDmg} dmg (HP: ${Math.max(0, pH)})`);
      setPlayerHealth(Math.max(0, pH));
      setCombatLog([...log]);
    }

    const won = pH > 0;
    const pts = won ? 50 : 10;
    log.push(won ? `🏆 Vitória!` : `💀 Derrota!`);
    log.push(`✨ +${pts} pontos`);
    setCombatLog([...log]);

    await supabase.from('arena_matches').update({
      winner_id: won ? character.id : opp.id,
      player1_health_remaining: pH, player2_health_remaining: oH,
      arena_points_awarded: pts, completed_at: new Date().toISOString(), combat_log: log,
    }).eq('id', matchId);

    toast.success(won ? 'Vitória na Arena!' : 'Combate Concluído', { description: `+${pts} pontos` });
    setTimeout(() => { setCombatInProgress(false); setSelectedOpponent(null); loadArenaData(); }, 3000);
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando arena...</span></div>;

  if (combatInProgress && selectedOpponent) {
    const pPct = (playerHealth / character.max_health) * 100;
    const oPct = (opponentHealth / selectedOpponent.max_health) * 100;
    return (
      <div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rpg-combatant">
            <div className="rpg-combatant-name">{character.name}</div>
            <div className="rpg-bar rpg-bar-hp mt-1"><div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${pPct}%` }} /></div>
            <span className="text-[9px] opacity-50">{playerHealth}/{character.max_health}</span>
          </div>
          <div className="rpg-combatant">
            <div className="rpg-combatant-name">{selectedOpponent.name}</div>
            <div className="rpg-bar rpg-bar-hp mt-1"><div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${oPct}%` }} /></div>
            <span className="text-[9px] opacity-50">{opponentHealth}/{selectedOpponent.max_health}</span>
          </div>
        </div>
        <div className="rpg-combat-log">
          <div className="rpg-combat-log-title">Arena Log</div>
          <div className="rpg-combat-log-entries" style={{ maxHeight: '200px' }}
            ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
            {combatLog.map((msg, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="rpg-combat-log-entry">{msg}</motion.p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rpg-item-detail text-center !p-2">
          <span className="text-lg">🏆</span>
          <div className="text-sm font-bold pixel-text">{character.arena_wins || 0}</div>
          <span className="text-[8px] opacity-40">Vitórias</span>
        </div>
        <div className="rpg-item-detail text-center !p-2">
          <span className="text-lg">💀</span>
          <div className="text-sm font-bold pixel-text">{character.arena_losses || 0}</div>
          <span className="text-[8px] opacity-40">Derrotas</span>
        </div>
        <div className="rpg-item-detail text-center !p-2">
          <span className="text-lg">⭐</span>
          <div className="text-sm font-bold pixel-text">{character.arena_points || 0}</div>
          <span className="text-[8px] opacity-40">Pontos</span>
        </div>
      </div>

      <GamePanelTabs
        tabs={[{ key: 'ranked', label: 'Oponentes' }, { key: 'history', label: 'Histórico' }]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'ranked' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {opponents.length === 0 ? (
            <p className="text-center text-xs opacity-40 py-8">Nenhum oponente disponível.</p>
          ) : opponents.map((opp) => {
            const m = calculateMatchup(opp);
            return (
              <div key={opp.id} className="rpg-class-card">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CLASS_ICONS[opp.class] || '⚔️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs pixel-text">{opp.name}</span>
                      <span className="rpg-combatant-level text-[9px]">Nv.{opp.level}</span>
                      <span className="text-[9px] opacity-50">{m.text} ({m.chance}%)</span>
                    </div>
                    <span className="text-[10px] opacity-40">{CLASS_NAMES[opp.class] || opp.class}</span>
                  </div>
                  <GameButton size="sm" variant="danger" onClick={() => startDuel(opp)}>
                    <Swords className="h-3 w-3 mr-1" /> Duelar
                  </GameButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {recentMatches.length === 0 ? (
            <p className="text-center text-xs opacity-40 py-8">Sem histórico.</p>
          ) : recentMatches.map((match: any) => {
            const won = match.winner_id === character.id;
            const isP1 = match.player1_id === character.id;
            const opp = isP1 ? match.player2 : match.player1;
            return (
              <div key={match.id} className={`rpg-class-card !cursor-default ${won ? 'rpg-class-selected' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs">{won ? '🏆' : '💀'} vs <b>{opp?.name}</b></span>
                    <span className="rpg-combatant-level text-[9px] ml-2">Nv.{opp?.level}</span>
                  </div>
                  <span className="text-[9px] opacity-40">{match.arena_points_awarded} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

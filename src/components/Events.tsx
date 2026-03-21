import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '@/components/ui/game-panel';
import { Swords, Trophy, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface EventsProps {
  character: any;
  onCharacterUpdate: (c: any) => void;
}

interface GameEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  biome: string;
  boss_name: string;
  boss_level: number;
  boss_health: number;
  boss_max_health: number;
  boss_strength: number;
  boss_agility: number;
  boss_intelligence: number;
  boss_vitality: number;
  boss_luck: number;
  boss_special_ability: string;
  reward_experience: number;
  reward_gold: number;
  reward_item_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface Participation {
  id: string;
  event_id: string;
  damage_dealt: number;
  reward_claimed: boolean;
}

export function Events({ character, onCharacterUpdate }: EventsProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState<string | null>(null);
  const [bossHealthMap, setBossHealthMap] = useState<Record<string, number>>({});

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    const now = new Date().toISOString();
    const { data: evts } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('ends_at', now)
      .order('ends_at', { ascending: true });

    if (evts) {
      setEvents(evts as unknown as GameEvent[]);
      const healthMap: Record<string, number> = {};
      evts.forEach((e: any) => { healthMap[e.id] = e.boss_health; });
      setBossHealthMap(healthMap);
    }

    const { data: parts } = await supabase
      .from('event_participants')
      .select('*')
      .eq('character_id', character.id);
    if (parts) setParticipations(parts as unknown as Participation[]);
    setLoading(false);
  };

  const getTimeRemaining = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Encerrado';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const attackBoss = async (event: GameEvent) => {
    if (character.health <= 0) { toast.error('Você precisa estar vivo!'); return; }
    setFighting(event.id);

    // Calculate damage
    const baseDamage = character.strength + character.intelligence * 0.5;
    const critChance = Math.min(0.3, character.luck / 100);
    const isCrit = Math.random() < critChance;
    let damage = Math.floor(baseDamage * (1 + (character.level - 1) * 0.1));
    if (isCrit) damage = Math.floor(damage * 2.5);

    // Boss counter-attack
    const bossDefense = event.boss_vitality * 0.3;
    const bossDamage = Math.max(1, Math.floor(event.boss_strength * 0.8 - character.vitality * 0.2));

    const currentBossHp = bossHealthMap[event.id] ?? event.boss_health;
    const newBossHp = Math.max(0, currentBossHp - damage);
    const newPlayerHp = Math.max(0, character.health - bossDamage);

    setBossHealthMap(prev => ({ ...prev, [event.id]: newBossHp }));

    // Update player health
    await supabase.from('characters').update({ health: newPlayerHp }).eq('id', character.id);
    onCharacterUpdate({ ...character, health: newPlayerHp });

    // Upsert participation
    const existing = participations.find(p => p.event_id === event.id);
    if (existing) {
      await supabase.from('event_participants').update({
        damage_dealt: existing.damage_dealt + damage
      }).eq('id', existing.id);
      setParticipations(prev => prev.map(p =>
        p.id === existing.id ? { ...p, damage_dealt: p.damage_dealt + damage } : p
      ));
    } else {
      const { data } = await supabase.from('event_participants').insert({
        event_id: event.id, character_id: character.id, damage_dealt: damage
      }).select().single();
      if (data) setParticipations(prev => [...prev, data as unknown as Participation]);
    }

    toast.success(`${isCrit ? '💥 CRÍTICO! ' : ''}Causou ${damage} de dano ao boss! Recebeu ${bossDamage} de dano.`);

    // Check if boss defeated
    if (newBossHp <= 0) {
      const newGold = character.gold + event.reward_gold;
      const newExp = character.experience + event.reward_experience;
      await supabase.from('characters').update({
        gold: newGold, experience: newExp
      }).eq('id', character.id);
      onCharacterUpdate({ ...character, health: newPlayerHp, gold: newGold, experience: newExp });
      toast.success(`🏆 Boss ${event.boss_name} derrotado! +${event.reward_experience} XP +${event.reward_gold} 🪙`);
    }

    setTimeout(() => setFighting(null), 500);
  };

  if (loading) return <p className="rpg-loading text-center p-4">Carregando eventos...</p>;

  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <div className="text-center py-8 opacity-50">
          <Trophy className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">Nenhum evento ativo no momento</p>
        </div>
      ) : (
        events.map(event => {
          const bossHp = bossHealthMap[event.id] ?? event.boss_health;
          const bossHpPct = (bossHp / event.boss_max_health) * 100;
          const participation = participations.find(p => p.event_id === event.id);
          const defeated = bossHp <= 0;

          return (
            <motion.div
              key={event.id}
              className="rpg-item-detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold pixel-text text-sm" style={{ color: 'hsl(var(--rpg-legendary))' }}>
                    🔥 {event.title}
                  </span>
                  <p className="text-[10px] opacity-60">{event.description}</p>
                </div>
                <div className="text-right text-[10px]">
                  <div className="flex items-center gap-1 opacity-70">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(event.ends_at)}
                  </div>
                  <span className="opacity-50">{event.biome}</span>
                </div>
              </div>

              {/* Boss info */}
              <div className="rpg-combatant mb-2">
                <div className="flex items-center justify-between">
                  <span className="rpg-combatant-name" style={{ color: 'hsl(0 60% 60%)' }}>
                    👹 {event.boss_name}
                  </span>
                  <span className="rpg-combatant-level">Nível {event.boss_level}</span>
                </div>
                <div className="rpg-bar-group">
                  <div className="rpg-bar-label text-[10px]">❤ {bossHp}/{event.boss_max_health}</div>
                  <div className="rpg-bar rpg-bar-hp">
                    <motion.div
                      className="rpg-bar-fill rpg-bar-fill-hp"
                      animate={{ width: `${bossHpPct}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
                {event.boss_special_ability && (
                  <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--rpg-gold))' }}>
                    ✦ {event.boss_special_ability}
                  </p>
                )}
              </div>

              {/* Rewards */}
              <div className="flex gap-3 text-[10px] mb-2">
                <span>🏆 {event.reward_experience} XP</span>
                <span>🪙 {event.reward_gold}</span>
                {event.reward_item_id && <span>🎁 Item Exclusivo</span>}
              </div>

              {/* Participation */}
              {participation && (
                <div className="text-[10px] opacity-70 mb-2">
                  ⚔ Dano total causado: <strong>{participation.damage_dealt}</strong>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <GameButton
                  variant="danger"
                  size="sm"
                  onClick={() => attackBoss(event)}
                  disabled={defeated || fighting === event.id || character.health <= 0}
                >
                  <Swords className="h-3 w-3 mr-1" />
                  {defeated ? 'Derrotado!' : fighting === event.id ? 'Atacando...' : 'Atacar Boss'}
                </GameButton>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

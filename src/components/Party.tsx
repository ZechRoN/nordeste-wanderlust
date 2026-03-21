import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '@/components/ui/game-panel';
import { Users, Crown, Plus, LogOut, Swords } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { SFX } from '@/hooks/useGameAudio';

interface PartyProps {
  character: any;
  onCharacterUpdate: (c: any) => void;
}

interface Party {
  id: string;
  name: string;
  leader_id: string;
  max_members: number;
  is_active: boolean;
}

interface PartyMember {
  id: string;
  party_id: string;
  character_id: string;
  character?: { id: string; name: string; level: number; class: string; health: number; max_health: number };
}

export function Party({ character, onCharacterUpdate }: PartyProps) {
  const [myParty, setMyParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [availableParties, setAvailableParties] = useState<(Party & { member_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [partyName, setPartyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadPartyData(); }, []);

  const loadPartyData = async () => {
    // Check if I'm in a party
    const { data: myMembership } = await supabase
      .from('party_members')
      .select('*, party:parties(*)')
      .eq('character_id', character.id);

    if (myMembership && myMembership.length > 0) {
      const party = (myMembership[0] as any).party;
      setMyParty(party);
      // Load all members
      const { data: allMembers } = await supabase
        .from('party_members')
        .select('*, character:characters(id, name, level, class, health, max_health)')
        .eq('party_id', party.id);
      if (allMembers) setMembers(allMembers as unknown as PartyMember[]);
    } else {
      // Load available parties
      const { data: parties } = await supabase
        .from('parties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (parties) {
        const withCounts = await Promise.all(parties.map(async (p: any) => {
          const { count } = await supabase
            .from('party_members')
            .select('*', { count: 'exact', head: true })
            .eq('party_id', p.id);
          return { ...p, member_count: count || 0 };
        }));
        setAvailableParties(withCounts.filter(p => p.member_count < p.max_members) as any);
      }
    }
    setLoading(false);
  };

  const createParty = async () => {
    if (!partyName.trim()) { toast.error('Dê um nome à party!'); return; }
    SFX.openPanel();
    const { data: party, error } = await supabase
      .from('parties')
      .insert({ name: partyName.trim(), leader_id: character.id })
      .select()
      .single();

    if (error) { toast.error('Erro ao criar party'); return; }

    // Add self as member
    await supabase.from('party_members').insert({
      party_id: party.id,
      character_id: character.id
    });

    toast.success(`Party "${partyName}" criada!`);
    setPartyName('');
    setCreating(false);
    loadPartyData();
  };

  const joinParty = async (partyId: string) => {
    SFX.itemPickup();
    const { error } = await supabase.from('party_members').insert({
      party_id: partyId,
      character_id: character.id
    });
    if (error) { toast.error('Erro ao entrar na party'); return; }
    toast.success('Entrou na party!');
    loadPartyData();
  };

  const leaveParty = async () => {
    if (!myParty) return;
    SFX.closePanel();
    await supabase.from('party_members').delete()
      .eq('party_id', myParty.id)
      .eq('character_id', character.id);

    // If leader, disband
    if (myParty.leader_id === character.id) {
      await supabase.from('parties').update({ is_active: false }).eq('id', myParty.id);
      toast.success('Party dissolvida');
    } else {
      toast.success('Saiu da party');
    }
    setMyParty(null);
    setMembers([]);
    loadPartyData();
  };

  const classIcons: Record<string, string> = {
    warrior: '⚔️', mage: '🔮', archer: '🏹', healer: '💚', assassin: '🗡️'
  };

  if (loading) return <p className="rpg-loading text-center p-4">Carregando...</p>;

  // In a party
  if (myParty) {
    const isLeader = myParty.leader_id === character.id;
    return (
      <div className="space-y-3">
        <div className="rpg-item-detail">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-bold pixel-text" style={{ color: 'hsl(var(--rpg-gold))' }}>
                <Users className="h-3 w-3 inline mr-1" />{myParty.name}
              </span>
              <p className="text-[10px] opacity-50">{members.length}/{myParty.max_members} membros</p>
            </div>
            <GameButton variant="danger" size="sm" onClick={leaveParty}>
              <LogOut className="h-3 w-3 mr-1" />{isLeader ? 'Dissolver' : 'Sair'}
            </GameButton>
          </div>
        </div>

        <div className="space-y-1">
          {members.map(m => {
            const c = m.character;
            if (!c) return null;
            const hpPct = (c.health / c.max_health) * 100;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rpg-item-detail flex items-center gap-2"
                style={{ padding: '6px 8px' }}
              >
                <span className="text-lg">{classIcons[c.class] || '👤'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs pixel-text">{c.name}</span>
                    {m.character_id === myParty.leader_id && (
                      <Crown className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                    )}
                  </div>
                  <span className="text-[9px] opacity-50">Nível {c.level}</span>
                  <div className="rpg-bar rpg-bar-hp mt-1" style={{ height: 6 }}>
                    <div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${hpPct}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Not in a party
  return (
    <div className="space-y-3">
      {creating ? (
        <div className="rpg-item-detail">
          <label className="rpg-label">Nome da Party</label>
          <input
            className="rpg-input mb-2"
            placeholder="Ex: Guerreiros do Sertão"
            value={partyName}
            onChange={e => setPartyName(e.target.value)}
            maxLength={30}
          />
          <div className="flex gap-2">
            <GameButton variant="gold" size="sm" onClick={createParty}>
              <Plus className="h-3 w-3 mr-1" /> Criar
            </GameButton>
            <GameButton variant="secondary" size="sm" onClick={() => setCreating(false)}>
              Cancelar
            </GameButton>
          </div>
        </div>
      ) : (
        <GameButton variant="gold" size="sm" onClick={() => setCreating(true)} className="w-full">
          <Plus className="h-3 w-3 mr-1" /> Criar Party
        </GameButton>
      )}

      {availableParties.length > 0 ? (
        <>
          <div className="rpg-label">Parties Disponíveis</div>
          {availableParties.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rpg-item-detail flex items-center justify-between"
              style={{ padding: '6px 8px' }}
            >
              <div>
                <span className="font-bold text-xs pixel-text">{p.name}</span>
                <p className="text-[9px] opacity-50">
                  <Users className="h-3 w-3 inline mr-1" />
                  {p.member_count}/{p.max_members}
                </p>
              </div>
              <GameButton variant="primary" size="sm" onClick={() => joinParty(p.id)}>
                Entrar
              </GameButton>
            </motion.div>
          ))}
        </>
      ) : (
        <div className="text-center py-4 opacity-40">
          <Users className="h-6 w-6 mx-auto mb-1" />
          <p className="text-[10px]">Nenhuma party disponível</p>
        </div>
      )}
    </div>
  );
}

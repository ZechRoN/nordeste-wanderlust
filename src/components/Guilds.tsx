import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, UserPlus, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { GamePanelTabs, GameButton } from '@/components/ui/game-panel';

interface Guild {
  id: string; name: string; description: string; leader_id: string; max_members: number;
}

interface GuildMember {
  id: string; character_id: string; role: string; characters: { name: string; level: number; class: string; };
}

interface GuildsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Guilds({ character }: GuildsProps) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [currentGuild, setCurrentGuild] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => { loadGuilds(); loadCurrentGuild(); }, [character.id]);

  const loadGuilds = async () => {
    const { data } = await supabase.from('guilds').select('*').order('created_at', { ascending: false }).limit(20);
    setGuilds(data || []);
    setLoading(false);
  };

  const loadCurrentGuild = async () => {
    const { data } = await supabase.from('guild_members').select('*, guilds(*)').eq('character_id', character.id).single();
    if (data) {
      setCurrentGuild((data as any).guilds);
      const { data: members } = await supabase.from('guild_members').select('*, characters(name, level, class)').eq('guild_id', (data as any).guilds.id);
      setGuildMembers((members as any) || []);
    }
  };

  const createGuild = async () => {
    if (!newName.trim()) { toast.error('Digite um nome'); return; }
    const { data, error } = await supabase.from('guilds').insert({ name: newName, description: newDesc, leader_id: character.id }).select().single();
    if (error) { toast.error('Erro ao criar guilda'); return; }
    await supabase.from('guild_members').insert({ guild_id: data.id, character_id: character.id, role: 'leader' });
    toast.success('Guilda criada!');
    setCreating(false); setNewName(''); setNewDesc('');
    loadGuilds(); loadCurrentGuild();
  };

  const joinGuild = async (guild: Guild) => {
    const { error } = await supabase.from('guild_members').insert({ guild_id: guild.id, character_id: character.id, role: 'member' });
    if (error) { toast.error('Erro ao entrar na guilda'); return; }
    toast.success(`Entrou na guilda ${guild.name}!`);
    loadGuilds(); loadCurrentGuild();
  };

  const leaveGuild = async () => {
    if (!currentGuild) return;
    const isLeader = currentGuild.leader_id === character.id;
    if (isLeader && guildMembers.length > 1) { toast.error('Transfira a liderança primeiro'); return; }
    await supabase.from('guild_members').delete().eq('character_id', character.id);
    if (isLeader) await supabase.from('guilds').delete().eq('id', currentGuild.id);
    toast.success('Saiu da guilda');
    setCurrentGuild(null); setGuildMembers([]);
    loadGuilds();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  if (currentGuild) {
    return (
      <div>
        <div className="rpg-item-detail mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: 'hsl(var(--rpg-gold))' }} />
                <span className="font-bold pixel-text" style={{ color: 'hsl(var(--rpg-gold))' }}>{currentGuild.name}</span>
              </div>
              <p className="text-[10px] opacity-50">{currentGuild.description}</p>
            </div>
            <GameButton size="sm" variant="danger" onClick={leaveGuild}>Sair</GameButton>
          </div>
        </div>

        <label className="rpg-label">Membros ({guildMembers.length}/{currentGuild.max_members})</label>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {guildMembers.map((m) => (
            <div key={m.id} className="rpg-class-card !cursor-default !p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.role === 'leader' && <Crown className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />}
                  <span className="text-xs font-bold">{m.characters.name}</span>
                  <span className="rpg-combatant-level text-[9px]">Nv.{m.characters.level}</span>
                </div>
                <span className="text-[9px] opacity-40">{m.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {creating ? (
        <div className="space-y-3">
          <label className="rpg-label">Nome da Guilda</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className="rpg-input" maxLength={50} placeholder="Nome..." />
          <label className="rpg-label">Descrição</label>
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="rpg-input" maxLength={200} placeholder="Descrição..." />
          <div className="flex gap-2">
            <GameButton variant="secondary" onClick={() => setCreating(false)}>Cancelar</GameButton>
            <GameButton variant="gold" onClick={createGuild}>Criar Guilda</GameButton>
          </div>
        </div>
      ) : (
        <div>
          <GameButton variant="gold" className="w-full mb-3" onClick={() => setCreating(true)}>
            <UserPlus className="h-3 w-3 mr-1" /> Criar Nova Guilda
          </GameButton>

          <label className="rpg-label">Guildas Disponíveis</label>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {guilds.length === 0 ? (
              <p className="text-center text-xs opacity-40 py-8">Nenhuma guilda. Crie a primeira!</p>
            ) : guilds.map((guild) => (
              <div key={guild.id} className="rpg-class-card">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs pixel-text">{guild.name}</span>
                    <p className="text-[10px] opacity-50">{guild.description || 'Sem descrição'}</p>
                  </div>
                  <GameButton size="sm" variant="primary" onClick={() => joinGuild(guild)}>Entrar</GameButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

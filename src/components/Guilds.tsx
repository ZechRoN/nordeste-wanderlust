import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Shield, UserPlus, UserX, Crown as CrownIcon, MessageSquareText, Copy, ArrowUpCircle, ArrowUpRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { GameButton } from '@/components/ui/game-panel';
import { Div } from '@/components/ui/Div';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { canManageGuild, canPromoteToViceLeader, guildLevelCost } from '@/lib/guild';

interface Guild {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  max_members: number;
  level: number;
  gold_bank: number;
  announcement: string;
}

interface GuildMember {
  id: string;
  character_id: string;
  role: string;
  donated_gold: number;
  characters: { name: string; level: number; class: string; user_id: string };
}

interface GuildsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Guilds({ character, onCharacterUpdate }: GuildsProps) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [currentGuild, setCurrentGuild] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmUpgradeOpen, setConfirmUpgradeOpen] = useState(false);
  const [confirmKick, setConfirmKick] = useState<{ memberId: string; name: string } | null>(null);
  const [pmOpen, setPmOpen] = useState<{ memberId: string; characterId: string; name: string } | null>(null);
  const [pmText, setPmText] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [profilesById, setProfilesById] = useState<Record<string, { is_online: boolean; last_seen_at: string | null }>>({});
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; guild_id: string; guild_name: string; inviter_name: string }>>([]);

  useEffect(() => { loadGuilds(); loadCurrentGuild(); loadPendingInvites(); }, [character.id]);

  const loadPendingInvites = async () => {
    const { data } = await supabase
      .from('guild_invites')
      .select('id, guild_id, inviter_character_id, guilds(name)')
      .eq('invitee_character_id', character.id)
      .eq('status', 'pending');
    const rows = (data as any[]) || [];
    const inviterIds = Array.from(new Set(rows.map((r) => r.inviter_character_id).filter(Boolean)));
    let inviterNames: Record<string, string> = {};
    if (inviterIds.length) {
      const { data: chars } = await supabase.from('characters').select('id, name').in('id', inviterIds);
      inviterNames = Object.fromEntries(((chars as any[]) || []).map((c) => [c.id, c.name]));
    }
    setPendingInvites(rows.map((r) => ({
      id: r.id,
      guild_id: r.guild_id,
      guild_name: r.guilds?.name ?? '—',
      inviter_name: inviterNames[r.inviter_character_id] ?? '—',
    })));
  };

  const invitePlayer = async () => {
    if (!currentGuild) { toast.error('Você não está em uma guilda'); return; }
    if (!canManage) { toast.error('Sem permissão para convidar'); return; }
    const name = inviteName.trim();
    if (!name) { toast.error('Digite o nome do personagem'); return; }
    setInviting(true);
    try {
      const { data: target, error: findErr } = await supabase
        .from('characters').select('id, name').ilike('name', name).maybeSingle();
      if (findErr || !target) { toast.error('Personagem não encontrado'); return; }
      if (target.id === character.id) { toast.error('Você não pode se convidar'); return; }
      // Check already in guild
      const { data: existingMember } = await supabase
        .from('guild_members').select('id').eq('character_id', target.id).maybeSingle();
      if (existingMember) { toast.error(`${target.name} já está em uma guilda`); return; }
      const { error: invErr } = await (supabase as any).from('guild_invites').insert({
        guild_id: currentGuild.id,
        inviter_character_id: character.id,
        invitee_character_id: target.id,
        status: 'pending',
      });
      if (invErr) { toast.error('Erro ao enviar convite'); return; }
      toast.success(`Convite enviado para ${target.name}`);
      setInviteName('');
    } finally {
      setInviting(false);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    const { error } = await (supabase as any).rpc('accept_guild_invite', { _invite_id: inviteId });
    if (error) { toast.error(error.message || 'Erro ao aceitar convite'); return; }
    toast.success('Você entrou na guilda!');
    await Promise.all([loadCurrentGuild(), loadPendingInvites(), loadGuilds()]);
  };

  const rejectInvite = async (inviteId: string) => {
    const { error } = await supabase.from('guild_invites')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', inviteId);
    if (error) { toast.error('Erro ao recusar'); return; }
    toast.success('Convite recusado');
    loadPendingInvites();
  };

  const loadGuilds = async () => {
    const { data } = await supabase.from('guilds').select('*').order('created_at', { ascending: false }).limit(20);
    setGuilds((data as any) || []);
    setLoading(false);
  };

  const loadCurrentGuild = async () => {
    const { data } = await supabase.from('guild_members').select('*, guilds(*)').eq('character_id', character.id).single();
    if (data) {
      setCurrentGuild((data as any).guilds);
      const { data: members } = await supabase
        .from('guild_members')
        .select('id, character_id, role, donated_gold, characters(name, level, class, user_id)')
        .eq('guild_id', (data as any).guilds.id);
      setGuildMembers((members as any) || []);
      setAnnouncementDraft(String((data as any).guilds?.announcement ?? ''));
    }
  };

  useEffect(() => {
    const userIds = Array.from(new Set(guildMembers.map((m) => m.characters?.user_id).filter(Boolean)));
    if (userIds.length === 0) return;

    const loadProfiles = async () => {
      const { data } = await (supabase as any).from('profiles').select('id, is_online, last_seen_at').in('id', userIds);
      const map: Record<string, { is_online: boolean; last_seen_at: string | null }> = {};
      (data as any[] | null)?.forEach((p) => {
        map[p.id] = { is_online: !!p.is_online, last_seen_at: p.last_seen_at ?? null };
      });
      setProfilesById(map);
    };

    loadProfiles();

    const ch = supabase
      .channel('profiles_guild')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
        const id = payload?.new?.id;
        if (!id || !userIds.includes(id)) return;
        setProfilesById((prev) => ({
          ...prev,
          [id]: { is_online: !!payload.new.is_online, last_seen_at: payload.new.last_seen_at ?? null },
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [guildMembers]);

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

  const myMember = useMemo(() => guildMembers.find((m) => m.character_id === character.id) ?? null, [guildMembers, character.id]);
  const canManage = canManageGuild(myMember?.role);
  const canPromoteVice = canPromoteToViceLeader(myMember?.role);
  const guildNextLevel = (currentGuild?.level ?? 1) + 1;
  const upgradeCost = guildLevelCost(guildNextLevel);
  const canUpgrade = !!currentGuild && canManage && (currentGuild.gold_bank ?? 0) >= upgradeCost;

  const filteredMembers = useMemo(() => {
    const now = Date.now();
    const list = guildMembers.map((m) => {
      const p = profilesById[m.characters?.user_id];
      const last = p?.last_seen_at ? new Date(p.last_seen_at).getTime() : 0;
      const online = !!p?.is_online && now - last < 60000;
      return { ...m, online };
    });
    if (!onlyOnline) return list;
    return list.filter((m) => m.online);
  }, [guildMembers, profilesById, onlyOnline]);

  const selectedMember = useMemo(() => filteredMembers.find((m) => m.id === selectedMemberId) ?? null, [filteredMembers, selectedMemberId]);

  const formatRole = (role: string) => {
    if (role === 'leader') return 'Guild Leader';
    if (role === 'vice_leader') return 'Vice Leader';
    if (role === 'officer') return 'Officer';
    return 'Member';
  };

  const donateGold = async () => {
    if (!currentGuild) return;
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Valor inválido'); return; }
    if (amount > character.gold) { toast.error('Ouro insuficiente'); return; }
    const { error } = await (supabase as any).rpc('guild_deposit_gold', { p_character_id: character.id, p_amount: amount });
    if (error) { toast.error('Erro ao doar'); return; }
    toast.success('Doação registrada!');
    setDepositAmount('');
    onCharacterUpdate({ ...character, gold: character.gold - amount });
    await loadCurrentGuild();
  };

  const upgradeGuild = async () => {
    if (!currentGuild) return;
    const { error } = await (supabase as any).rpc('guild_upgrade', { p_character_id: character.id });
    if (error) { toast.error('Não foi possível evoluir a guilda'); return; }
    toast.success('Guilda evoluída!');
    await loadCurrentGuild();
  };

  const saveAnnouncement = async () => {
    if (!currentGuild) return;
    const text = announcementDraft.slice(0, 200);
    const { error } = await (supabase as any).rpc('guild_set_announcement', { p_character_id: character.id, p_text: text });
    if (error) { toast.error('Sem permissão para editar'); return; }
    toast.success('Anúncio atualizado!');
    await loadCurrentGuild();
  };

  const setMemberRole = async (memberId: string, newRole: 'vice_leader' | 'officer' | 'member') => {
    const { error } = await (supabase as any).rpc('guild_set_member_role', { p_actor_character_id: character.id, p_target_member_id: memberId, p_new_role: newRole });
    if (error) { toast.error('Sem permissão'); return; }
    toast.success('Cargo atualizado!');
    await loadCurrentGuild();
  };

  const kickMember = async (memberId: string) => {
    const { error } = await (supabase as any).rpc('guild_kick_member', { p_actor_character_id: character.id, p_target_member_id: memberId });
    if (error) { toast.error('Não foi possível expulsar'); return; }
    toast.success('Membro expulso');
    await loadCurrentGuild();
  };

  const sendPm = async () => {
    if (!pmOpen) return;
    const text = pmText.trim().slice(0, 200);
    if (!text) { toast.error('Digite uma mensagem'); return; }
    const { error } = await (supabase as any).from('private_messages').insert({
      sender_character_id: character.id,
      recipient_character_id: pmOpen.characterId,
      message: text,
    } as any);
    if (error) { toast.error('Erro ao enviar PM'); return; }
    toast.success('PM enviada');
    setPmText('');
    setPmOpen(null);
  };

  const copyName = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast.success('Nome copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  if (loading) return <Div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></Div>;

  if (currentGuild) {
    return (
      <Div className="space-y-3">
        <Div className="rpg-item-detail mb-1">
          <Div className="flex items-start justify-between gap-2">
            <Div className="min-w-0">
              <Div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: 'hsl(var(--rpg-gold))' }} />
                <span className="font-bold pixel-text truncate" style={{ color: 'hsl(var(--rpg-gold))' }}>{currentGuild.name}</span>
                <span className="rpg-combatant-level text-[9px]">Lv {currentGuild.level ?? 1}</span>
              </Div>
              <p className="text-[10px] opacity-50">{currentGuild.description}</p>
              <p className="text-[10px] opacity-60 mt-1">
                Banco: <span className="rpg-gold-display text-[11px]">🪙 {Number(currentGuild.gold_bank ?? 0).toLocaleString()}</span>
              </p>
            </Div>

            <GameButton size="sm" variant="danger" onClick={() => setConfirmLeaveOpen(true)}>
              <LogOut className="h-3 w-3 mr-1" /> Sair
            </GameButton>
          </Div>
        </Div>

        <Div className="rpg-item-detail">
          <Div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold">Progressão</span>
            <span className="text-[10px] opacity-60">Próximo nível: {guildNextLevel}</span>
          </Div>
          <Div className="flex items-center justify-between gap-2 mt-2">
            <Div className="text-[10px] opacity-70">
              Custo: <span className="rpg-gold-display text-[11px]">🪙 {upgradeCost.toLocaleString()}</span>
            </Div>
            <Div className="flex items-center gap-2">
              <input
                className="rpg-input !w-[130px]"
                placeholder="Doar gold"
                value={depositAmount}
                inputMode="numeric"
                onChange={(e) => setDepositAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
              />
              <GameButton size="sm" variant="secondary" onClick={donateGold}>Doar</GameButton>
              <GameButton size="sm" variant="gold" onClick={() => setConfirmUpgradeOpen(true)} disabled={!canManage}>
                Upgrade
              </GameButton>
            </Div>
          </Div>
          {!canManage && (
            <Div className="text-[10px] opacity-50 mt-2">
              Apenas líder e vice-líder podem evoluir a guilda.
            </Div>
          )}
          {canManage && (currentGuild.gold_bank ?? 0) < upgradeCost && (
            <Div className="text-[10px] opacity-50 mt-2">
              Banco insuficiente. Continue doando para acumular.
            </Div>
          )}
        </Div>

        <Div className="rpg-item-detail">
          <Div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold">Anúncios</span>
            <span className="text-[10px] opacity-60">{announcementDraft.length}/200</span>
          </Div>
          <Textarea
            className="mt-2"
            value={announcementDraft}
            maxLength={200}
            onChange={(e) => setAnnouncementDraft(e.target.value.slice(0, 200))}
            disabled={!canManage}
            placeholder={'DISCORD DA GUILD\nhttps://discord.gg/Uq7MYUHQ4p'}
          />
          <Div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-[10px] opacity-60">
              {canManage ? 'Editável por líder/vice-líder' : 'Somente líder/vice-líder podem editar'}
            </span>
            <GameButton size="sm" variant="primary" onClick={saveAnnouncement} disabled={!canManage}>
              Salvar
            </GameButton>
          </Div>
        </Div>

        {/* Convidar membros */}
        {canManage && (
          <Div className="rpg-item-detail">
            <Div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold">Convidar membro</span>
              <span className="text-[10px] opacity-60">Só líder/vice-líder</span>
            </Div>
            <Div className="flex items-center gap-2">
              <input
                className="rpg-input flex-1"
                placeholder="Nome do personagem"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value.slice(0, 32))}
                onKeyDown={(e) => { if (e.key === 'Enter') invitePlayer(); }}
                maxLength={32}
              />
              <GameButton size="sm" variant="gold" onClick={invitePlayer} disabled={inviting || !inviteName.trim()}>
                <UserPlus className="h-3 w-3 mr-1" /> Convidar
              </GameButton>
            </Div>
          </Div>
        )}

        <Div className="flex items-center justify-between">
          <label className="rpg-label">Membros ({guildMembers.length}/{currentGuild.max_members})</label>
          <label className="flex items-center gap-2 text-[11px] opacity-80 select-none">
            <Checkbox checked={onlyOnline} onCheckedChange={(v) => setOnlyOnline(v === true)} />
            Online
          </label>
        </Div>


        <Div className="rpg-item-detail !p-2">
          <Div className="grid grid-cols-[1fr_90px_56px_84px_90px_18px] gap-2 text-[10px] font-bold opacity-80">
            <span>Nome</span>
            <span>Patente</span>
            <span>Nível</span>
            <span>Classe</span>
            <span>Doado</span>
            <span />
          </Div>
        </Div>

        <Div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
          {filteredMembers.map((m) => (
            <DropdownMenu key={m.id}>
              <DropdownMenuTrigger asChild>
                <Div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMemberId(m.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMemberId(m.id); }}
                  className="rpg-class-card !cursor-pointer !p-2"
                >
                  <Div className="grid grid-cols-[1fr_90px_56px_84px_90px_18px] gap-2 items-center">
                    <Div className="flex items-center gap-2 min-w-0">
                      {m.role === 'leader' && <Crown className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />}
                      {m.role === 'vice_leader' && <CrownIcon className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />}
                      <span className="text-xs font-bold truncate">{m.characters.name}</span>
                    </Div>
                    <span className="text-[10px] opacity-70">{formatRole(m.role)}</span>
                    <span className="rpg-combatant-level text-[9px]">Nv.{m.characters.level}</span>
                    <span className="text-[10px] opacity-70 capitalize">{m.characters.class}</span>
                    <span className="rpg-gold-display text-[11px]">🪙 {Number(m.donated_gold ?? 0).toLocaleString()}</span>
                    <span className={`inline-block h-2 w-2 rounded-full ${m.online ? 'bg-green-500' : 'bg-neutral-500'}`} aria-label={m.online ? 'Online' : 'Offline'} />
                  </Div>
                </Div>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => copyName(m.characters.name)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar nome
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setPmOpen({ memberId: m.id, characterId: m.character_id, name: m.characters.name }); }}>
                  <MessageSquareText className="h-4 w-4 mr-2" />
                  Enviar PM
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!canManage || m.character_id === character.id || m.role === 'leader'}
                  onClick={() => setConfirmKick({ memberId: m.id, name: m.characters.name })}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Expulsar membro
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canManage || !canPromoteVice || m.role === 'leader'}
                  onClick={() => setMemberRole(m.id, 'vice_leader')}
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Promover p/ Vice-líder
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canManage || m.role === 'leader'}
                  onClick={() => setMemberRole(m.id, 'officer')}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Promover p/ Officer
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canManage || m.role === 'leader'}
                  onClick={() => setMemberRole(m.id, 'member')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Definir como Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </Div>

        {selectedMember && (
          <Div className="rpg-item-detail">
            <Div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold">Informações</span>
              <span className="text-[10px] opacity-60">{selectedMember.online ? 'Online' : 'Offline'}</span>
            </Div>
            <Div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <Div className="flex justify-between"><span className="opacity-60">Nome</span><span className="font-bold">{selectedMember.characters.name}</span></Div>
              <Div className="flex justify-between"><span className="opacity-60">Patente</span><span>{formatRole(selectedMember.role)}</span></Div>
              <Div className="flex justify-between"><span className="opacity-60">Nível</span><span>Nv.{selectedMember.characters.level}</span></Div>
              <Div className="flex justify-between"><span className="opacity-60">Classe</span><span className="capitalize">{selectedMember.characters.class}</span></Div>
              <Div className="flex justify-between col-span-2"><span className="opacity-60">Gold doado</span><span className="rpg-gold-display text-[12px]">🪙 {Number(selectedMember.donated_gold ?? 0).toLocaleString()}</span></Div>
            </Div>
          </Div>
        )}

        <AlertDialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja fazer esta ação?</AlertDialogTitle>
              <AlertDialogDescription>
                Você vai sair da guilda.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={leaveGuild}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmUpgradeOpen} onOpenChange={setConfirmUpgradeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja fazer esta ação?</AlertDialogTitle>
              <AlertDialogDescription>
                Upgrade para nível {guildNextLevel} por 🪙 {upgradeCost.toLocaleString()}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={upgradeGuild} disabled={!canUpgrade}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!confirmKick} onOpenChange={(v) => { if (!v) setConfirmKick(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza que deseja fazer esta ação?</AlertDialogTitle>
              <AlertDialogDescription>
                Expulsar {confirmKick?.name} da guilda?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmKick(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!confirmKick) return;
                  await kickMember(confirmKick.memberId);
                  setConfirmKick(null);
                }}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!pmOpen} onOpenChange={(v) => { if (!v) { setPmOpen(null); setPmText(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enviar PM</AlertDialogTitle>
              <AlertDialogDescription>
                Para: {pmOpen?.name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea value={pmText} onChange={(e) => setPmText(e.target.value.slice(0, 200))} maxLength={200} placeholder="Mensagem..." />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setPmOpen(null); setPmText(''); }}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={sendPm}>Enviar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Div>
    );
  }

  return (
    <Div>
      {creating ? (
        <Div className="space-y-3">
          <label className="rpg-label">Nome da Guilda</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className="rpg-input" maxLength={50} placeholder="Nome..." />
          <label className="rpg-label">Descrição</label>
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="rpg-input" maxLength={200} placeholder="Descrição..." />
          <Div className="flex gap-2">
            <GameButton variant="secondary" onClick={() => setCreating(false)}>Cancelar</GameButton>
            <GameButton variant="gold" onClick={createGuild}>Criar Guilda</GameButton>
          </Div>
        </Div>
      ) : (
        <Div>
          {pendingInvites.length > 0 && (
            <Div className="rpg-item-detail mb-3">
              <Div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" style={{ color: 'hsl(var(--rpg-gold))' }} />
                <span className="text-xs font-bold">Convites pendentes ({pendingInvites.length})</span>
              </Div>
              <Div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <Div key={inv.id} className="flex items-center justify-between gap-2 rpg-class-card !p-2">
                    <Div className="min-w-0">
                      <Div className="text-xs font-bold truncate">{inv.guild_name}</Div>
                      <Div className="text-[10px] opacity-60 truncate">Convidado por {inv.inviter_name}</Div>
                    </Div>
                    <Div className="flex items-center gap-1 shrink-0">
                      <GameButton size="sm" variant="gold" onClick={() => acceptInvite(inv.id)}>Aceitar</GameButton>
                      <GameButton size="sm" variant="danger" onClick={() => rejectInvite(inv.id)}>Recusar</GameButton>
                    </Div>
                  </Div>
                ))}
              </Div>
            </Div>
          )}

          <GameButton variant="gold" className="w-full mb-3" onClick={() => setCreating(true)}>
            <UserPlus className="h-3 w-3 mr-1" /> Criar Nova Guilda
          </GameButton>


          <label className="rpg-label">Guildas Disponíveis</label>
          <Div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {guilds.length === 0 ? (
              <p className="text-center text-xs opacity-40 py-8">Nenhuma guilda. Crie a primeira!</p>
            ) : guilds.map((guild) => (
              <Div key={guild.id} className="rpg-class-card">
                <Div className="flex items-center justify-between gap-2">
                  <Div className="min-w-0">
                    <span className="font-bold text-xs pixel-text">{guild.name}</span>
                    <p className="text-[10px] opacity-50">{guild.description || 'Sem descrição'}</p>
                  </Div>
                  <GameButton size="sm" variant="primary" onClick={() => joinGuild(guild)}>Entrar</GameButton>
                </Div>
              </Div>
            ))}
          </Div>
        </Div>
      )}
    </Div>
  );
}

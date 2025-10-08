import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, UserPlus, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Guild {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  max_members: number;
  created_at: string;
}

interface GuildMember {
  id: string;
  character_id: string;
  role: string;
  joined_at: string;
  characters: {
    name: string;
    level: number;
    class: string;
  };
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDescription, setNewGuildDescription] = useState('');

  useEffect(() => {
    loadGuilds();
    loadCurrentGuild();
  }, [character.id]);

  const loadGuilds = async () => {
    const { data, error } = await supabase
      .from('guilds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao carregar guildas:', error);
    } else {
      setGuilds(data || []);
    }
    setLoading(false);
  };

  const loadCurrentGuild = async () => {
    const { data: memberData, error: memberError } = await supabase
      .from('guild_members')
      .select('*, guilds(*)')
      .eq('character_id', character.id)
      .single();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('Erro ao carregar guilda atual:', memberError);
      return;
    }

    if (memberData) {
      setCurrentGuild((memberData as any).guilds);
      loadGuildMembers((memberData as any).guilds.id);
    }
  };

  const loadGuildMembers = async (guildId: string) => {
    const { data, error } = await supabase
      .from('guild_members')
      .select('*, characters(name, level, class)')
      .eq('guild_id', guildId);

    if (error) {
      console.error('Erro ao carregar membros:', error);
    } else {
      setGuildMembers((data as any) || []);
    }
  };

  const createGuild = async () => {
    if (!newGuildName.trim()) {
      toast.error('Digite um nome para a guilda');
      return;
    }

    const { data: guildData, error: guildError } = await supabase
      .from('guilds')
      .insert({
        name: newGuildName,
        description: newGuildDescription,
        leader_id: character.id
      })
      .select()
      .single();

    if (guildError) {
      toast.error('Erro ao criar guilda');
      console.error(guildError);
      return;
    }

    const { error: memberError } = await supabase
      .from('guild_members')
      .insert({
        guild_id: guildData.id,
        character_id: character.id,
        role: 'leader'
      });

    if (memberError) {
      toast.error('Erro ao adicionar líder');
      return;
    }

    toast.success('Guilda criada com sucesso!');
    setCreateDialogOpen(false);
    setNewGuildName('');
    setNewGuildDescription('');
    loadGuilds();
    loadCurrentGuild();
  };

  const joinGuild = async (guild: Guild) => {
    const { data: membersCount } = await supabase
      .from('guild_members')
      .select('id', { count: 'exact' })
      .eq('guild_id', guild.id);

    if ((membersCount?.length || 0) >= guild.max_members) {
      toast.error('Guilda está cheia');
      return;
    }

    const { error } = await supabase
      .from('guild_members')
      .insert({
        guild_id: guild.id,
        character_id: character.id,
        role: 'member'
      });

    if (error) {
      toast.error('Erro ao entrar na guilda');
      console.error(error);
      return;
    }

    toast.success(`Você entrou na guilda ${guild.name}!`);
    loadGuilds();
    loadCurrentGuild();
  };

  const leaveGuild = async () => {
    if (!currentGuild) return;

    const isLeader = currentGuild.leader_id === character.id;
    if (isLeader && guildMembers.length > 1) {
      toast.error('Transfira a liderança antes de sair');
      return;
    }

    const { error } = await supabase
      .from('guild_members')
      .delete()
      .eq('character_id', character.id);

    if (error) {
      toast.error('Erro ao sair da guilda');
      return;
    }

    if (isLeader) {
      await supabase
        .from('guilds')
        .delete()
        .eq('id', currentGuild.id);
    }

    toast.success('Você saiu da guilda');
    setCurrentGuild(null);
    setGuildMembers([]);
    loadGuilds();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando guildas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guilda Atual */}
      {currentGuild ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {currentGuild.name}
                </CardTitle>
                <CardDescription>{currentGuild.description}</CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={leaveGuild}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Membros:</span>
                <span className="font-medium">
                  {guildMembers.length}/{currentGuild.max_members}
                </span>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {guildMembers.map((member) => (
                    <Card key={member.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.characters.name}</p>
                            {member.role === 'leader' && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Nível {member.characters.level} • {member.characters.class}
                          </p>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Criar Guilda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guildas
              </CardTitle>
              <CardDescription>
                Crie ou junte-se a uma guilda para jogar com outros aventureiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Nova Guilda
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Guilda</DialogTitle>
                    <DialogDescription>
                      Crie sua própria guilda e convide outros jogadores
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome da Guilda</label>
                      <Input
                        value={newGuildName}
                        onChange={(e) => setNewGuildName(e.target.value)}
                        placeholder="Digite o nome da guilda"
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={newGuildDescription}
                        onChange={(e) => setNewGuildDescription(e.target.value)}
                        placeholder="Descreva sua guilda"
                        maxLength={200}
                      />
                    </div>
                    <Button onClick={createGuild} className="w-full">
                      Criar Guilda
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Guildas Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle>Guildas Disponíveis</CardTitle>
              <CardDescription>Encontre uma guilda para se juntar</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {guilds.map((guild) => (
                    <Card key={guild.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold">{guild.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {guild.description || 'Sem descrição'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinGuild(guild)}
                        >
                          Entrar
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {guilds.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma guilda disponível. Crie a primeira!
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

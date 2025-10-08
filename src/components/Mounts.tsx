import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Rabbit, Zap, Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Mount {
  id: string;
  name: string;
  description: string;
  biome: string;
  rarity: string;
  speed_bonus: number;
  stamina_bonus: number;
  capture_difficulty: number;
  special_ability: string;
}

interface CharacterMount {
  id: string;
  mount_id: string;
  is_active: boolean;
  captured_at: string;
  mounts: Mount;
}

interface MountsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Mounts({ character, onCharacterUpdate }: MountsProps) {
  const [availableMounts, setAvailableMounts] = useState<Mount[]>([]);
  const [capturedMounts, setCapturedMounts] = useState<CharacterMount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMounts();
  }, [character.id, character.current_biome]);

  const loadMounts = async () => {
    // Carregar montarias disponíveis no bioma atual
    const { data: available, error: availError } = await supabase
      .from('mounts')
      .select('*')
      .eq('biome', character.current_biome);

    // Carregar montarias capturadas pelo personagem
    const { data: captured, error: captError } = await supabase
      .from('character_mounts')
      .select('*, mounts(*)')
      .eq('character_id', character.id);

    if (availError) console.error('Erro ao carregar montarias:', availError);
    if (captError) console.error('Erro ao carregar montarias capturadas:', captError);

    setAvailableMounts(available || []);
    setCapturedMounts((captured as any) || []);
    setLoading(false);
  };

  const captureMount = async (mount: Mount) => {
    const captureChance = Math.max(10, 100 - (mount.capture_difficulty * 10));
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll > captureChance) {
      toast.error(`Falha ao capturar ${mount.name}! Tente novamente.`);
      return;
    }

    const { error } = await supabase
      .from('character_mounts')
      .insert({
        character_id: character.id,
        mount_id: mount.id,
        is_active: capturedMounts.length === 0
      });

    if (error) {
      toast.error('Erro ao capturar montaria');
      console.error(error);
      return;
    }

    toast.success(`${mount.name} capturado com sucesso!`);
    loadMounts();
  };

  const activateMount = async (characterMount: CharacterMount) => {
    // Desativar todas as montarias
    await supabase
      .from('character_mounts')
      .update({ is_active: false })
      .eq('character_id', character.id);

    // Ativar a montaria selecionada
    const { error } = await supabase
      .from('character_mounts')
      .update({ is_active: true })
      .eq('id', characterMount.id);

    if (error) {
      toast.error('Erro ao ativar montaria');
      return;
    }

    toast.success(`${characterMount.mounts.name} ativado!`);
    loadMounts();
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-500',
      uncommon: 'text-green-500',
      rare: 'text-blue-500',
      epic: 'text-purple-500',
      legendary: 'text-orange-500'
    };
    return colors[rarity] || 'text-gray-500';
  };

  const getCaptureChance = (difficulty: number) => {
    return Math.max(10, 100 - (difficulty * 10));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando montarias...</p>
        </CardContent>
      </Card>
    );
  }

  const activeMount = capturedMounts.find(m => m.is_active);

  return (
    <div className="space-y-6">
      {/* Montaria Ativa */}
      {activeMount && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rabbit className="h-5 w-5 text-primary" />
              Montaria Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Rabbit className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${getRarityColor(activeMount.mounts.rarity)}`}>
                  {activeMount.mounts.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeMount.mounts.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-blue-500" />
                    +{activeMount.mounts.speed_bonus} Velocidade
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-green-500" />
                    +{activeMount.mounts.stamina_bonus} Stamina
                  </div>
                </div>
                {activeMount.mounts.special_ability && (
                  <Badge className="mt-2" variant="outline">
                    {activeMount.mounts.special_ability}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Montarias */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="captured">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="captured">
                Suas Montarias ({capturedMounts.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                Disponíveis em {character.current_biome}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="captured">
              {capturedMounts.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Rabbit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não capturou nenhuma montaria</p>
                  <p className="text-sm mt-2">Explore o mundo para encontrar e capturar montarias!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3 mt-4">
                    {capturedMounts.map((cm) => {
                      const mount = cm.mounts;
                      return (
                        <Card
                          key={cm.id}
                          className={`border-2 ${cm.is_active ? 'border-primary' : 'border-border'}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <Rabbit className="h-6 w-6" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className={`font-bold ${getRarityColor(mount.rarity)}`}>
                                      {mount.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {mount.description}
                                    </p>
                                  </div>
                                  {cm.is_active && (
                                    <Badge variant="default">Ativo</Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs mb-2">
                                  <span>+{mount.speed_bonus} Velocidade</span>
                                  <span>+{mount.stamina_bonus} Stamina</span>
                                </div>

                                {mount.special_ability && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    ⚡ {mount.special_ability}
                                  </p>
                                )}

                                {!cm.is_active && (
                                  <Button
                                    size="sm"
                                    onClick={() => activateMount(cm)}
                                    className="w-full mt-2"
                                  >
                                    Ativar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="available">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3 mt-4">
                  {availableMounts
                    .filter(mount => !capturedMounts.some(cm => cm.mount_id === mount.id))
                    .map((mount) => {
                      const captureChance = getCaptureChance(mount.capture_difficulty);
                      return (
                        <Card key={mount.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <Lock className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className={`font-bold ${getRarityColor(mount.rarity)}`}>
                                      {mount.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {mount.description}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {mount.rarity}
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-3 text-xs mb-2">
                                  <span>+{mount.speed_bonus} Velocidade</span>
                                  <span>+{mount.stamina_bonus} Stamina</span>
                                </div>

                                {mount.special_ability && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    ⚡ {mount.special_ability}
                                  </p>
                                )}

                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Chance de Captura</span>
                                    <span className="font-medium">{captureChance}%</span>
                                  </div>
                                  <Progress value={captureChance} className="h-1.5" />
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => captureMount(mount)}
                                  className="w-full mt-3"
                                >
                                  Tentar Capturar
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  {availableMounts.filter(m => !capturedMounts.some(cm => cm.mount_id === m.id)).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Você já capturou todas as montarias disponíveis neste bioma!
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

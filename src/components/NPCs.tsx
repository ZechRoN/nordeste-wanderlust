import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, User, Coins, Package } from 'lucide-react';
import { toast } from 'sonner';

interface NPC {
  id: string;
  name: string;
  npc_type: string;
  biome: string;
  dialogue: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  value: number;
  strength_bonus: number;
  agility_bonus: number;
  intelligence_bonus: number;
  vitality_bonus: number;
  luck_bonus: number;
  required_level: number;
}

interface NPCsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function NPCs({ character, onCharacterUpdate }: NPCsProps) {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNPCs();
    loadShopItems();
  }, [character.current_biome]);

  const loadNPCs = async () => {
    const { data, error } = await supabase
      .from('npcs' as any)
      .select('*')
      .eq('biome', character.current_biome);

    if (error) {
      console.error('Erro ao carregar NPCs:', error);
    } else {
      const npcsData = (data as any) || [];
      setNpcs(npcsData);
      if (npcsData && npcsData.length > 0) {
        setSelectedNPC(npcsData.find((n: any) => n.npc_type === 'merchant') || npcsData[0]);
      }
    }
    setLoading(false);
  };

  const loadShopItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .lte('required_level', character.level + 5)
      .order('value', { ascending: true });

    if (error) {
      console.error('Erro ao carregar itens:', error);
    } else {
      setShopItems(data || []);
    }
  };

  const buyItem = async (item: Item) => {
    if (character.gold < item.value) {
      toast.error('Ouro insuficiente!');
      return;
    }

    // Adicionar item ao inventário
    const { error: itemError } = await supabase
      .from('character_items')
      .insert({
        character_id: character.id,
        item_id: item.id,
        quantity: 1
      });

    if (itemError) {
      toast.error('Erro ao comprar item');
      console.error(itemError);
      return;
    }

    // Atualizar ouro do personagem
    const newGold = character.gold - item.value;
    const { error: charError } = await supabase
      .from('characters')
      .update({ gold: newGold })
      .eq('id', character.id);

    if (charError) {
      toast.error('Erro ao atualizar ouro');
      return;
    }

    toast.success(`${item.name} comprado por ${item.value} ouro!`);
    onCharacterUpdate({ ...character, gold: newGold });
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

  const getNPCIcon = (type: string) => {
    switch (type) {
      case 'merchant':
        return <ShoppingCart className="h-5 w-5" />;
      case 'quest_giver':
        return <Package className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando NPCs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            NPCs em {character.current_biome}
          </CardTitle>
          <CardDescription>
            Interaja com os habitantes locais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {npcs.map((npc) => (
              <Button
                key={npc.id}
                variant={selectedNPC?.id === npc.id ? "default" : "outline"}
                onClick={() => setSelectedNPC(npc)}
                className="flex items-center gap-2"
              >
                {getNPCIcon(npc.npc_type)}
                {npc.name}
              </Button>
            ))}
          </div>

          {selectedNPC && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getNPCIcon(selectedNPC.npc_type)}
                  {selectedNPC.name}
                </CardTitle>
                <Badge variant="outline" className="w-fit">
                  {selectedNPC.npc_type === 'merchant' ? 'Mercador' : 'NPC'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 italic">
                  "{selectedNPC.dialogue}"
                </p>

                {selectedNPC.npc_type === 'merchant' && (
                  <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="buy">Comprar</TabsTrigger>
                      <TabsTrigger value="sell">Vender</TabsTrigger>
                    </TabsList>

                    <TabsContent value="buy">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Seu ouro:</span>
                          <span className="font-bold text-yellow-600 flex items-center gap-1">
                            <Coins className="h-4 w-4" />
                            {character.gold.toLocaleString()}
                          </span>
                        </div>

                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-3">
                            {shopItems.map((item) => (
                              <Card key={item.id} className="border">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className={`font-bold ${getRarityColor(item.rarity)}`}>
                                        {item.name}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {item.description}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                      Nv. {item.required_level}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                    {item.strength_bonus > 0 && (
                                      <span>+{item.strength_bonus} FOR</span>
                                    )}
                                    {item.agility_bonus > 0 && (
                                      <span>+{item.agility_bonus} AGI</span>
                                    )}
                                    {item.intelligence_bonus > 0 && (
                                      <span>+{item.intelligence_bonus} INT</span>
                                    )}
                                    {item.vitality_bonus > 0 && (
                                      <span>+{item.vitality_bonus} VIT</span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-yellow-600 flex items-center gap-1">
                                      <Coins className="h-4 w-4" />
                                      {item.value}
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={() => buyItem(item)}
                                      disabled={
                                        character.gold < item.value ||
                                        character.level < item.required_level
                                      }
                                    >
                                      Comprar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </TabsContent>

                    <TabsContent value="sell">
                      <div className="text-center text-muted-foreground py-8">
                        Venda itens do seu inventário por 50% do valor
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

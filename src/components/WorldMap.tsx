import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Swords, Building, Mountain, TreePine } from 'lucide-react';
import { toast } from 'sonner';

interface Character {
  id: string;
  position_x: number;
  position_y: number;
  current_biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz';
  gold: number;
}

interface Location {
  id: string;
  name: string;
  description: string;
  biome: string;
  position_x: number;
  position_y: number;
  location_type: string;
  is_discovered: boolean;
}

interface Creature {
  id: string;
  name: string;
  description: string;
  biome: string;
  level: number;
  rarity: string;
  special_ability: string;
}

interface WorldMapProps {
  character: Character;
  onCharacterUpdate: (updatedCharacter: any) => void;
  onStartCombat: (creature: Creature) => void;
}

const getBiomeDisplayName = (biome: string) => {
  const biomeNames = {
    caatinga: 'Caatinga',
    agreste: 'Agreste', 
    litoral: 'Litoral',
    santa_cruz: 'Santa Cruz'
  };
  return biomeNames[biome as keyof typeof biomeNames] || biome;
};

const getBiomeColor = (biome: string) => {
  const colors = {
    caatinga: 'bg-yellow-600',
    agreste: 'bg-green-600',
    litoral: 'bg-blue-600',
    santa_cruz: 'bg-purple-600'
  };
  return colors[biome as keyof typeof colors] || 'bg-gray-600';
};

const getLocationIcon = (type: string) => {
  const icons = {
    city: Building,
    dungeon: Mountain,
    resource: TreePine,
    landmark: MapPin
  };
  return icons[type as keyof typeof icons] || MapPin;
};

export function WorldMap({ character, onCharacterUpdate, onStartCombat }: WorldMapProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedBiome, setSelectedBiome] = useState<'caatinga' | 'agreste' | 'litoral' | 'santa_cruz'>(character.current_biome);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [locationsResult, creaturesResult] = await Promise.all([
        supabase.from('locations').select('*'),
        supabase.from('creatures').select('*')
      ]);

      if (locationsResult.data) setLocations(locationsResult.data);
      if (creaturesResult.data) setCreatures(creaturesResult.data);
    } catch (error) {
      toast.error('Erro ao carregar o mapa');
    }
  };

  const moveCharacter = async (newX: number, newY: number, newBiome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz') => {
    if (isMoving) return;
    
    setIsMoving(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .update({ 
          position_x: newX, 
          position_y: newY, 
          current_biome: newBiome 
        })
        .eq('id', character.id)
        .select()
        .single();

      if (error) throw error;

      onCharacterUpdate(data);
      setSelectedBiome(newBiome);
      toast.success(`Movido para ${getBiomeDisplayName(newBiome)}`);
      
      // Chance de encontrar criatura
      if (Math.random() < 0.3) {
        const biomeCreatures = creatures.filter(c => c.biome === newBiome);
        if (biomeCreatures.length > 0) {
          const randomCreature = biomeCreatures[Math.floor(Math.random() * biomeCreatures.length)];
          setTimeout(() => {
            toast.info(`Criatura encontrada: ${randomCreature.name}!`);
            onStartCombat(randomCreature);
          }, 1000);
        }
      }
    } catch (error) {
      toast.error('Erro ao mover personagem');
    } finally {
      setIsMoving(false);
    }
  };

  const exploreArea = async () => {
    // Chance de encontrar item ou gold
    const chance = Math.random();
    if (chance < 0.4) {
      const goldFound = Math.floor(Math.random() * 50) + 10;
      try {
        await supabase
          .from('characters')
          .update({ gold: character.gold + goldFound })
          .eq('id', character.id);
        
        toast.success(`Encontrou ${goldFound} moedas de ouro!`);
        onCharacterUpdate({ ...character, gold: character.gold + goldFound });
      } catch (error) {
        toast.error('Erro na exploração');
      }
    } else if (chance < 0.6) {
      const biomeCreatures = creatures.filter(c => c.biome === selectedBiome);
      if (biomeCreatures.length > 0) {
        const randomCreature = biomeCreatures[Math.floor(Math.random() * biomeCreatures.length)];
        toast.info(`Criatura encontrada: ${randomCreature.name}!`);
        onStartCombat(randomCreature);
      }
    } else {
      toast.info('Você não encontrou nada desta vez...');
    }
  };

  const biomes = ['caatinga', 'agreste', 'litoral', 'santa_cruz'];
  const biomeLocations = locations.filter(l => l.biome === selectedBiome);
  const biomeCreatures = creatures.filter(c => c.biome === selectedBiome);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mundo de Oxente
          </CardTitle>
          <CardDescription>
            Explore os biomas, descubra locais e enfrente criaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {biomes.map((biome) => (
              <Button
                key={biome}
                variant={selectedBiome === biome ? "default" : "outline"}
                onClick={() => moveCharacter(
                  Math.floor(Math.random() * 100),
                  Math.floor(Math.random() * 100),
                  biome
                )}
                disabled={isMoving}
                className="h-20 flex flex-col"
              >
                <div className={`w-4 h-4 rounded-full ${getBiomeColor(biome)} mb-2`} />
                {getBiomeDisplayName(biome)}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Bioma: {getBiomeDisplayName(selectedBiome)}
              </Badge>
              <Badge variant="outline">
                Posição: ({character.position_x}, {character.position_y})
              </Badge>
            </div>
            <Button onClick={exploreArea} variant="secondary">
              Explorar Área
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Locais de Interesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {biomeLocations.map((location) => {
                const IconComponent = getLocationIcon(location.location_type);
                return (
                  <div key={location.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <IconComponent className="h-5 w-5" />
                    <div className="flex-1">
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm text-muted-foreground">{location.description}</p>
                    </div>
                    <Badge variant={location.location_type === 'city' ? 'default' : 'secondary'}>
                      {location.location_type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Criaturas da Região
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {biomeCreatures.slice(0, 5).map((creature) => (
                <div key={creature.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{creature.name}</h4>
                      <Badge 
                        variant={creature.rarity === 'common' ? 'secondary' : 
                                creature.rarity === 'uncommon' ? 'default' :
                                creature.rarity === 'rare' ? 'destructive' : 'outline'}
                      >
                        Nv. {creature.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{creature.description}</p>
                    <p className="text-xs text-primary">{creature.special_ability}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onStartCombat(creature)}
                    variant="outline"
                  >
                    Enfrentar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut, Heart, Zap, Coins, MapPin } from 'lucide-react';
import { WorldMap } from './WorldMap';
import { Inventory } from './Inventory';
import { Combat } from './Combat';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  gold: number;
  position_x: number;
  position_y: number;
  current_biome: string;
}

interface CharacterDashboardProps {
  character: Character;
  onBack: () => void;
  onSignOut: () => void;
}

const getClassDisplayName = (className: string): string => {
  const classNames = {
    guerreiro: 'Guerreiro',
    mago: 'Mago',
    ladino: 'Ladino',
    clerigo: 'Clérigo'
  };
  return classNames[className as keyof typeof classNames] || className;
};

const getBiomeDisplayName = (biome: string): string => {
  const biomeNames = {
    caatinga: 'Caatinga',
    agreste: 'Agreste',
    litoral: 'Litoral',
    santa_cruz: 'Santa Cruz'
  };
  return biomeNames[biome as keyof typeof biomeNames] || biome;
};

export function CharacterDashboard({ character, onBack, onSignOut }: CharacterDashboardProps) {
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const [combatCreature, setCombatCreature] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const experienceToNextLevel = currentCharacter.level * 100;
  const experienceProgress = (currentCharacter.experience / experienceToNextLevel) * 100;

  const handleCharacterUpdate = (updatedCharacter: any) => {
    setCurrentCharacter(updatedCharacter);
  };

  const handleStartCombat = (creature: any) => {
    setCombatCreature(creature);
    setActiveTab("combat");
  };

  const handleCombatEnd = (victory: boolean, updatedCharacter?: any) => {
    if (updatedCharacter) {
      setCurrentCharacter(updatedCharacter);
    }
    setCombatCreature(null);
    setActiveTab("world");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentCharacter.name}</h1>
            <p className="text-muted-foreground">
              {getClassDisplayName(currentCharacter.class)} • Nível {currentCharacter.level} • {getBiomeDisplayName(currentCharacter.current_biome)}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Vida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentCharacter.health}/{currentCharacter.max_health}
            </div>
            <Progress value={(currentCharacter.health / currentCharacter.max_health) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Mana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentCharacter.mana}/{currentCharacter.max_mana}
            </div>
            <Progress value={(currentCharacter.mana / currentCharacter.max_mana) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Ouro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentCharacter.gold.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">moedas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getBiomeDisplayName(currentCharacter.current_biome)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Posição: ({currentCharacter.position_x}, {currentCharacter.position_y})
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Experiência</span>
          <span className="text-sm text-muted-foreground">{currentCharacter.experience}/{experienceToNextLevel}</span>
        </div>
        <Progress value={experienceProgress} className="h-2" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Personagem</TabsTrigger>
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="world">Mundo</TabsTrigger>
          <TabsTrigger value="combat" disabled={!combatCreature}>Combate</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Atributos</CardTitle>
              <CardDescription>
                Seus atributos principais de combate e exploração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{currentCharacter.strength}</div>
                  <div className="text-sm text-muted-foreground">Força</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentCharacter.agility}</div>
                  <div className="text-sm text-muted-foreground">Agilidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentCharacter.intelligence}</div>
                  <div className="text-sm text-muted-foreground">Inteligência</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{currentCharacter.vitality}</div>
                  <div className="text-sm text-muted-foreground">Vitalidade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{currentCharacter.luck}</div>
                  <div className="text-sm text-muted-foreground">Sorte</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Inventory 
            character={currentCharacter} 
            onCharacterUpdate={handleCharacterUpdate}
          />
        </TabsContent>

        <TabsContent value="world">
          <WorldMap 
            character={currentCharacter}
            onCharacterUpdate={handleCharacterUpdate}
            onStartCombat={handleStartCombat}
          />
        </TabsContent>

        <TabsContent value="combat">
          {combatCreature ? (
            <Combat
              character={currentCharacter}
              creature={combatCreature}
              onCombatEnd={handleCombatEnd}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Arena de Combate</CardTitle>
                <CardDescription>
                  Nenhum combate ativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Explore o mundo para encontrar criaturas para enfrentar!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
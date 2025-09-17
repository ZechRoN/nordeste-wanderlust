import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  LogOut, 
  Sword, 
  Shield, 
  Heart, 
  Zap, 
  Coins, 
  Map,
  User,
  Backpack
} from 'lucide-react';

interface CharacterDashboardProps {
  character: any;
  onBack: () => void;
  onSignOut: () => void;
}

const getClassDisplayName = (className: string) => {
  const classNames: { [key: string]: string } = {
    warrior: 'Guerreiro',
    mage: 'Mago',
    archer: 'Arqueiro',
    healer: 'Curandeiro',
    assassin: 'Assassino'
  };
  return classNames[className] || className;
};

const getBiomeDisplayName = (biome: string) => {
  const biomes: { [key: string]: string } = {
    caatinga: 'Caatinga',
    agreste: 'Agreste',
    litoral: 'Litoral',
    santa_cruz: 'Santa Cruz'
  };
  return biomes[biome] || biome;
};

export const CharacterDashboard = ({ character, onBack, onSignOut }: CharacterDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const experienceToNextLevel = Math.pow(character.level + 1, 2) * 100;
  const experienceProgress = Math.min((character.experience / experienceToNextLevel) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{character.name}</h1>
                <p className="text-muted-foreground">
                  {getClassDisplayName(character.class)} • Nível {character.level}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Vida</p>
                <p className="text-lg font-bold">{character.health}/{character.max_health}</p>
                <Progress value={(character.health / character.max_health) * 100} className="h-2 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Mana</p>
                <p className="text-lg font-bold">{character.mana}/{character.max_mana}</p>
                <Progress value={(character.mana / character.max_mana) * 100} className="h-2 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Gold</p>
                <p className="text-lg font-bold">{character.gold.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Map className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="text-lg font-bold">{getBiomeDisplayName(character.current_biome)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Experience Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Experiência</span>
              <span className="text-sm text-muted-foreground">
                {character.experience.toLocaleString()} / {experienceToNextLevel.toLocaleString()}
              </span>
            </div>
            <Progress value={experienceProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personagem
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Backpack className="h-4 w-4" />
              Inventário
            </TabsTrigger>
            <TabsTrigger value="world" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Mundo
            </TabsTrigger>
            <TabsTrigger value="combat" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              Combate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Attributes */}
              <Card>
                <CardHeader>
                  <CardTitle>Atributos</CardTitle>
                  <CardDescription>Seus atributos principais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Sword className="h-4 w-4 text-red-500" />
                        Força
                      </span>
                      <Badge variant="secondary">{character.strength}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        Inteligência
                      </span>
                      <Badge variant="secondary">{character.intelligence}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Sword className="h-4 w-4 text-green-500" />
                        Agilidade
                      </span>
                      <Badge variant="secondary">{character.agility}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Vitalidade
                      </span>
                      <Badge variant="secondary">{character.vitality}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-500" />
                        Sorte
                      </span>
                      <Badge variant="secondary">{character.luck}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Character Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Personagem</CardTitle>
                  <CardDescription>Detalhes sobre seu personagem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Classe:</span>
                      <span className="font-medium">{getClassDisplayName(character.class)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nível:</span>
                      <span className="font-medium">{character.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bioma Atual:</span>
                      <span className="font-medium">{getBiomeDisplayName(character.current_biome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posição:</span>
                      <span className="font-medium">({character.position_x}, {character.position_y})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span className="font-medium">
                        {new Date(character.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventário</CardTitle>
                <CardDescription>Seus itens e equipamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Backpack className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Seu inventário está vazio</p>
                  <p className="text-sm">Explore o mundo para encontrar itens!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="world">
            <Card>
              <CardHeader>
                <CardTitle>Explorar Mundo</CardTitle>
                <CardDescription>Viaje pelos biomas do Sertão</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Mapa do mundo em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá explorar os biomas!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combat">
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Combate</CardTitle>
                <CardDescription>Enfrente criaturas e outros jogadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Sword className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sistema de combate em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá batalhar!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
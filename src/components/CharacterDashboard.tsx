import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LogOut, Heart, Zap, Coins, MapPin, Tent, X, Backpack, Scroll, Swords, Users, Trophy, Crown, Shield, Hammer, Map } from 'lucide-react';
import { CHARACTER_SPRITES, UI_SPRITES } from '@/assets/sprites';
import { GameCanvas } from '@/engine/GameCanvas';
import { WorldMap } from './WorldMap';
import { Inventory } from './Inventory';
import { Combat } from './Combat';
import { RestPoint } from './RestPoint';
import { Quests } from './Quests';
import { NPCs } from './NPCs';
import { Achievements } from './Achievements';
import { Crafting } from './Crafting';
import { Rankings } from './Rankings';
import { Guilds } from './Guilds';
import { Mounts } from './Mounts';
import { Titles } from './Titles';
import { Arena } from './Arena';
import { useRegeneration } from '@/hooks/useRegeneration';

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
  current_biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz';
}

interface CharacterDashboardProps {
  character: Character;
  onBack: () => void;
  onSignOut: () => void;
}

const getClassDisplayName = (className: string): string => {
  const classNames: Record<string, string> = {
    guerreiro: 'Guerreiro',
    mago: 'Mago',
    ladino: 'Ladino',
    clerigo: 'Clérigo',
    warrior: 'Guerreiro',
    mage: 'Mago',
    archer: 'Arqueiro',
    healer: 'Curandeiro',
    assassin: 'Assassino',
  };
  return classNames[className] || className;
};

type OverlayPanel = 'inventory' | 'quests' | 'npcs' | 'crafting' | 'guilds' | 'mounts' | 'achievements' | 'titles' | 'arena' | 'rankings' | 'menu' | null;

export function CharacterDashboard({ character, onBack, onSignOut }: CharacterDashboardProps) {
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const [combatCreature, setCombatCreature] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<OverlayPanel>(null);

  const handleCharacterUpdate = (updatedCharacter: any) => {
    setCurrentCharacter(updatedCharacter);
  };

  useRegeneration(currentCharacter, handleCharacterUpdate, !!combatCreature);

  const handleStartCombat = (creature: any) => {
    setCombatCreature(creature);
    setActivePanel(null);
  };

  const handleCombatEnd = (victory: boolean, updatedCharacter?: any) => {
    if (updatedCharacter) setCurrentCharacter(updatedCharacter);
    setCombatCreature(null);
  };

  const menuItems: { key: OverlayPanel; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Inventário (I)', icon: <Backpack className="h-4 w-4" /> },
    { key: 'quests', label: 'Missões', icon: <Scroll className="h-4 w-4" /> },
    { key: 'npcs', label: 'NPCs', icon: <Users className="h-4 w-4" /> },
    { key: 'crafting', label: 'Crafting', icon: <Hammer className="h-4 w-4" /> },
    { key: 'guilds', label: 'Guildas', icon: <Shield className="h-4 w-4" /> },
    { key: 'mounts', label: 'Montarias', icon: <Map className="h-4 w-4" /> },
    { key: 'achievements', label: 'Conquistas', icon: <Trophy className="h-4 w-4" /> },
    { key: 'titles', label: 'Títulos', icon: <Crown className="h-4 w-4" /> },
    { key: 'arena', label: 'Arena PvP', icon: <Swords className="h-4 w-4" /> },
    { key: 'rankings', label: 'Rankings', icon: <Trophy className="h-4 w-4" /> },
  ];

  // Combat view takes over the whole screen
  if (combatCreature) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <Combat
          character={currentCharacter}
          creature={combatCreature}
          onCombatEnd={handleCombatEnd}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Game Canvas - Full screen */}
      <GameCanvas
        character={currentCharacter}
        onCharacterUpdate={handleCharacterUpdate}
        onStartCombat={handleStartCombat}
        onOpenMenu={() => setActivePanel(activePanel === 'menu' ? null : 'menu')}
        onOpenInventory={() => setActivePanel(activePanel === 'inventory' ? null : 'inventory')}
      />

      {/* Top bar with quick actions */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <Button variant="outline" size="icon" className="bg-background/80 h-8 w-8" onClick={() => setActivePanel('menu')}>
          <Map className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-background/80 h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-background/80 h-8 w-8" onClick={onSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick action bar (bottom) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-background/80 rounded-lg p-1 border border-border">
        {menuItems.slice(0, 6).map(item => (
          <Button
            key={item.key}
            variant={activePanel === item.key ? 'default' : 'ghost'}
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setActivePanel(activePanel === item.key ? null : item.key)}
          >
            {item.icon}
            <span className="hidden md:inline ml-1">{item.label}</span>
          </Button>
        ))}
      </div>

      {/* Side panel overlay */}
      {activePanel && activePanel !== 'menu' && (
        <div className="absolute top-0 right-0 z-30 w-full md:w-[480px] h-full bg-background/95 border-l border-border overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-background border-b border-border">
            <h2 className="font-bold text-lg">{menuItems.find(m => m.key === activePanel)?.label}</h2>
            <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            {activePanel === 'inventory' && <Inventory character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'quests' && <Quests character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'npcs' && <NPCs character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'crafting' && <Crafting character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'guilds' && <Guilds character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'mounts' && <Mounts character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'achievements' && <Achievements character={currentCharacter} />}
            {activePanel === 'titles' && <Titles character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'arena' && <Arena character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
            {activePanel === 'rankings' && <Rankings character={currentCharacter} />}
          </div>
        </div>
      )}

      {/* Menu overlay */}
      {activePanel === 'menu' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="bg-background border-2 border-primary rounded-lg p-6 max-w-md w-full mx-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Menu</h2>
              <Button variant="ghost" size="icon" onClick={() => setActivePanel(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Character summary */}
            <div className="bg-muted rounded-lg p-3 mb-4">
              <p className="font-bold">{currentCharacter.name}</p>
              <p className="text-sm text-muted-foreground">
                {getClassDisplayName(currentCharacter.class)} • Nível {currentCharacter.level}
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <span>❤ {currentCharacter.health}/{currentCharacter.max_health}</span>
                <span>💧 {currentCharacter.mana}/{currentCharacter.max_mana}</span>
                <span>🪙 {currentCharacter.gold}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {menuItems.map(item => (
                <Button
                  key={item.key}
                  variant="outline"
                  className="justify-start gap-2 h-10"
                  onClick={() => setActivePanel(item.key)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button variant="destructive" className="flex-1" onClick={onSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

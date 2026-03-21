import { useState } from 'react';
import { ArrowLeft, LogOut, Heart, Zap, Coins, MapPin, X, Backpack, Scroll, Swords, Users, Trophy, Crown, Shield, Hammer, Map, Calendar } from 'lucide-react';
import { GameCanvas } from '@/engine/GameCanvas';
import { GamePanel, GameButton } from '@/components/ui/game-panel';
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
import { Events } from './Events';
import { GlobalChat } from './GlobalChat';
import { GameNotifications } from './GameNotifications';
import { Party } from './Party';
import { useRegeneration } from '@/hooks/useRegeneration';
import { useBackgroundMusic, SFX } from '@/hooks/useGameAudio';

interface Character {
  id: string; name: string; class: string; level: number; experience: number;
  health: number; max_health: number; mana: number; max_mana: number;
  strength: number; agility: number; intelligence: number; vitality: number; luck: number;
  gold: number; position_x: number; position_y: number;
  current_biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz';
}

interface CharacterDashboardProps {
  character: Character;
  onBack: () => void;
  onSignOut: () => void;
}

const getClassDisplayName = (className: string): string => {
  const classNames: Record<string, string> = {
    warrior: 'Guerreiro', mage: 'Mago', archer: 'Arqueiro', healer: 'Curandeiro', assassin: 'Assassino',
  };
  return classNames[className] || className;
};

type OverlayPanel = 'inventory' | 'quests' | 'npcs' | 'crafting' | 'guilds' | 'mounts' | 'achievements' | 'titles' | 'arena' | 'rankings' | 'events' | 'party' | 'menu' | null;

export function CharacterDashboard({ character, onBack, onSignOut }: CharacterDashboardProps) {
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const [combatCreature, setCombatCreature] = useState<any>(null);
  const [activePanel, setActivePanel] = useState<OverlayPanel>(null);

  const handleCharacterUpdate = (updatedCharacter: any) => setCurrentCharacter(updatedCharacter);
  useRegeneration(currentCharacter, handleCharacterUpdate, !!combatCreature);
  useBackgroundMusic(currentCharacter.current_biome, !combatCreature);

  const handleStartCombat = (creature: any) => { SFX.attack(); setCombatCreature(creature); setActivePanel(null); };
  const handleCombatEnd = (victory: boolean, updatedCharacter?: any) => {
    if (updatedCharacter) setCurrentCharacter(updatedCharacter);
    setCombatCreature(null);
  };

  const menuItems: { key: OverlayPanel; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Inventário', icon: <Backpack className="h-4 w-4" /> },
    { key: 'quests', label: 'Missões', icon: <Scroll className="h-4 w-4" /> },
    { key: 'npcs', label: 'NPCs', icon: <Users className="h-4 w-4" /> },
    { key: 'crafting', label: 'Crafting', icon: <Hammer className="h-4 w-4" /> },
    { key: 'guilds', label: 'Guildas', icon: <Shield className="h-4 w-4" /> },
    { key: 'mounts', label: 'Montarias', icon: <Map className="h-4 w-4" /> },
    { key: 'achievements', label: 'Conquistas', icon: <Trophy className="h-4 w-4" /> },
    { key: 'titles', label: 'Títulos', icon: <Crown className="h-4 w-4" /> },
    { key: 'arena', label: 'Arena PvP', icon: <Swords className="h-4 w-4" /> },
    { key: 'events', label: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
    { key: 'party', label: 'Party', icon: <Users className="h-4 w-4" /> },
    { key: 'rankings', label: 'Rankings', icon: <Trophy className="h-4 w-4" /> },
  ];

  if (combatCreature) {
    return <Combat character={currentCharacter} creature={combatCreature} onCombatEnd={handleCombatEnd} />;
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <GameCanvas
        character={currentCharacter}
        onCharacterUpdate={handleCharacterUpdate}
        onStartCombat={handleStartCombat}
        onOpenMenu={() => { SFX.openPanel(); setActivePanel(activePanel === 'menu' ? null : 'menu'); }}
        onOpenInventory={() => { SFX.openPanel(); setActivePanel(activePanel === 'inventory' ? null : 'inventory'); }}
      />

      {/* Top bar */}
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        <GameButton size="sm" onClick={() => setActivePanel('menu')}>☰</GameButton>
        <GameButton size="sm" onClick={onBack}><ArrowLeft className="h-3 w-3" /></GameButton>
        <GameButton size="sm" variant="danger" onClick={onSignOut}><LogOut className="h-3 w-3" /></GameButton>
      </div>

      {/* Bottom action bar */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 rpg-panel !p-1">
        {menuItems.slice(0, 6).map(item => (
          <GameButton
            key={item.key}
            variant={activePanel === item.key ? 'gold' : 'secondary'}
            size="sm"
            onClick={() => { SFX.menuClick(); setActivePanel(activePanel === item.key ? null : item.key); }}
          >
            {item.icon}
            <span className="hidden md:inline ml-1 text-[10px]">{item.label}</span>
          </GameButton>
        ))}
      </div>

      {/* Side panel overlay */}
      {activePanel && activePanel !== 'menu' && (
        <div className="absolute top-0 right-0 z-30 w-full md:w-[480px] h-full flex flex-col p-2 md:p-3 bg-black/40">
          {activePanel === 'inventory' ? (
            <Inventory character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />
          ) : (
            <GamePanel
              title={menuItems.find(m => m.key === activePanel)?.label || ''}
              icon={menuItems.find(m => m.key === activePanel)?.icon}
              onClose={() => { SFX.closePanel(); setActivePanel(null); }}
            >
              {activePanel === 'quests' && <Quests character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'npcs' && <NPCs character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'crafting' && <Crafting character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'guilds' && <Guilds character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'mounts' && <Mounts character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'achievements' && <Achievements character={currentCharacter} />}
              {activePanel === 'titles' && <Titles character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'arena' && <Arena character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'events' && <Events character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'party' && <Party character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />}
              {activePanel === 'rankings' && <Rankings character={currentCharacter} />}
            </GamePanel>
          )}
        </div>
      )}

      {/* Global Chat - bottom left */}
      <GlobalChat character={{ id: currentCharacter.id, name: currentCharacter.name }} />

      {/* Menu overlay */}
      {activePanel === 'menu' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm">
            <GamePanel
              title="Menu"
              icon={<Map className="h-5 w-5" />}
              onClose={() => setActivePanel(null)}
              footer={
                <div className="flex gap-2 justify-between w-full">
                  <GameButton variant="secondary" onClick={onBack}><ArrowLeft className="h-3 w-3 mr-1" /> Voltar</GameButton>
                  <GameButton variant="danger" onClick={onSignOut}><LogOut className="h-3 w-3 mr-1" /> Sair</GameButton>
                </div>
              }
            >
              {/* Character summary */}
              <div className="rpg-item-detail mb-3">
                <div className="font-bold pixel-text">{currentCharacter.name}</div>
                <span className="text-[10px] opacity-50">{getClassDisplayName(currentCharacter.class)} • Nível {currentCharacter.level}</span>
                <div className="flex gap-3 mt-2 text-[10px]">
                  <span>❤ {currentCharacter.health}/{currentCharacter.max_health}</span>
                  <span>💧 {currentCharacter.mana}/{currentCharacter.max_mana}</span>
                  <span>🪙 {currentCharacter.gold}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {menuItems.map(item => (
                  <GameButton
                    key={item.key}
                    variant="secondary"
                    size="sm"
                    className="justify-start gap-1"
                    onClick={() => setActivePanel(item.key)}
                  >
                    {item.icon}
                    <span className="text-[10px]">{item.label}</span>
                  </GameButton>
                ))}
              </div>
            </GamePanel>
          </div>
        </div>
      )}
    </div>
  );
}

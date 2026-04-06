import { useState, useCallback } from 'react';
import { ArrowLeft, LogOut, Heart, Zap, Coins, MapPin, X, Backpack, Scroll, Swords, Users, Trophy, Crown, Shield, Hammer, Map, Calendar, ArrowLeftRight, Skull, PawPrint, Sparkles } from 'lucide-react';
import { GameCanvas } from '@/engine/GameCanvas';
import { GamePanel, GameButton } from '@/components/ui/game-panel';
import { DraggablePanel } from '@/components/ui/DraggablePanel';
import { Div } from '@/components/ui/Div';
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
import { Trade } from './Trade';
import { Dungeon } from './Dungeon';
import { GlobalChat } from './GlobalChat';
import { GameNotifications } from './GameNotifications';
import { Party } from './Party';
import { Pets } from './Pets';
import { Enchantment } from './Enchantment';
import { CharacterMenu } from './CharacterMenu';
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

type PanelKey = 'character' | 'inventory' | 'quests' | 'npcs' | 'crafting' | 'guilds' | 'mounts' | 'achievements' | 'titles' | 'arena' | 'rankings' | 'events' | 'party' | 'trade' | 'dungeon' | 'pets' | 'enchant';

interface OpenPanel {
  key: PanelKey;
  zIndex: number;
}

const MENU_ITEMS: { key: PanelKey; label: string; icon: React.ReactNode; width?: number; height?: number }[] = [
  { key: 'character', label: 'Personagem', icon: <Heart className="h-4 w-4" />, width: 520, height: 520 },
  { key: 'inventory', label: 'Inventário', icon: <Backpack className="h-4 w-4" />, width: 440, height: 500 },
  { key: 'quests', label: 'Missões', icon: <Scroll className="h-4 w-4" /> },
  { key: 'npcs', label: 'NPCs', icon: <Users className="h-4 w-4" /> },
  { key: 'crafting', label: 'Crafting', icon: <Hammer className="h-4 w-4" /> },
  { key: 'guilds', label: 'Guildas', icon: <Shield className="h-4 w-4" /> },
  { key: 'mounts', label: 'Montarias', icon: <Map className="h-4 w-4" /> },
  { key: 'achievements', label: 'Conquistas', icon: <Trophy className="h-4 w-4" /> },
  { key: 'titles', label: 'Títulos', icon: <Crown className="h-4 w-4" /> },
  { key: 'arena', label: 'Arena PvP', icon: <Swords className="h-4 w-4" /> },
  { key: 'events', label: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
  { key: 'trade', label: 'Troca', icon: <ArrowLeftRight className="h-4 w-4" /> },
  { key: 'dungeon', label: 'Dungeons', icon: <Skull className="h-4 w-4" /> },
  { key: 'party', label: 'Party', icon: <Users className="h-4 w-4" /> },
  { key: 'pets', label: 'Pets', icon: <PawPrint className="h-4 w-4" /> },
  { key: 'enchant', label: 'Aprimorar', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'rankings', label: 'Rankings', icon: <Trophy className="h-4 w-4" /> },
];

let nextZ = 100;

export function CharacterDashboard({ character, onBack, onSignOut }: CharacterDashboardProps) {
  const [currentCharacter, setCurrentCharacter] = useState(character);
  const [combatCreature, setCombatCreature] = useState<any>(null);
  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const handleCharacterUpdate = (updatedCharacter: any) => setCurrentCharacter(updatedCharacter);
  useRegeneration(currentCharacter, handleCharacterUpdate, !!combatCreature);
  useBackgroundMusic(currentCharacter.current_biome, !combatCreature);

  const handleStartCombat = (creature: any) => { SFX.attack(); setCombatCreature(creature); setOpenPanels([]); };
  const handleCombatEnd = (victory: boolean, updatedCharacter?: any) => {
    if (updatedCharacter) setCurrentCharacter(updatedCharacter);
    setCombatCreature(null);
  };

  const togglePanel = useCallback((key: PanelKey) => {
    SFX.menuClick();
    setOpenPanels(prev => {
      const exists = prev.find(p => p.key === key);
      if (exists) return prev.filter(p => p.key !== key);
      // Stagger new panel position
      const offset = prev.length * 30;
      nextZ++;
      return [...prev, { key, zIndex: nextZ }];
    });
  }, []);

  const closePanel = useCallback((key: PanelKey) => {
    SFX.closePanel();
    setOpenPanels(prev => prev.filter(p => p.key !== key));
  }, []);

  const focusPanel = useCallback((key: PanelKey) => {
    nextZ++;
    setOpenPanels(prev => prev.map(p => p.key === key ? { ...p, zIndex: nextZ } : p));
  }, []);

  const getPanelPosition = (key: PanelKey) => {
    const idx = openPanels.findIndex(p => p.key === key);
    return { x: 80 + (idx % 4) * 40, y: 40 + (idx % 4) * 35 };
  };

  const renderPanelContent = (key: PanelKey) => {
    switch (key) {
      case 'character': return <CharacterMenu character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'inventory': return <Inventory character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'quests': return <Quests character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'npcs': return <NPCs character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'crafting': return <Crafting character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'guilds': return <Guilds character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'mounts': return <Mounts character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'achievements': return <Achievements character={currentCharacter} />;
      case 'titles': return <Titles character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'arena': return <Arena character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'events': return <Events character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'trade': return <Trade character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'dungeon': return <Dungeon character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'party': return <Party character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'pets': return <Pets character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'enchant': return <Enchantment character={currentCharacter} onCharacterUpdate={handleCharacterUpdate} />;
      case 'rankings': return <Rankings character={currentCharacter} />;
      default: return null;
    }
  };

  if (combatCreature) {
    return <Combat character={currentCharacter} creature={combatCreature} onCombatEnd={handleCombatEnd} />;
  }

  return (
    <Div className="fixed inset-0 bg-background overflow-hidden">
      <GameCanvas
        character={currentCharacter}
        onCharacterUpdate={handleCharacterUpdate}
        onStartCombat={handleStartCombat}
        onOpenMenu={() => { SFX.openPanel(); setShowMenu(!showMenu); }}
        onOpenInventory={() => { SFX.openPanel(); togglePanel('inventory'); }}
      />

      {/* Top bar */}
      <Div className="absolute top-2 right-2 z-20 flex gap-1">
        <GameButton size="sm" onClick={() => setShowMenu(!showMenu)}>☰</GameButton>
        <GameButton size="sm" onClick={onBack}><ArrowLeft className="h-3 w-3" /></GameButton>
        <GameButton size="sm" variant="danger" onClick={onSignOut}><LogOut className="h-3 w-3" /></GameButton>
      </Div>

      {/* Bottom action bar - quick access */}
      <Div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1 rpg-panel !p-1">
        {MENU_ITEMS.slice(0, 6).map(item => (
          <GameButton
            key={item.key}
            variant={openPanels.some(p => p.key === item.key) ? 'gold' : 'secondary'}
            size="sm"
            onClick={() => togglePanel(item.key)}
          >
            {item.icon}
            <span className="hidden md:inline ml-1 text-[10px]">{item.label}</span>
          </GameButton>
        ))}
      </Div>

      {/* Draggable panels */}
      {openPanels.map(panel => {
        const menuItem = MENU_ITEMS.find(m => m.key === panel.key)!;
        const isInventoryPanel = panel.key === 'inventory';
        return (
          <DraggablePanel
            key={panel.key}
            id={panel.key}
            title={menuItem.label}
            icon={menuItem.icon}
            zIndex={panel.zIndex}
            defaultPosition={getPanelPosition(panel.key)}
            defaultSize={{ width: menuItem.width || 420, height: menuItem.height || 480 }}
            onClose={() => closePanel(panel.key)}
            onFocus={() => focusPanel(panel.key)}
          >
            {renderPanelContent(panel.key)}
          </DraggablePanel>
        );
      })}

      {/* Global Chat - bottom left */}
      <GlobalChat character={{ id: currentCharacter.id, name: currentCharacter.name }} />

      {/* Notifications */}
      <GameNotifications characterId={currentCharacter.id} />

      {/* Menu overlay */}
      {showMenu && (
        <Div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowMenu(false)}>
          <Div className="w-full max-w-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <GamePanel
              title="Menu"
              icon={<Map className="h-5 w-5" />}
              onClose={() => setShowMenu(false)}
              footer={
                <Div className="flex gap-2 justify-between w-full">
                  <GameButton variant="secondary" onClick={onBack}><ArrowLeft className="h-3 w-3 mr-1" /> Voltar</GameButton>
                  <GameButton variant="danger" onClick={onSignOut}><LogOut className="h-3 w-3 mr-1" /> Sair</GameButton>
                </Div>
              }
            >
              {/* Character summary */}
              <Div className="rpg-item-detail mb-3">
                <Div className="font-bold pixel-text">{currentCharacter.name}</Div>
                <span className="text-[10px] opacity-50">{getClassDisplayName(currentCharacter.class)} • Nível {currentCharacter.level}</span>
                <Div className="flex gap-3 mt-2 text-[10px]">
                  <span>❤ {currentCharacter.health}/{currentCharacter.max_health}</span>
                  <span>💧 {currentCharacter.mana}/{currentCharacter.max_mana}</span>
                  <span>🪙 {currentCharacter.gold}</span>
                </Div>
              </Div>

              <Div className="grid grid-cols-2 gap-1">
                {MENU_ITEMS.map(item => (
                  <GameButton
                    key={item.key}
                    variant={openPanels.some(p => p.key === item.key) ? 'gold' : 'secondary'}
                    size="sm"
                    className="justify-start gap-1"
                    onClick={() => { togglePanel(item.key); setShowMenu(false); }}
                  >
                    {item.icon}
                    <span className="text-[10px]">{item.label}</span>
                  </GameButton>
                ))}
              </Div>
            </GamePanel>
          </Div>
        </Div>
      )}
    </Div>
  );
}

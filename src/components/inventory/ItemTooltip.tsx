import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RARITY_COLORS } from '@/assets/sprites';

interface Item {
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

interface ItemTooltipProps {
  item: Item;
  isEquipped: boolean;
  quantity: number;
  children: React.ReactNode;
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

const TYPE_LABELS: Record<string, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  consumable: 'Consumível',
  material: 'Material',
  quest: 'Item de Quest',
  potion: 'Poção',
  gem: 'Gema',
};

export function ItemTooltip({ item, isEquipped, quantity, children }: ItemTooltipProps) {
  const rarityColor = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF';
  const hasStats = item.strength_bonus > 0 || item.agility_bonus > 0 || item.intelligence_bonus > 0 || item.vitality_bonus > 0 || item.luck_bonus > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="rpg-tooltip p-0 border-0 bg-transparent max-w-[220px]"
        >
          <div className="rpg-tooltip-inner">
            {/* Header */}
            <div className="rpg-tooltip-header">
              <span className="rpg-tooltip-name" style={{ color: rarityColor }}>
                {item.name}
              </span>
              <div className="rpg-tooltip-meta">
                <span style={{ color: rarityColor }}>{RARITY_LABELS[item.rarity] || item.rarity}</span>
                <span>{TYPE_LABELS[item.type] || item.type}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="rpg-tooltip-sep" />

            {/* Description */}
            {item.description && (
              <p className="rpg-tooltip-desc">{item.description}</p>
            )}

            {/* Stats */}
            {hasStats && (
              <div className="rpg-tooltip-stats">
                {item.strength_bonus > 0 && <span className="rpg-stat-str">+{item.strength_bonus} Força</span>}
                {item.agility_bonus > 0 && <span className="rpg-stat-agi">+{item.agility_bonus} Agilidade</span>}
                {item.intelligence_bonus > 0 && <span className="rpg-stat-int">+{item.intelligence_bonus} Inteligência</span>}
                {item.vitality_bonus > 0 && <span className="rpg-stat-vit">+{item.vitality_bonus} Vitalidade</span>}
                {item.luck_bonus > 0 && <span className="rpg-stat-luk">+{item.luck_bonus} Sorte</span>}
              </div>
            )}

            {/* Footer */}
            <div className="rpg-tooltip-sep" />
            <div className="rpg-tooltip-footer">
              <span>🪙 {item.value}</span>
              {item.required_level > 1 && <span>Nível {item.required_level}</span>}
              {quantity > 1 && <span>x{quantity}</span>}
              {isEquipped && <span className="rpg-tooltip-equipped">Equipado</span>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

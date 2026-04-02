import { motion } from 'framer-motion';

interface Item {
  name: string; rarity: string;
  strength_bonus: number; agility_bonus: number; intelligence_bonus: number;
  vitality_bonus: number; luck_bonus: number;
}

interface StatComparisonProps {
  currentItem: Item | null;
  newItem: Item;
}

const STATS = [
  { key: 'strength_bonus', label: 'FOR', cls: 'rpg-stat-str' },
  { key: 'agility_bonus', label: 'AGI', cls: 'rpg-stat-agi' },
  { key: 'intelligence_bonus', label: 'INT', cls: 'rpg-stat-int' },
  { key: 'vitality_bonus', label: 'VIT', cls: 'rpg-stat-vit' },
  { key: 'luck_bonus', label: 'SOR', cls: 'rpg-stat-luk' },
] as const;

export function StatComparison({ currentItem, newItem }: StatComparisonProps) {
  return (
    <div className="rpg-item-detail !p-2" style={{ background: 'hsl(var(--rpg-panel-bg))' }}>
      <div className="text-[9px] font-bold mb-1 opacity-60 uppercase">Comparação</div>
      <div className="flex flex-col gap-0.5">
        {STATS.map(stat => {
          const oldVal = currentItem ? (currentItem as any)[stat.key] || 0 : 0;
          const newVal = (newItem as any)[stat.key] || 0;
          const diff = newVal - oldVal;
          if (oldVal === 0 && newVal === 0) return null;

          return (
            <div key={stat.key} className="flex items-center justify-between text-[10px]">
              <span className={stat.cls}>{stat.label}</span>
              <div className="flex items-center gap-2">
                {currentItem && <span className="opacity-50">{oldVal}</span>}
                {currentItem && <span className="opacity-30">→</span>}
                <span className="font-bold">{newVal}</span>
                {diff !== 0 && (
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className={`font-bold text-[9px] ${diff > 0 ? 'text-green-500' : 'text-red-400'}`}
                  >
                    {diff > 0 ? `▲${diff}` : `▼${Math.abs(diff)}`}
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

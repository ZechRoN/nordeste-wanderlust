import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GamePanelProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
}

export function GamePanel({ title, onClose, children, className, footer, icon }: GamePanelProps) {
  return (
    <div className={cn('rpg-panel flex flex-col', className)}>
      {/* Title bar */}
      <div className="rpg-panel-header">
        <div className="rpg-panel-title-bar">
          {icon && <span className="rpg-panel-icon">{icon}</span>}
          <h2 className="rpg-panel-title">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="rpg-panel-close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rpg-panel-content flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="rpg-panel-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

interface GamePanelTabsProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function GamePanelTabs({ tabs, activeTab, onTabChange }: GamePanelTabsProps) {
  return (
    <div className="rpg-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={cn('rpg-tab', activeTab === tab.key && 'rpg-tab-active')}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface InventorySlotProps {
  icon?: string;
  quantity?: number;
  rarity?: string;
  isEmpty?: boolean;
  isEquipped?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  tooltip?: string;
  className?: string;
}

export function InventorySlot({
  icon,
  quantity,
  rarity = 'common',
  isEmpty = false,
  isEquipped = false,
  onClick,
  onContextMenu,
  tooltip,
  className,
}: InventorySlotProps) {
  return (
    <div
      className={cn(
        'rpg-slot',
        !isEmpty && 'rpg-slot-filled',
        isEquipped && 'rpg-slot-equipped',
        `rpg-rarity-${rarity}`,
        className
      )}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={tooltip}
    >
      {!isEmpty && (
        <>
          <span className="rpg-slot-icon">{icon}</span>
          {quantity !== undefined && quantity > 1 && (
            <span className="rpg-slot-qty">{quantity > 9999 ? '9999' : quantity}</span>
          )}
          {isEquipped && <span className="rpg-slot-equipped-badge">E</span>}
        </>
      )}
    </div>
  );
}

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

export function GameButton({ variant = 'secondary', size = 'md', className, children, ...props }: GameButtonProps) {
  return (
    <button
      className={cn(
        'rpg-btn',
        `rpg-btn-${variant}`,
        `rpg-btn-${size}`,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

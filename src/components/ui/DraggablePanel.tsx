import * as React from 'react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Div } from '@/components/ui/Div';

interface DraggablePanelProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  className?: string;
  footer?: React.ReactNode;
}

export function DraggablePanel({
  id, title, icon, children, onClose, onFocus, zIndex,
  defaultPosition, defaultSize, className, footer,
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(defaultPosition || { x: 100, y: 60 });
  const [minimized, setMinimized] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const width = defaultSize?.width || 420;
  const height = defaultSize?.height || 500;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    onFocus();
    const target = e.target as HTMLElement;
    // Only drag from title bar area
    if (!target.closest('.draggable-title-bar')) return;
    e.preventDefault();
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos, onFocus]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 100, dragState.current.origX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 40, dragState.current.origY + dy)),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  return (
    <div
      ref={panelRef}
      className={cn("draggable-panel", className)}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width,
        zIndex,
        maxHeight: minimized ? 'auto' : height,
      }}
      onPointerDown={(e) => { onFocus(); }}
    >
      <Div skin="panel" className="flex flex-col h-full">
        {/* Draggable title bar */}
        <div
          className="draggable-title-bar rpg-panel-header"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: 'grab', userSelect: 'none', touchAction: 'none' }}
        >
          <Div skin="panel-title-bar" className="pointer-events-none">
            {icon && <span className="rpg-panel-icon">{icon}</span>}
            <h2 className="rpg-panel-title">{title}</h2>
          </Div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-auto z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
              className="rpg-panel-btn"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="rpg-panel-btn"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!minimized && (
          <>
            <Div skin="panel-content" className="flex-1 overflow-y-auto">
              {children}
            </Div>
            {footer && <Div skin="panel-footer">{footer}</Div>}
          </>
        )}
      </Div>
    </div>
  );
}

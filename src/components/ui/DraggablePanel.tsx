import * as React from 'react';
import { useRef, useState, useCallback } from 'react';
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
  /** If true, children already include their own GamePanel frame — skip wrapping */
  raw?: boolean;
}

export function DraggablePanel({
  id, title, icon, children, onClose, onFocus, zIndex,
  defaultPosition, defaultSize, raw,
}: DraggablePanelProps) {
  const [pos, setPos] = useState(defaultPosition || { x: 100, y: 60 });
  const [minimized, setMinimized] = useState(false);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const width = defaultSize?.width || 420;
  const height = defaultSize?.height || 500;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    onFocus();
    const target = e.target as HTMLElement;
    if (!target.closest('.draggable-handle')) return;
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
      className="draggable-panel"
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width,
        zIndex,
        maxHeight: minimized ? 'auto' : height,
      }}
      onPointerDown={() => onFocus()}
    >
      {/* Drag handle bar */}
      <div
        className="draggable-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: 'grab', userSelect: 'none', touchAction: 'none' }}
      >
        <div className="draggable-handle-inner">
          {icon && <span className="draggable-handle-icon">{icon}</span>}
          <span className="draggable-handle-title">{title}</span>
          <div className="draggable-handle-buttons">
            <button onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }} className="rpg-panel-btn">
              <Minus className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="rpg-panel-btn">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div className="draggable-content">
          {children}
        </div>
      )}
    </div>
  );
}

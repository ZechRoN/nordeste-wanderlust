import { useEffect } from 'react';

export function useKeyboardShortcuts(
  isActive: boolean,
  handlers: {
    attack?: () => void;
    defend?: () => void;
    special?: () => void;
    inventory?: () => void;
    map?: () => void;
    rest?: () => void;
  }
) {
  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      // Evitar ações se estiver digitando em um campo
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (event.key.toLowerCase()) {
        case '1':
        case 'a':
          event.preventDefault();
          handlers.attack?.();
          break;
        case '2':
        case 'd':
          event.preventDefault();
          handlers.defend?.();
          break;
        case '3':
        case 's':
          event.preventDefault();
          handlers.special?.();
          break;
        case 'i':
          event.preventDefault();
          handlers.inventory?.();
          break;
        case 'm':
          event.preventDefault();
          handlers.map?.();
          break;
        case 'r':
          event.preventDefault();
          handlers.rest?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, handlers]);
}
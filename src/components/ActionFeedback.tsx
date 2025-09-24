import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ActionFeedbackProps {
  show: boolean;
  text: string;
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'levelup';
  onComplete?: () => void;
}

export function ActionFeedback({ show, text, type, onComplete }: ActionFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  if (!show && !isVisible) return null;
  
  const getTypeStyles = () => {
    switch (type) {
      case 'damage':
        return 'text-red-500 font-bold animate-bounce';
      case 'heal':
        return 'text-green-500 font-bold animate-pulse';
      case 'critical':
        return 'text-yellow-500 font-bold animate-ping';
      case 'miss':
        return 'text-gray-500 font-medium animate-fade-out';
      case 'levelup':
        return 'text-purple-500 font-bold animate-scale-in text-lg';
      default:
        return 'text-white font-medium';
    }
  };
  
  return (
    <div className={cn(
      'absolute inset-0 flex items-center justify-center pointer-events-none z-50',
      'transition-all duration-500',
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
    )}>
      <div className={cn(
        'px-4 py-2 rounded-lg backdrop-blur-sm',
        'bg-black/50 border border-white/20',
        'transform transition-all duration-500',
        getTypeStyles()
      )}>
        {text}
      </div>
    </div>
  );
}
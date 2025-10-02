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
        return 'text-red-500 font-bold text-2xl drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
      case 'heal':
        return 'text-green-500 font-bold text-xl drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse';
      case 'critical':
        return 'text-yellow-400 font-bold text-3xl drop-shadow-[0_0_12px_rgba(250,204,21,0.9)] animate-bounce';
      case 'miss':
        return 'text-gray-400 font-medium text-lg animate-fade-out';
      case 'levelup':
        return 'text-purple-500 font-bold text-3xl drop-shadow-[0_0_12px_rgba(168,85,247,0.9)] animate-scale-in';
      default:
        return 'text-white font-medium text-xl';
    }
  };
  
  return (
    <div className={cn(
      'absolute inset-0 flex items-center justify-center pointer-events-none z-50',
      'transition-all duration-700',
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
    )}>
      <div className={cn(
        'px-6 py-3 rounded-lg backdrop-blur-md',
        'bg-black/70 border-2',
        type === 'critical' && 'border-yellow-400/80 shadow-[0_0_20px_rgba(250,204,21,0.6)]',
        type === 'damage' && 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
        type === 'heal' && 'border-green-500/60 shadow-[0_0_15px_rgba(34,197,94,0.5)]',
        type === 'levelup' && 'border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.6)]',
        type === 'miss' && 'border-gray-400/40',
        'transform transition-all duration-700',
        getTypeStyles()
      )}>
        {text}
      </div>
    </div>
  );
}
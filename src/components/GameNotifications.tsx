import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, X, Check, Swords, Calendar, Users } from 'lucide-react';
import { GameButton } from '@/components/ui/game-panel';
import { motion, AnimatePresence } from 'framer-motion';
import { SFX } from '@/hooks/useGameAudio';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

interface GameNotificationsProps {
  characterId: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  event: <Calendar className="h-3 w-3" />,
  arena: <Swords className="h-3 w-3" />,
  party: <Users className="h-3 w-3" />,
  info: <Bell className="h-3 w-3" />,
};

const TYPE_COLORS: Record<string, string> = {
  event: 'hsl(var(--rpg-legendary))',
  arena: 'hsl(0 60% 55%)',
  party: 'hsl(var(--rpg-uncommon))',
  info: 'hsl(var(--rpg-text-dim))',
};

export function GameNotifications({ characterId }: GameNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications-' + characterId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `character_id=eq.${characterId}`
      }, (payload) => {
        const notif = payload.new as Notification;
        setNotifications(prev => [notif, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
        SFX.chatMessage();

        // Show toast-style popup
        showPopup(notif);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [characterId]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as unknown as Notification[]);
      setUnreadCount((data as any[]).filter((n: any) => !n.is_read).length);
    }
  };

  const [popup, setPopup] = useState<Notification | null>(null);
  const showPopup = (notif: Notification) => {
    setPopup(notif);
    setTimeout(() => setPopup(null), 4000);
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <>
      {/* Popup toast */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-50 rpg-panel"
            style={{ minWidth: 280, maxWidth: 400 }}
          >
            <div className="rpg-panel-content" style={{ margin: 2, padding: '8px 12px' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: TYPE_COLORS[popup.notification_type] || TYPE_COLORS.info }}>
                  {TYPE_ICONS[popup.notification_type] || TYPE_ICONS.info}
                </span>
                <span className="font-bold text-xs pixel-text">{popup.title}</span>
              </div>
              <p className="text-[10px] opacity-70 mt-1">{popup.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bell button */}
      <div className="absolute top-2 left-2 z-20">
        <GameButton
          size="sm"
          variant={unreadCount > 0 ? 'gold' : 'secondary'}
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead(); }}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full"
              style={{ background: 'hsl(0 70% 50%)', color: '#fff', minWidth: 14, textAlign: 'center' }}
            >
              {unreadCount}
            </span>
          )}
        </GameButton>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="rpg-panel mt-1"
              style={{ width: 280 }}
            >
              <div className="rpg-panel-header" style={{ padding: '4px 8px' }}>
                <div className="rpg-panel-title-bar">
                  <Bell className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                  <span className="rpg-panel-title" style={{ fontSize: 11 }}>Notificações</span>
                  <button onClick={() => setIsOpen(false)} className="rpg-panel-close" style={{ width: 18, height: 18 }}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="rpg-panel-content" style={{ maxHeight: 250, overflowY: 'auto', padding: 4, margin: 2 }}>
                {notifications.length === 0 ? (
                  <p className="text-center text-[10px] opacity-40 py-4">Nenhuma notificação</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className="rpg-item-detail mb-1"
                      style={{ padding: '4px 8px', opacity: n.is_read ? 0.6 : 1 }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: TYPE_COLORS[n.notification_type] || TYPE_COLORS.info }}>
                          {TYPE_ICONS[n.notification_type] || TYPE_ICONS.info}
                        </span>
                        <span className="font-bold text-[10px] flex-1">{n.title}</span>
                        <span className="text-[8px] opacity-40">{formatTime(n.created_at)}</span>
                      </div>
                      <p className="text-[9px] opacity-60 mt-0.5 ml-5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

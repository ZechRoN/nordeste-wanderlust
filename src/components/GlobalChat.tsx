import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '@/components/ui/game-panel';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  character_id: string;
  character_name: string;
  message: string;
  created_at: string;
}

interface GlobalChatProps {
  character: { id: string; name: string };
}

export function GlobalChat({ character }: GlobalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('global-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev.slice(-49), newMsg]);
        if (!isOpen) setUnread(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    if (data) setMessages(data as unknown as ChatMessage[]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await supabase.from('chat_messages').insert({
      character_id: character.id,
      character_name: character.name,
      message: text
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    e.stopPropagation();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute bottom-2 left-2 z-20" style={{ width: 280 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="rpg-panel mb-1"
          >
            <div className="rpg-panel-header" style={{ padding: '4px 8px' }}>
              <div className="rpg-panel-title-bar">
                <MessageSquare className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                <span className="rpg-panel-title" style={{ fontSize: 11 }}>Chat Global</span>
                <button onClick={toggleChat} className="rpg-panel-close" style={{ width: 18, height: 18 }}>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="rpg-panel-content"
              style={{ height: 180, overflowY: 'auto', padding: 6, margin: 2, fontSize: 11 }}
            >
              {messages.length === 0 && (
                <p className="text-center opacity-40 text-[10px]">Nenhuma mensagem ainda...</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="mb-1" style={{ lineHeight: 1.3 }}>
                  <span className="opacity-40 text-[9px]">[{formatTime(msg.created_at)}] </span>
                  <span
                    className="font-bold"
                    style={{ color: msg.character_id === character.id ? 'hsl(var(--rpg-gold))' : 'hsl(120 50% 60%)' }}
                  >
                    {msg.character_name}:
                  </span>{' '}
                  <span style={{ color: 'hsl(var(--rpg-text))' }}>{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="rpg-panel-footer" style={{ padding: '4px 6px' }}>
              <div className="flex gap-1">
                <input
                  ref={inputRef}
                  className="rpg-input"
                  style={{ fontSize: 11, padding: '3px 6px' }}
                  placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={200}
                />
                <GameButton size="sm" variant="gold" onClick={sendMessage} disabled={!input.trim()}>
                  <Send className="h-3 w-3" />
                </GameButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <GameButton
          variant="secondary"
          size="sm"
          onClick={toggleChat}
          className="relative"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="ml-1 text-[10px]">Chat</span>
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full"
              style={{ background: 'hsl(0 70% 50%)', color: '#fff', minWidth: 14, textAlign: 'center' }}
            >
              {unread}
            </span>
          )}
        </GameButton>
      )}
    </div>
  );
}

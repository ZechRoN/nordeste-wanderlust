import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '@/components/ui/game-panel';
import { MessageSquare, Send, ChevronDown, Globe, MapPin, Users, Shield, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Div } from '@/components/ui/Div';
import { toast } from 'sonner';

type ChatMode = 'local' | 'global' | 'private' | 'guild' | 'group';

type ChatMessage = {
  id: string;
  character_id: string;
  character_name: string;
  message: string;
  created_at: string;
  channel_type?: string;
  channel_id?: string | null;
};

type PrivateMessage = {
  id: string;
  sender_character_id: string;
  recipient_character_id: string;
  sender_name: string;
  recipient_name: string;
  message: string;
  created_at: string;
};

interface GlobalChatProps {
  character: { id: string; name: string; current_biome: string };
}

export function GlobalChat({ character }: GlobalChatProps) {
  const [mode, setMode] = useState<ChatMode>('global');
  const [messages, setMessages] = useState<Array<ChatMessage | PrivateMessage>>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pmTargetName, setPmTargetName] = useState('');
  const [pmTargetId, setPmTargetId] = useState<string | null>(null);
  const [guildId, setGuildId] = useState<string | null>(null);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pmTargetRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastSentTextRef = useRef<string>('');

  const modes = useMemo(() => {
    return [
      { key: 'local' as const, label: 'Local', icon: MapPin },
      { key: 'global' as const, label: 'Global', icon: Globe },
      { key: 'private' as const, label: 'Privado', icon: MessageCircle },
      { key: 'guild' as const, label: 'Guilda', icon: Shield },
      { key: 'group' as const, label: 'Grupo', icon: Users },
    ];
  }, []);

  const title = useMemo(() => {
    const found = modes.find(m => m.key === mode);
    return found?.label ?? 'Chat';
  }, [mode, modes]);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const getGuildAndParty = useCallback(async () => {
    const [guild, party] = await Promise.all([
      supabase.from('guild_members').select('guild_id').eq('character_id', character.id).maybeSingle(),
      supabase.from('party_members').select('party_id').eq('character_id', character.id).maybeSingle(),
    ]);
    setGuildId((guild.data as any)?.guild_id ?? null);
    setPartyId((party.data as any)?.party_id ?? null);
  }, [character.id]);

  const resolvePmTarget = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    setIsResolving(true);
    try {
      const { data } = await supabase.from('characters').select('id, name').ilike('name', trimmed).limit(1).maybeSingle();
      if (!data?.id) return null;
      setPmTargetId(data.id);
      setPmTargetName(data.name);
      return { id: data.id as string, name: data.name as string };
    } finally {
      setIsResolving(false);
    }
  }, []);

  const stopChannel = useCallback(() => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  }, []);

  const subscribeForMode = useCallback(async (nextMode: ChatMode) => {
    stopChannel();

    if (nextMode === 'private') {
      const chan = supabase
        .channel(`pm-${character.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `recipient_character_id=eq.${character.id}` },
          (payload) => {
            const newMsg = payload.new as PrivateMessage;
            setMessages((prev) => [...prev.slice(-49), newMsg]);
            if (!isOpen) setUnread((p) => p + 1);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `sender_character_id=eq.${character.id}` },
          (payload) => {
            const newMsg = payload.new as PrivateMessage;
            setMessages((prev) => [...prev.slice(-49), newMsg]);
          }
        )
        .subscribe();
      channelRef.current = chan;
      return;
    }

    const type = nextMode === 'group' ? 'party' : nextMode;
    const chan = supabase
      .channel(`chat-${type}-${character.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_type=eq.${type}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        const expectedId =
          type === 'global' ? null
          : type === 'local' ? character.current_biome
          : type === 'guild' ? guildId
          : type === 'party' ? partyId
          : null;
        const nextId = (newMsg as any).channel_id ?? null;
        if ((expectedId ?? null) !== (nextId ?? null)) return;
        setMessages((prev) => [...prev.slice(-49), newMsg]);
        if (!isOpen) setUnread((p) => p + 1);
      })
      .subscribe();
    channelRef.current = chan;
  }, [character.current_biome, character.id, guildId, isOpen, partyId, stopChannel]);

  const loadMessagesForMode = useCallback(async (nextMode: ChatMode) => {
    if (nextMode === 'guild' || nextMode === 'group') {
      await getGuildAndParty();
    }

    if (nextMode === 'private') {
      if (!pmTargetId) {
        setMessages([]);
        return;
      }
      const { data } = await (supabase as any)
        .from('private_messages')
        .select('*')
        .or(
          `and(sender_character_id.eq.${character.id},recipient_character_id.eq.${pmTargetId}),and(sender_character_id.eq.${pmTargetId},recipient_character_id.eq.${character.id})`
        )
        .order('created_at', { ascending: true })
        .limit(50);
      setMessages((data as any) || []);
      return;
    }

    const type = nextMode === 'group' ? 'party' : nextMode;
    const channelId =
      type === 'global' ? null
      : type === 'local' ? character.current_biome
      : type === 'guild' ? guildId
      : type === 'party' ? partyId
      : null;

    if ((type === 'guild' || type === 'party') && !channelId) {
      setMessages([]);
      return;
    }

    let q = (supabase as any).from('chat_messages').select('*').eq('channel_type', type).order('created_at', { ascending: true }).limit(50);
    q = channelId ? q.eq('channel_id' as any, channelId) : q.is('channel_id' as any, null);
    const { data } = await q;
    setMessages((data as any) || []);
  }, [character.current_biome, character.id, getGuildAndParty, guildId, partyId, pmTargetId]);

  useEffect(() => {
    loadMessagesForMode(mode);
    subscribeForMode(mode);
  }, [guildId, loadMessagesForMode, mode, partyId, subscribeForMode]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const now = Date.now();
    if (text === lastSentTextRef.current && now - lastSentAtRef.current < 8000) {
      toast.error('Evite repetir a mesma mensagem.');
      return;
    }

    lastSentTextRef.current = text;
    lastSentAtRef.current = now;
    setInput('');

    try {
      if (mode === 'private') {
        let targetId = pmTargetId;
        if (!targetId) {
          const resolved = await resolvePmTarget(pmTargetName);
          targetId = resolved?.id ?? null;
        }
        if (!targetId) {
          toast.error('Informe um player válido.');
          return;
        }
        const { error } = await (supabase as any).rpc('pm_send_by_name', {
          p_character_id: character.id,
          p_target_character_name: pmTargetName,
          p_message: text,
        });
        if (error) throw error;
        return;
      }

      const channelType = mode === 'group' ? 'party' : mode;
      const { error } = await (supabase as any).rpc('chat_send_message', {
        p_character_id: character.id,
        p_channel_type: channelType,
        p_message: text,
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao enviar');
    }
  }, [character.id, input, mode, pmTargetId, pmTargetName, resolvePmTarget]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    e.stopPropagation();
  };

  const handleModeChange = (next: ChatMode) => {
    setMode(next);
    setUnread(0);
    if (next === 'private') {
      setTimeout(() => pmTargetRef.current?.focus(), 100);
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnread(0);
      setTimeout(() => (mode === 'private' ? pmTargetRef.current?.focus() : inputRef.current?.focus()), 100);
    }
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatMessage = useCallback((msg: ChatMessage | PrivateMessage) => {
    const isPm = (msg as any).sender_character_id !== undefined;
    if (!isPm) {
      const m = msg as ChatMessage;
      return {
        id: m.id,
        created_at: m.created_at,
        author_id: m.character_id,
        author_name: m.character_name,
        text: m.message,
      };
    }
    const pm = msg as PrivateMessage;
    const isMine = pm.sender_character_id === character.id;
    return {
      id: pm.id,
      created_at: pm.created_at,
      author_id: isMine ? pm.sender_character_id : pm.sender_character_id,
      author_name: isMine ? 'Você' : pm.sender_name,
      text: pm.message,
      isMine,
    };
  }, [character.id]);

  return (
    <Div className="absolute bottom-2 left-2 z-20" style={{ width: 280 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="rpg-panel mb-1"
          >
            <Div className="rpg-panel-header" style={{ padding: '4px 8px' }}>
              <Div className="rpg-panel-title-bar">
                <MessageSquare className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                <span className="rpg-panel-title" style={{ fontSize: 11 }}>{title}</span>
                <button onClick={toggleChat} className="rpg-panel-close" style={{ width: 18, height: 18 }}>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </Div>
              <Div className="flex items-center justify-between gap-1 mt-1">
                {modes.map((m) => {
                  const Icon = m.icon;
                  const active = mode === m.key;
                  return (
                    <GameButton
                      key={m.key}
                      size="sm"
                      variant={active ? 'gold' : 'secondary'}
                      className="flex-1"
                      onClick={() => handleModeChange(m.key)}
                      title={m.label}
                    >
                      <Icon className="h-3 w-3" />
                    </GameButton>
                  );
                })}
              </Div>
              {mode === 'private' && (
                <Div className="mt-1 flex items-center gap-1">
                  <input
                    ref={pmTargetRef}
                    className="rpg-input"
                    style={{ fontSize: 11, padding: '3px 6px' }}
                    placeholder="Nome do player..."
                    value={pmTargetName}
                    onChange={(e) => {
                      setPmTargetName(e.target.value);
                      setPmTargetId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        resolvePmTarget(pmTargetName).then(() => loadMessagesForMode('private'));
                      }
                      e.stopPropagation();
                    }}
                    maxLength={32}
                  />
                  <GameButton
                    size="sm"
                    variant="secondary"
                    disabled={isResolving || !pmTargetName.trim()}
                    onClick={async () => {
                      const resolved = await resolvePmTarget(pmTargetName);
                      if (!resolved) toast.error('Jogador não encontrado');
                      await loadMessagesForMode('private');
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </GameButton>
                </Div>
              )}
            </Div>
            <Div
              ref={scrollRef}
              className="rpg-panel-content"
              style={{ height: 180, overflowY: 'auto', padding: 6, margin: 2, fontSize: 11 }}
            >
              {messages.length === 0 && (
                <p className="text-center opacity-40 text-[10px]">Nenhuma mensagem ainda...</p>
              )}
              {messages.map((raw) => {
                const msg = formatMessage(raw);
                return (
                  <Div key={msg.id} className="mb-1" style={{ lineHeight: 1.3 }}>
                    <span className="opacity-40 text-[9px]">[{formatTime(msg.created_at)}] </span>
                    <span
                      className="font-bold"
                      style={{ color: msg.author_name === 'Você' || msg.author_id === character.id ? 'hsl(var(--rpg-gold))' : 'hsl(120 50% 60%)' }}
                    >
                      {msg.author_name}:
                    </span>{' '}
                    <span style={{ color: 'hsl(var(--rpg-text))' }}>{msg.text}</span>
                  </Div>
                );
              })}
            </Div>
            <Div className="rpg-panel-footer" style={{ padding: '4px 6px' }}>
              <Div className="flex gap-1">
                <input
                  ref={inputRef}
                  className="rpg-input"
                  style={{ fontSize: 11, padding: '3px 6px' }}
                  placeholder={mode === 'private' ? (pmTargetId ? `Mensagem para ${pmTargetName}...` : 'Escolha um player...') : 'Digite sua mensagem...'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={200}
                  disabled={mode === 'private' && !pmTargetName.trim()}
                />
                <GameButton size="sm" variant="gold" onClick={sendMessage} disabled={!input.trim()}>
                  <Send className="h-3 w-3" />
                </GameButton>
              </Div>
            </Div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <Div className="inline-flex flex-row gap-1 rpg-hud-bar">
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
        </Div>
      )}
    </Div>
  );
}

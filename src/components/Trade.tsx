import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '@/components/ui/game-panel';
import { ArrowLeftRight, Check, X, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeProps {
  character: any;
  onCharacterUpdate: (c: any) => void;
}

interface TradeOffer {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_gold: number;
  receiver_gold: number;
  sender_items: any[];
  receiver_items: any[];
  sender_confirmed: boolean;
  receiver_confirmed: boolean;
  status: string;
  created_at: string;
}

interface PlayerResult {
  id: string;
  name: string;
  level: number;
  class: string;
}

export function Trade({ character, onCharacterUpdate }: TradeProps) {
  const [trades, setTrades] = useState<TradeOffer[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerResult[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerResult | null>(null);
  const [offerGold, setOfferGold] = useState(0);
  const [requestGold, setRequestGold] = useState(0);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'new' | 'active'>('active');

  useEffect(() => { loadTrades(); loadMyItems(); }, []);

  const loadTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .or(`sender_id.eq.${character.id},receiver_id.eq.${character.id}`)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });
    if (data) setTrades(data as unknown as TradeOffer[]);
    setLoading(false);
  };

  const loadMyItems = async () => {
    const { data } = await supabase
      .from('character_items')
      .select('*, items(*)')
      .eq('character_id', character.id)
      .eq('is_equipped', false);
    if (data) setMyItems(data);
  };

  const searchPlayers = async () => {
    if (!searchName.trim()) return;
    const { data } = await supabase
      .from('characters')
      .select('id, name, level, class')
      .ilike('name', `%${searchName}%`)
      .neq('id', character.id)
      .limit(5);
    if (data) setSearchResults(data as PlayerResult[]);
  };

  const createTrade = async () => {
    if (!selectedPlayer) return;
    if (offerGold > character.gold) { toast.error('Ouro insuficiente!'); return; }

    const { data, error } = await supabase.from('trades').insert({
      sender_id: character.id,
      receiver_id: selectedPlayer.id,
      sender_gold: offerGold,
      receiver_gold: requestGold,
      sender_items: selectedItems,
      sender_confirmed: false,
      receiver_confirmed: false,
      status: 'pending'
    }).select().single();

    if (error) { toast.error('Erro ao criar troca'); return; }

    // Send notification
    await supabase.from('notifications').insert({
      character_id: selectedPlayer.id,
      title: '📦 Nova Proposta de Troca',
      message: `${character.name} quer trocar com você! Oferecendo ${offerGold} ouro.`,
      notification_type: 'trade'
    });

    toast.success('Proposta de troca enviada!');
    setSelectedPlayer(null);
    setOfferGold(0);
    setRequestGold(0);
    setSelectedItems([]);
    setTab('active');
    loadTrades();
  };

  const confirmTrade = async (trade: TradeOffer) => {
    const isSender = trade.sender_id === character.id;
    const updateField = isSender ? 'sender_confirmed' : 'receiver_confirmed';

    await supabase.from('trades').update({ [updateField]: true }).eq('id', trade.id);

    const otherConfirmed = isSender ? trade.receiver_confirmed : trade.sender_confirmed;
    if (otherConfirmed) {
      // Both confirmed - execute trade
      const newGold = character.gold - (isSender ? trade.sender_gold : trade.receiver_gold) + (isSender ? trade.receiver_gold : trade.sender_gold);
      await supabase.from('characters').update({ gold: newGold }).eq('id', character.id);
      await supabase.from('trades').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', trade.id);
      onCharacterUpdate({ ...character, gold: newGold });
      toast.success('🤝 Troca concluída com sucesso!');
    } else {
      toast.success('Troca confirmada! Aguardando outro jogador...');
    }
    loadTrades();
  };

  const cancelTrade = async (trade: TradeOffer) => {
    await supabase.from('trades').update({ status: 'cancelled' }).eq('id', trade.id);
    toast.info('Troca cancelada');
    loadTrades();
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]);
  };

  if (loading) return <p className="rpg-loading text-center p-4">Carregando trocas...</p>;

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="rpg-tabs">
        <button className={`rpg-tab ${tab === 'active' ? 'rpg-tab-active' : ''}`} onClick={() => setTab('active')}>
          Trocas Ativas
        </button>
        <button className={`rpg-tab ${tab === 'new' ? 'rpg-tab-active' : ''}`} onClick={() => setTab('new')}>
          Nova Troca
        </button>
      </div>

      {tab === 'new' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Search player */}
          <div>
            <label className="rpg-label">Buscar Jogador</label>
            <div className="flex gap-2">
              <input
                className="rpg-input flex-1"
                placeholder="Nome do jogador..."
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPlayers()}
              />
              <GameButton size="sm" onClick={searchPlayers}><Search className="h-3 w-3" /></GameButton>
            </div>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && !selectedPlayer && (
            <div className="space-y-1">
              {searchResults.map(p => (
                <div key={p.id} className="rpg-item-detail flex items-center justify-between cursor-pointer hover:opacity-80" onClick={() => setSelectedPlayer(p)}>
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className="text-[10px] opacity-60">Nv.{p.level} • {p.class}</span>
                </div>
              ))}
            </div>
          )}

          {/* Trade form */}
          {selectedPlayer && (
            <div className="space-y-3">
              <div className="rpg-item-detail">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'hsl(var(--rpg-gold))' }}>
                    Trocar com: {selectedPlayer.name}
                  </span>
                  <GameButton size="sm" variant="danger" onClick={() => setSelectedPlayer(null)}>
                    <X className="h-3 w-3" />
                  </GameButton>
                </div>
              </div>

              {/* Gold offer */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="rpg-label">Oferecer Ouro</label>
                  <input
                    type="number"
                    className="rpg-input"
                    value={offerGold}
                    onChange={e => setOfferGold(Math.max(0, parseInt(e.target.value) || 0))}
                    max={character.gold}
                  />
                  <span className="text-[9px] opacity-50">Máx: {character.gold}</span>
                </div>
                <div>
                  <label className="rpg-label">Pedir Ouro</label>
                  <input
                    type="number"
                    className="rpg-input"
                    value={requestGold}
                    onChange={e => setRequestGold(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Items to offer */}
              <div>
                <label className="rpg-label">Itens para Oferecer</label>
                <div className="grid grid-cols-4 gap-1 max-h-[120px] overflow-y-auto">
                  {myItems.map((ci: any) => (
                    <div
                      key={ci.id}
                      className={`rpg-slot rpg-slot-filled rpg-rarity-${ci.items?.rarity || 'common'} ${selectedItems.includes(ci.id) ? 'rpg-slot-selected' : ''}`}
                      onClick={() => toggleItem(ci.id)}
                      title={ci.items?.name}
                    >
                      <span className="rpg-slot-icon">📦</span>
                      {ci.quantity > 1 && <span className="rpg-slot-qty">{ci.quantity}</span>}
                    </div>
                  ))}
                  {myItems.length === 0 && <p className="col-span-4 text-[10px] opacity-50 text-center py-2">Sem itens disponíveis</p>}
                </div>
              </div>

              <GameButton variant="gold" className="w-full" onClick={createTrade}>
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                Enviar Proposta
              </GameButton>
            </div>
          )}
        </motion.div>
      )}

      {tab === 'active' && (
        <div className="space-y-2">
          {trades.length === 0 ? (
            <div className="text-center py-8 opacity-50">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="text-xs">Nenhuma troca ativa</p>
            </div>
          ) : (
            trades.map(trade => {
              const isSender = trade.sender_id === character.id;
              const myConfirmed = isSender ? trade.sender_confirmed : trade.receiver_confirmed;
              const theirConfirmed = isSender ? trade.receiver_confirmed : trade.sender_confirmed;

              return (
                <motion.div key={trade.id} className="rpg-item-detail" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--rpg-gold))' }}>
                      {isSender ? '📤 Enviada' : '📥 Recebida'}
                    </span>
                    <span className="text-[10px] opacity-50">{trade.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                    <div>
                      <span className="opacity-60">Oferecido:</span>
                      <div className="font-bold">🪙 {trade.sender_gold}</div>
                      {(trade.sender_items as any[]).length > 0 && <div>📦 {(trade.sender_items as any[]).length} itens</div>}
                    </div>
                    <div>
                      <span className="opacity-60">Pedido:</span>
                      <div className="font-bold">🪙 {trade.receiver_gold}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] mb-2">
                    <span className={myConfirmed ? 'text-green-400' : 'text-yellow-400'}>
                      {myConfirmed ? '✅ Você confirmou' : '⏳ Sua confirmação'}
                    </span>
                    <span className={theirConfirmed ? 'text-green-400' : 'text-yellow-400'}>
                      {theirConfirmed ? '✅ Outro confirmou' : '⏳ Aguardando'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!myConfirmed && (
                      <GameButton size="sm" variant="gold" onClick={() => confirmTrade(trade)}>
                        <Check className="h-3 w-3 mr-1" /> Confirmar
                      </GameButton>
                    )}
                    <GameButton size="sm" variant="danger" onClick={() => cancelTrade(trade)}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </GameButton>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

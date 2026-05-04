import { useEffect, useMemo, useState } from "react";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Search, Ticket, Filter, X, Loader2, Crown, Hammer, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";

type Listing = {
  id: string;
  character_id: string;
  seller_id: string;
  price_coupons: number;
  description: string | null;
  highlight: string | null;
  created_at: string;
  characters: {
    id: string;
    name: string;
    class: string;
    subclass: string | null;
    profession: string | null;
    level: number;
    experience: number;
    gold: number;
    current_biome: string;
    strength: number;
    agility: number;
    intelligence: number;
    vitality: number;
    luck: number;
  } | null;
};

type Purchase = { created_at: string; price_coupons: number; buyer_id: string };

const CLASS_LABEL: Record<string, string> = {
  warrior: "Guerreiro", mage: "Mago", archer: "Arqueiro", healer: "Curandeiro", assassin: "Assassino",
};
const CLASS_ICON: Record<string, string> = {
  warrior: "⚔️", mage: "🔮", archer: "🏹", healer: "💚", assassin: "🗡️",
};
const CLASS_FILTERS = ["Todos", "warrior", "mage", "archer", "healer", "assassin"];

function classLabel(k: string) { return CLASS_LABEL[k] ?? k; }
function classIcon(k: string) { return CLASS_ICON[k] ?? "🛡️"; }

export default function BazarPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [klass, setKlass] = useState("Todos");
  const [search, setSearch] = useState("");
  const [minLevel, setMinLevel] = useState(0);
  const [coupons, setCoupons] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buying, setBuying] = useState(false);
  const [history, setHistory] = useState<Purchase[]>([]);

  async function loadListings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("character_listings")
      .select("id, character_id, seller_id, price_coupons, description, highlight, created_at, characters(id, name, class, subclass, profession, level, experience, gold, current_biome, strength, agility, intelligence, vitality, luck)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar Bazar", description: error.message, variant: "destructive" });
    setListings((data as any) ?? []);
    setLoading(false);
  }

  async function loadCoupons() {
    if (!user) { setCoupons(0); return; }
    const { data } = await supabase.from("user_coupons").select("balance").eq("user_id", user.id).maybeSingle();
    setCoupons(data?.balance ?? 0);
  }

  useEffect(() => { loadListings(); }, []);
  useEffect(() => { loadCoupons(); }, [user]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (!l.characters) return false;
      if (klass !== "Todos" && l.characters.class !== klass) return false;
      if (search && !l.characters.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (l.characters.level < minLevel) return false;
      return true;
    });
  }, [listings, klass, search, minLevel]);

  async function openDetails(l: Listing) {
    setSelected(l);
    setHistory([]);
    const { data } = await supabase
      .from("listing_purchases")
      .select("created_at, price_coupons, buyer_id")
      .eq("character_id", l.character_id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory((data as any) ?? []);
  }

  function startBuy() {
    if (!user) { setAuthOpen(true); return; }
    if (!selected) return;
    if (coupons < selected.price_coupons) {
      toast({ title: "Cupons insuficientes", description: `Você precisa de ${selected.price_coupons.toLocaleString("pt-BR")} Cupons.`, variant: "destructive" });
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmBuy() {
    if (!selected) return;
    setBuying(true);
    const { error } = await supabase.rpc("purchase_character_listing", { _listing_id: selected.id });
    setBuying(false);
    setConfirmOpen(false);
    if (error) {
      toast({ title: "Falha na compra", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Compra concluída!", description: `${selected.characters?.name} agora pertence a você.` });
    setSelected(null);
    await Promise.all([loadListings(), loadCoupons()]);
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pb-10 space-y-6">
        <GoldFrame>
          <PanelTitle icon={<ShoppingBag className="h-3.5 w-3.5" />}>Bazar de Personagens</PanelTitle>
          <Div className="p-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-amber-200/80 italic max-w-2xl">
              Compre e venda personagens reais usando <strong className="text-amber-300">Cupons</strong>. Após a compra, o personagem é transferido para sua conta automaticamente.
            </p>
            <Div className="inline-flex items-center gap-2 rounded-sm border border-amber-700/50 bg-black/40 px-3 py-2">
              <Ticket className="h-4 w-4 text-amber-300" />
              <span className="text-xs uppercase tracking-widest text-amber-300/80">Saldo:</span>
              <span className="font-bold text-amber-100 tabular-nums">{coupons.toLocaleString("pt-BR")} Cupons</span>
            </Div>
          </Div>
        </GoldFrame>

        <GoldFrame>
          <PanelTitle icon={<Filter className="h-3.5 w-3.5" />}>Filtros</PanelTitle>
          <Div className="grid gap-3 p-4 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-amber-300/70">
              Buscar nome
              <Div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-300/60" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome do personagem"
                  className="w-full rounded-sm border border-amber-700/50 bg-black/40 pl-8 pr-2 py-2 text-sm text-amber-100 placeholder:text-amber-200/30" />
              </Div>
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-amber-300/70">
              Classe
              <select value={klass} onChange={(e) => setKlass(e.target.value)}
                className="rounded-sm border border-amber-700/50 bg-black/40 px-2 py-2 text-sm text-amber-100">
                {CLASS_FILTERS.map((c) => <option key={c} value={c}>{c === "Todos" ? "Todos" : classLabel(c)}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-amber-300/70">
              Nível mínimo: {minLevel}
              <input type="range" min={0} max={2000} step={50} value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))} />
            </label>
          </Div>
        </GoldFrame>

        {loading ? (
          <Div className="text-center py-10 text-amber-200/70 inline-flex items-center gap-2 justify-center w-full">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando anúncios…
          </Div>
        ) : (
          <Div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => {
              const c = l.characters!;
              return (
                <GoldFrame key={l.id}>
                  <button onClick={() => openDetails(l)} className="text-left w-full">
                    <Div className="p-4 space-y-3">
                      <Div className="flex items-center gap-3">
                        <Div className="h-14 w-14 rounded-sm border border-amber-700/60 bg-black/40 flex items-center justify-center text-3xl">
                          {classIcon(c.class)}
                        </Div>
                        <Div>
                          <Div className="font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>{c.name}</Div>
                          <Div className="text-[11px] uppercase tracking-widest text-amber-300/70">{classLabel(c.class)} · Nv {c.level}</Div>
                        </Div>
                      </Div>
                      {l.highlight && (
                        <Div className="text-xs italic text-amber-200/80 border-l-2 border-amber-600/60 pl-2">✦ {l.highlight}</Div>
                      )}
                      <Div className="flex items-center justify-between pt-2 border-t border-amber-700/30">
                        <Div className="inline-flex items-center gap-1 text-amber-300 font-bold">
                          <Ticket className="h-4 w-4" /> {l.price_coupons.toLocaleString("pt-BR")}
                        </Div>
                        <span className="text-[11px] text-amber-300/70 underline">Ver detalhes</span>
                      </Div>
                    </Div>
                  </button>
                </GoldFrame>
              );
            })}
            {filtered.length === 0 && (
              <Div className="col-span-full text-center py-10 text-amber-200/60 italic">
                Nenhum personagem à venda no momento.
              </Div>
            )}
          </Div>
        )}
      </section>

      {/* Details modal */}
      {selected && selected.characters && (
        <Div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <Div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <GoldFrame>
              <PanelTitle icon={<ShoppingBag className="h-3.5 w-3.5" />}>
                <span className="flex items-center justify-between w-full">
                  Detalhes do Personagem
                  <button onClick={() => setSelected(null)} className="text-amber-300/70 hover:text-amber-100"><X className="h-4 w-4" /></button>
                </span>
              </PanelTitle>
              <Div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                <Div className="flex items-center gap-4">
                  <Div className="h-24 w-24 rounded-sm border border-amber-700/60 bg-gradient-to-b from-amber-900/40 to-black/60 flex items-center justify-center text-6xl">
                    {classIcon(selected.characters.class)}
                  </Div>
                  <Div className="flex-1">
                    <Div className="text-xl font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>{selected.characters.name}</Div>
                    <Div className="text-xs uppercase tracking-widest text-amber-300/80 mt-1">
                      <Crown className="inline h-3 w-3 mr-1" />{classLabel(selected.characters.class)} · Nível {selected.characters.level}
                    </Div>
                    {selected.characters.subclass && (
                      <Div className="text-xs text-amber-200/80 mt-1"><Sparkles className="inline h-3 w-3 mr-1" />Subclasse: <strong>{selected.characters.subclass}</strong></Div>
                    )}
                    {selected.characters.profession && (
                      <Div className="text-xs text-amber-200/80"><Hammer className="inline h-3 w-3 mr-1" />Profissão: <strong>{selected.characters.profession}</strong></Div>
                    )}
                    <Div className="text-[11px] text-amber-300/60 mt-1">Bioma: {selected.characters.current_biome}</Div>
                  </Div>
                </Div>

                <Div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    ["FOR", selected.characters.strength],
                    ["AGI", selected.characters.agility],
                    ["INT", selected.characters.intelligence],
                    ["VIT", selected.characters.vitality],
                    ["SOR", selected.characters.luck],
                  ].map(([k, v]) => (
                    <Div key={k as string} className="rounded-sm border border-amber-700/40 bg-black/40 p-2">
                      <Div className="text-[10px] uppercase tracking-widest text-amber-300/70">{k}</Div>
                      <Div className="text-base font-bold text-amber-100 tabular-nums">{v}</Div>
                    </Div>
                  ))}
                </Div>

                {selected.description && (
                  <Div className="text-sm text-amber-100/90 italic border-l-2 border-amber-600/60 pl-3">"{selected.description}"</Div>
                )}

                <Div>
                  <Div className="text-xs uppercase tracking-widest text-amber-300/80 mb-2">Histórico de transações</Div>
                  {history.length === 0 ? (
                    <Div className="text-xs text-amber-200/60 italic">Sem transações anteriores. Personagem original do vendedor.</Div>
                  ) : (
                    <ul className="space-y-1 text-xs">
                      {history.map((h, i) => (
                        <li key={i} className="flex justify-between border-b border-amber-700/20 py-1 text-amber-200/80">
                          <span>{new Date(h.created_at).toLocaleDateString("pt-BR")}</span>
                          <span className="inline-flex items-center gap-1"><Ticket className="h-3 w-3" />{h.price_coupons.toLocaleString("pt-BR")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Div>

                <Div className="flex items-center justify-between border-t border-amber-700/40 pt-4">
                  <Div className="inline-flex items-center gap-2 text-lg font-bold text-amber-300">
                    <Ticket className="h-5 w-5" /> {selected.price_coupons.toLocaleString("pt-BR")} Cupons
                  </Div>
                  <button onClick={startBuy} disabled={user?.id === selected.seller_id}
                    className="mmo-btn-gold rounded-sm px-5 py-2.5 text-xs disabled:opacity-50">
                    {!user ? "Entrar para Comprar" : user.id === selected.seller_id ? "Seu anúncio" : "Comprar"}
                  </button>
                </Div>
              </Div>
            </GoldFrame>
          </Div>
        </Div>
      )}

      {/* Confirm modal */}
      {confirmOpen && selected && (
        <Div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4" onClick={() => !buying && setConfirmOpen(false)}>
          <Div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <GoldFrame>
              <PanelTitle>Confirmar Compra</PanelTitle>
              <Div className="p-5 space-y-4">
                <p className="text-sm text-amber-100">
                  Você está prestes a comprar <strong>{selected.characters?.name}</strong> por{" "}
                  <strong className="text-amber-300">{selected.price_coupons.toLocaleString("pt-BR")} Cupons</strong>.
                </p>
                <p className="text-xs text-amber-200/70 italic">
                  O personagem será transferido permanentemente para a sua conta. Esta ação não pode ser desfeita.
                </p>
                <Div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setConfirmOpen(false)} disabled={buying} className="mmo-btn-dark rounded-sm px-4 py-2 text-xs">Cancelar</button>
                  <button onClick={confirmBuy} disabled={buying} className="mmo-btn-gold rounded-sm px-4 py-2 text-xs inline-flex items-center gap-2">
                    {buying && <Loader2 className="h-3 w-3 animate-spin" />} Confirmar
                  </button>
                </Div>
              </Div>
            </GoldFrame>
          </Div>
        </Div>
      )}

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </SiteShell>
  );
}

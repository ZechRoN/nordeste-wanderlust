import { useEffect, useMemo, useState } from "react";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { Ticket, Wallet as WalletIcon, AlertTriangle, Loader2, ArrowDownCircle, ArrowUpCircle, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";

type Row = {
  id: string;
  created_at: string;
  price_coupons: number;
  buyer_id: string;
  seller_id: string;
  character_id: string;
  characters?: { name: string; class: string; level: number } | null;
};

type SortKey = "date_desc" | "date_asc" | "price_desc" | "price_asc";
const SORT_LABEL: Record<SortKey, string> = {
  date_desc: "Mais recentes",
  date_asc: "Mais antigos",
  price_desc: "Maior valor",
  price_asc: "Menor valor",
};
const PAGE_SIZE = 5;

function sortRows(rows: Row[], sort: SortKey) {
  const arr = [...rows];
  arr.sort((a, b) => {
    switch (sort) {
      case "date_asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "price_desc": return b.price_coupons - a.price_coupons;
      case "price_asc": return a.price_coupons - b.price_coupons;
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  return arr;
}

function HistoryList({
  rows, loading, kind,
}: { rows: Row[]; loading: boolean; kind: "buy" | "sell" }) {
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [sort, rows.length]);
  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const items = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <Div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <Div key={i} className="flex justify-between items-center border-b border-amber-700/20 pb-2">
            <Div className="space-y-1.5 flex-1">
              <Div className="h-4 w-1/3 bg-amber-900/30 rounded-sm" />
              <Div className="h-3 w-1/2 bg-amber-900/20 rounded-sm" />
            </Div>
            <Div className="h-4 w-16 bg-amber-900/30 rounded-sm" />
          </Div>
        ))}
      </Div>
    );
  }
  if (rows.length === 0) {
    return <Div className="text-center py-6 space-y-2">
      <Div className="text-xs italic text-amber-200/60">
        {kind === "buy" ? "Nenhuma compra realizada ainda." : "Nenhuma venda realizada ainda."}
      </Div>
    </Div>;
  }

  return (
    <Div className="space-y-3">
      <Div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-widest text-amber-300/70">{rows.length} registro(s)</span>
        <label className="inline-flex items-center gap-2 text-[11px] text-amber-300/80">
          <ArrowUpDown className="h-3 w-3" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-sm border border-amber-700/50 bg-black/40 px-2 py-1 text-xs text-amber-100">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => <option key={k} value={k}>{SORT_LABEL[k]}</option>)}
          </select>
        </label>
      </Div>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="flex justify-between items-center border-b border-amber-700/20 pb-2 text-sm">
            <Div>
              <Div className="text-amber-100 font-semibold">{p.characters?.name ?? "Personagem"}</Div>
              <Div className="text-[11px] text-amber-300/70">
                {p.characters?.class} · Nv {p.characters?.level} · {new Date(p.created_at).toLocaleDateString("pt-BR")}
              </Div>
            </Div>
            <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${kind === "buy" ? "text-red-300" : "text-emerald-300"}`}>
              <Ticket className="h-3.5 w-3.5" />{kind === "buy" ? "-" : "+"}{p.price_coupons.toLocaleString("pt-BR")}
            </span>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Div className="flex items-center justify-center gap-2 pt-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-sm border border-amber-700/50 bg-black/40 px-2 py-1 text-[11px] text-amber-100 disabled:opacity-40 inline-flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span className="text-[11px] text-amber-300/80">Página {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-sm border border-amber-700/50 bg-black/40 px-2 py-1 text-[11px] text-amber-100 disabled:opacity-40 inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
          </button>
        </Div>
      )}
    </Div>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [purchases, setPurchases] = useState<Row[]>([]);
  const [sales, setSales] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) { setAuthOpen(true); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const [bal, buys, sells] = await Promise.all([
      supabase.from("user_coupons").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("listing_purchases")
        .select("id, created_at, price_coupons, buyer_id, seller_id, character_id, characters(name, class, level)")
        .eq("buyer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("listing_purchases")
        .select("id, created_at, price_coupons, buyer_id, seller_id, character_id, characters(name, class, level)")
        .eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (bal.error || buys.error || sells.error) {
      setError(bal.error?.message || buys.error?.message || sells.error?.message || "Erro ao carregar carteira.");
    }
    setBalance(bal.data?.balance ?? 0);
    setPurchases((buys.data as any) ?? []);
    setSales((sells.data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [user]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pb-10 space-y-6">
        <GoldFrame>
          <PanelTitle icon={<WalletIcon className="h-3.5 w-3.5" />}>Minha Carteira</PanelTitle>
          <Div className="p-5">
            {!user ? (
              <Div className="text-amber-200/80 text-sm inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Você precisa estar logado para visualizar sua carteira.
              </Div>
            ) : (
              <Div className="flex items-center justify-between flex-wrap gap-3">
                <Div>
                  <Div className="text-[11px] uppercase tracking-widest text-amber-300/70">Saldo disponível</Div>
                  <Div className="text-3xl font-bold text-amber-100 tabular-nums inline-flex items-center gap-2 mt-1" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
                    <Ticket className="h-7 w-7 text-amber-300" />
                    {balance.toLocaleString("pt-BR")} <span className="text-base text-amber-300/80">Cupons</span>
                  </Div>
                </Div>
                {balance === 0 && (
                  <Div className="rounded-sm border border-amber-600/50 bg-amber-900/20 px-4 py-2 text-xs text-amber-200 inline-flex items-center gap-2 max-w-md">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    Saldo zerado. Você não conseguirá comprar personagens no Bazar até adquirir Cupons.
                  </Div>
                )}
              </Div>
            )}
          </Div>
        </GoldFrame>

        {user && (
          <Div className="grid gap-6 lg:grid-cols-2">
            <GoldFrame>
              <PanelTitle icon={<ArrowDownCircle className="h-3.5 w-3.5" />}>Compras Realizadas</PanelTitle>
              <Div className="p-4">
                <HistoryList rows={purchases} loading={loading} kind="buy" />
              </Div>
            </GoldFrame>

            <GoldFrame>
              <PanelTitle icon={<ArrowUpCircle className="h-3.5 w-3.5" />}>Vendas Realizadas</PanelTitle>
              <Div className="p-4">
                <HistoryList rows={sales} loading={loading} kind="sell" />
              </Div>
            </GoldFrame>
          </Div>
        )}
      </section>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </SiteShell>
  );
}

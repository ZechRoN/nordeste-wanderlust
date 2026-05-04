import { useEffect, useState } from "react";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { Ticket, Wallet as WalletIcon, History, AlertTriangle, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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

export default function WalletPage() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [purchases, setPurchases] = useState<Row[]>([]);
  const [sales, setSales] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setAuthOpen(true); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [bal, buys, sells] = await Promise.all([
        supabase.from("user_coupons").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("listing_purchases")
          .select("id, created_at, price_coupons, buyer_id, seller_id, character_id, characters(name, class, level)")
          .eq("buyer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("listing_purchases")
          .select("id, created_at, price_coupons, buyer_id, seller_id, character_id, characters(name, class, level)")
          .eq("seller_id", user.id).order("created_at", { ascending: false }),
      ]);
      setBalance(bal.data?.balance ?? 0);
      setPurchases((buys.data as any) ?? []);
      setSales((sells.data as any) ?? []);
      setLoading(false);
    })();
  }, [user]);

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
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-300" /> :
                  purchases.length === 0 ? <Div className="text-xs italic text-amber-200/60">Nenhuma compra realizada ainda.</Div> :
                  <ul className="space-y-2">
                    {purchases.map((p) => (
                      <li key={p.id} className="flex justify-between items-center border-b border-amber-700/20 pb-2 text-sm">
                        <Div>
                          <Div className="text-amber-100 font-semibold">{p.characters?.name ?? "Personagem"}</Div>
                          <Div className="text-[11px] text-amber-300/70">
                            {p.characters?.class} · Nv {p.characters?.level} · {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </Div>
                        </Div>
                        <span className="inline-flex items-center gap-1 text-red-300 font-bold tabular-nums">
                          <Ticket className="h-3.5 w-3.5" />-{p.price_coupons.toLocaleString("pt-BR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                }
              </Div>
            </GoldFrame>

            <GoldFrame>
              <PanelTitle icon={<ArrowUpCircle className="h-3.5 w-3.5" />}>Vendas Realizadas</PanelTitle>
              <Div className="p-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-300" /> :
                  sales.length === 0 ? <Div className="text-xs italic text-amber-200/60">Nenhuma venda realizada ainda.</Div> :
                  <ul className="space-y-2">
                    {sales.map((p) => (
                      <li key={p.id} className="flex justify-between items-center border-b border-amber-700/20 pb-2 text-sm">
                        <Div>
                          <Div className="text-amber-100 font-semibold">{p.characters?.name ?? "Personagem"}</Div>
                          <Div className="text-[11px] text-amber-300/70">
                            {p.characters?.class} · Nv {p.characters?.level} · {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </Div>
                        </Div>
                        <span className="inline-flex items-center gap-1 text-emerald-300 font-bold tabular-nums">
                          <Ticket className="h-3.5 w-3.5" />+{p.price_coupons.toLocaleString("pt-BR")}
                        </span>
                      </li>
                    ))}
                  </ul>
                }
              </Div>
            </GoldFrame>
          </Div>
        )}
      </section>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
    </SiteShell>
  );
}

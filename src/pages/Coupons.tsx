import { useEffect, useState } from "react";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { Ticket, Sparkles, Loader2, CheckCircle2, AlertTriangle, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

type Pack = { id: string; coupons: number; priceBRL: number; bonus?: number; tag?: string };

const PACKS: Pack[] = [
  { id: "starter", coupons: 500, priceBRL: 9.9 },
  { id: "adventurer", coupons: 1500, priceBRL: 24.9, bonus: 150, tag: "Popular" },
  { id: "hero", coupons: 5000, priceBRL: 74.9, bonus: 800, tag: "Melhor valor" },
  { id: "legend", coupons: 12000, priceBRL: 149.9, bonus: 2500, tag: "Lendário" },
];

export default function CouponsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    pack: Pack; previousBalance: number; newBalance: number; total: number; txId: string; date: string;
  }>(null);

  async function loadBalance() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("user_coupons").select("balance").eq("user_id", user.id).maybeSingle();
    if (!error) setBalance(data?.balance ?? 0);
    setLoading(false);
  }

  useEffect(() => { loadBalance(); }, [user]);

  async function buy(pack: Pack) {
    if (!user) { setAuthOpen(true); return; }
    setBuyingId(pack.id);
    const total = pack.coupons + (pack.bonus ?? 0);
    const previousBalance = balance;
    const { data, error } = await supabase.rpc("add_coupons" as any, { _amount: total, _pack_id: pack.id });
    setBuyingId(null);
    if (error) {
      toast({ title: "Falha ao adicionar Cupons", description: error.message, variant: "destructive" });
      return;
    }
    const newBal = (data as any)?.balance ?? previousBalance + total;
    setBalance(newBal);
    setSuccess({
      pack, previousBalance, newBalance: newBal, total,
      txId: Math.random().toString(36).slice(2, 10).toUpperCase(),
      date: new Date().toLocaleString("pt-BR"),
    });
    toast({ title: "Cupons adicionados!", description: `+${total.toLocaleString("pt-BR")} Cupons creditados.` });
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pb-10 space-y-6">
        <GoldFrame>
          <PanelTitle icon={<Ticket className="h-3.5 w-3.5" />}>Comprar Cupons</PanelTitle>
          <Div className="p-5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-amber-200/80 italic max-w-2xl">
              Cupons são a moeda usada no <strong className="text-amber-300">Bazar de Personagens</strong>. Escolha um pacote abaixo para recarregar sua carteira.
            </p>
            <Div className="rounded-sm border border-amber-700/50 bg-black/40 px-4 py-2 inline-flex items-center gap-2">
              <Ticket className="h-4 w-4 text-amber-300" />
              <span className="text-xs uppercase tracking-widest text-amber-300/80">Saldo:</span>
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-300" /> :
                <span className="font-bold text-amber-100 tabular-nums">{balance.toLocaleString("pt-BR")} Cupons</span>}
            </Div>
          </Div>
        </GoldFrame>

        {!user && (
          <GoldFrame>
            <Div className="p-5 inline-flex items-center gap-2 text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Você precisa estar logado para comprar Cupons.
              <button onClick={() => setAuthOpen(true)} className="mmo-btn-gold rounded-sm px-3 py-1 text-xs ml-2">Entrar</button>
            </Div>
          </GoldFrame>
        )}

        <Div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((p) => {
            const total = p.coupons + (p.bonus ?? 0);
            const isBuying = buyingId === p.id;
            return (
              <GoldFrame key={p.id}>
                <Div className="p-5 space-y-3 text-center">
                  {p.tag && (
                    <Div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest bg-amber-700/40 border border-amber-500/50 text-amber-100 px-2 py-0.5 rounded-sm">
                      <Sparkles className="h-3 w-3" /> {p.tag}
                    </Div>
                  )}
                  <Div className="text-3xl font-bold text-amber-100 tabular-nums inline-flex items-center gap-2 justify-center" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
                    <Ticket className="h-7 w-7 text-amber-300" /> {p.coupons.toLocaleString("pt-BR")}
                  </Div>
                  {p.bonus && (
                    <Div className="text-xs text-emerald-300">+ {p.bonus.toLocaleString("pt-BR")} bônus</Div>
                  )}
                  <Div className="text-[11px] uppercase tracking-widest text-amber-300/70">Total: {total.toLocaleString("pt-BR")} Cupons</Div>
                  <Div className="text-2xl text-amber-200" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
                    R$ {p.priceBRL.toFixed(2).replace(".", ",")}
                  </Div>
                  <button onClick={() => buy(p)} disabled={isBuying || !user}
                    className="mmo-btn-gold w-full rounded-sm px-3 py-2 text-xs disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {isBuying ? <><Loader2 className="h-3 w-3 animate-spin" /> Processando…</> : <>Comprar Pacote</>}
                  </button>
                </Div>
              </GoldFrame>
            );
          })}
        </Div>

        <GoldFrame>
          <Div className="p-4 text-xs text-amber-200/70 text-center">
            Após a compra, vá ao <Link to="/bazar" className="text-amber-300 underline inline-flex items-center gap-1"><ShoppingBag className="h-3 w-3" />Bazar</Link> para adquirir personagens.
          </Div>
        </GoldFrame>
      </section>

      {success && (
        <Div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSuccess(null)}>
          <Div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <GoldFrame>
              <PanelTitle icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Recibo de Compra</PanelTitle>
              <Div className="p-5 space-y-4">
                <Div className="text-center">
                  <Div className="text-3xl font-bold text-emerald-300 tabular-nums inline-flex items-center gap-2">
                    <Ticket className="h-7 w-7" />+{success.total.toLocaleString("pt-BR")}
                  </Div>
                  <Div className="text-xs text-amber-200/80 mt-1">Cupons creditados com sucesso</Div>
                </Div>

                <Div className="rounded-sm border border-amber-700/50 bg-black/40 p-3 text-xs space-y-1.5">
                  <Div className="flex justify-between"><span className="text-amber-300/70">Pacote</span><span className="text-amber-100 font-semibold capitalize">{success.pack.id}</span></Div>
                  <Div className="flex justify-between"><span className="text-amber-300/70">Cupons base</span><span className="text-amber-100 tabular-nums">{success.pack.coupons.toLocaleString("pt-BR")}</span></Div>
                  {success.pack.bonus ? (
                    <Div className="flex justify-between"><span className="text-amber-300/70">Bônus</span><span className="text-emerald-300 tabular-nums">+{success.pack.bonus.toLocaleString("pt-BR")}</span></Div>
                  ) : null}
                  <Div className="flex justify-between border-t border-amber-700/30 pt-1.5"><span className="text-amber-300/70">Valor pago</span><span className="text-amber-100">R$ {success.pack.priceBRL.toFixed(2).replace(".", ",")}</span></Div>
                  <Div className="flex justify-between"><span className="text-amber-300/70">Transação</span><span className="text-amber-100/70 font-mono text-[10px]">#{success.txId}</span></Div>
                  <Div className="flex justify-between"><span className="text-amber-300/70">Data</span><span className="text-amber-100/70 text-[10px]">{success.date}</span></Div>
                </Div>

                <Div className="rounded-sm border border-emerald-700/40 bg-emerald-950/20 p-3 text-xs space-y-1">
                  <Div className="flex justify-between"><span className="text-amber-300/70">Saldo anterior</span><span className="tabular-nums text-amber-100/70">{success.previousBalance.toLocaleString("pt-BR")}</span></Div>
                  <Div className="flex justify-between"><span className="text-amber-300/70">Creditado</span><span className="tabular-nums text-emerald-300">+{success.total.toLocaleString("pt-BR")}</span></Div>
                  <Div className="flex justify-between border-t border-emerald-700/30 pt-1 font-bold"><span className="text-emerald-200">Novo saldo</span><span className="tabular-nums text-emerald-200">{success.newBalance.toLocaleString("pt-BR")}</span></Div>
                </Div>

                <Div className="flex gap-2">
                  <button onClick={() => setSuccess(null)} className="mmo-btn-dark rounded-sm px-3 py-2 text-xs flex-1">Fechar</button>
                  <button onClick={() => navigate("/carteira")} className="mmo-btn-dark rounded-sm px-3 py-2 text-xs flex-1">Ver Carteira</button>
                  <button onClick={() => navigate("/bazar")} className="mmo-btn-gold rounded-sm px-3 py-2 text-xs flex-1">Ir ao Bazar</button>
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

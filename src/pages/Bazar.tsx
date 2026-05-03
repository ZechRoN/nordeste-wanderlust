import { useMemo, useState } from "react";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Search, Ticket, Filter } from "lucide-react";

type Listing = {
  id: string;
  name: string;
  klass: string;
  level: number;
  price: number;
  seller: string;
  highlight?: string;
  icon: string;
};

const CLASSES = ["Todos", "Guerreiro", "Mago", "Arqueiro", "Curandeiro", "Assassino"];

const LISTINGS: Listing[] = [
  { id: "1", name: "MestreCangaceiro", klass: "Guerreiro", level: 1842, price: 12500, seller: "PlayerX", highlight: "Set lendário +10", icon: "⚔️" },
  { id: "2", name: "ShadowMage", klass: "Mago", level: 1790, price: 11800, seller: "Wizard99", highlight: "Cajado de Ametista", icon: "🔮" },
  { id: "3", name: "FlechaDoSertão", klass: "Arqueiro", level: 1735, price: 10900, seller: "Hunter", highlight: "Pet épico incluso", icon: "🏹" },
  { id: "4", name: "BeataMilagrosa", klass: "Curandeiro", level: 1502, price: 9500, seller: "Holy", highlight: "Subclasse Beata", icon: "💚" },
  { id: "5", name: "NightWalker", klass: "Assassino", level: 1589, price: 9800, seller: "Stealth", highlight: "Adagas +9", icon: "🗡️" },
  { id: "6", name: "PhoenixKnight", klass: "Guerreiro", level: 1698, price: 10200, seller: "Phoenix", highlight: "Montaria rara", icon: "⚔️" },
  { id: "7", name: "FrostBurn", klass: "Mago", level: 1454, price: 8500, seller: "Ice", icon: "🔮" },
  { id: "8", name: "LapidadorReal", klass: "Assassino", level: 1320, price: 7200, seller: "Royal", icon: "🗡️" },
  { id: "9", name: "DruidaVerde", klass: "Curandeiro", level: 1240, price: 6500, seller: "Forest", highlight: "Profissão Alquimista 100", icon: "💚" },
  { id: "10", name: "GoldenBow", klass: "Arqueiro", level: 1488, price: 8900, seller: "Gold", icon: "🏹" },
];

export default function BazarPage() {
  const { toast } = useToast();
  const [klass, setKlass] = useState("Todos");
  const [search, setSearch] = useState("");
  const [minLevel, setMinLevel] = useState(0);
  const [coupons] = useState(0); // mock saldo

  const filtered = useMemo(() => {
    return LISTINGS.filter((l) => {
      if (klass !== "Todos" && l.klass !== klass) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (l.level < minLevel) return false;
      return true;
    });
  }, [klass, search, minLevel]);

  const buy = (l: Listing) => {
    if (coupons < l.price) {
      toast({ title: "Cupons insuficientes", description: `Você precisa de ${l.price.toLocaleString("pt-BR")} Cupons para comprar ${l.name}.`, variant: "destructive" });
      return;
    }
    toast({ title: "Compra realizada!", description: `${l.name} foi transferido para sua conta.` });
  };

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pb-10 space-y-6">
        <GoldFrame>
          <PanelTitle icon={<ShoppingBag className="h-3.5 w-3.5" />}>Bazar de Personagens</PanelTitle>
          <Div className="p-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-amber-200/80 italic max-w-2xl">
              Compre e venda personagens de jogadores reais usando <strong className="text-amber-300">Cupons</strong>. Transações seguras e definitivas.
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
                {CLASSES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-amber-300/70">
              Nível mínimo: {minLevel}
              <input type="range" min={0} max={2000} step={50} value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))} />
            </label>
          </Div>
        </GoldFrame>

        <Div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <GoldFrame key={l.id}>
              <Div className="p-4 space-y-3">
                <Div className="flex items-center gap-3">
                  <Div className="h-14 w-14 rounded-sm border border-amber-700/60 bg-black/40 flex items-center justify-center text-3xl">
                    {l.icon}
                  </Div>
                  <Div>
                    <Div className="font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>{l.name}</Div>
                    <Div className="text-[11px] uppercase tracking-widest text-amber-300/70">{l.klass} · Nv {l.level}</Div>
                  </Div>
                </Div>
                {l.highlight && (
                  <Div className="text-xs italic text-amber-200/80 border-l-2 border-amber-600/60 pl-2">
                    ✦ {l.highlight}
                  </Div>
                )}
                <Div className="flex items-center justify-between text-sm border-t border-amber-700/30 pt-2">
                  <span className="text-amber-300/70">Vendedor: <span className="text-amber-200">{l.seller}</span></span>
                </Div>
                <Div className="flex items-center justify-between">
                  <Div className="inline-flex items-center gap-1 text-amber-300 font-bold">
                    <Ticket className="h-4 w-4" /> {l.price.toLocaleString("pt-BR")}
                  </Div>
                  <button onClick={() => buy(l)} className="mmo-btn-gold rounded-sm px-3 py-1.5 text-[11px]">
                    Comprar
                  </button>
                </Div>
              </Div>
            </GoldFrame>
          ))}
          {filtered.length === 0 && (
            <Div className="col-span-full text-center py-10 text-amber-200/60 italic">
              Nenhum personagem encontrado com esses filtros.
            </Div>
          )}
        </Div>
      </section>
    </SiteShell>
  );
}

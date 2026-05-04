import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight,
  Map as MapIcon,
  Wrench,
  Swords,
  Ticket,
  Coins,
  Trophy,
  ShieldCheck,
  BookOpenText,
  Sparkles,
  Crown,
  ScrollText,
  Globe2,
  Skull,
  Flame,
  PawPrint,
  Hammer,
  Target,
  Gem,
  ChevronUp,
  ChevronDown,
  Minus,
  Newspaper,
  Radio,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Div } from "@/components/ui/Div";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { ServerStatus } from "@/components/site/ServerStatus";
import { AuthModal } from "@/components/AuthModal";

const NEWS_TICKER = [
  { icon: <MapIcon className="h-4 w-4" />, date: "17 de mar. de 2026", tag: "[Mapa do Sertão]", text: "A expansão do Sertão Profundo está a todo vapor. Novas áreas e desafios chegando!" },
  { icon: <Wrench className="h-4 w-4" />, date: "15 de mar. de 2026", tag: "[Bugs Corrigidos]", text: "Ajustes em bugs reportados pela comunidade para melhorar estabilidade e balanceamento." },
  { icon: <Swords className="h-4 w-4" />, date: "12 de mar. de 2026", tag: "[Evento PvP Arena]", text: "Preparem suas guildas: o anúncio do torneio de Arena está chegando." },
  { icon: <Ticket className="h-4 w-4" />, date: "10 de mar. de 2026", tag: "[Bazar de Personagens]", text: "Agora você poderá vender seu personagem por cupons de forma segura e oficial." },
  { icon: <Coins className="h-4 w-4" />, date: "08 de mar. de 2026", tag: "[Cupons Disponíveis]", text: "Cupons disponíveis na Webshop. Garanta os seus e aproveite as novidades." },
];

const HIGHLIGHTS = [
  { icon: <MapIcon className="h-4 w-4" />, title: "Expansão do Sertão", body: <>Nossa equipe está trabalhando na expansão do <strong>Sertão Profundo</strong>!</> },
  { icon: <Wrench className="h-4 w-4" />, title: "Ajustes e Estabilidade", body: <>Correções em <strong>bugs reportados</strong> pela comunidade.</> },
  { icon: <Swords className="h-4 w-4" />, title: "Evento PvP Arena", body: <>O <strong>anúncio do torneio de Arena</strong> está chegando.</> },
  { icon: <Ticket className="h-4 w-4" />, title: "Bazar de Personagens", body: <>Agora você pode <strong>vender seu personagem por cupons</strong>.</> },
];

const FEATURES = [
  { icon: <Target className="h-4 w-4" />, text: "Sistema de missões exclusivo com recompensas únicas" },
  { icon: <Gem className="h-4 w-4" />, text: "Sistema de encantamento com Major e Minor Runes" },
  { icon: <Swords className="h-4 w-4" />, text: "Arena PvP com classificações sazonais" },
  { icon: <Hammer className="h-4 w-4" />, text: "Crafting e forja de itens lendários" },
  { icon: <PawPrint className="h-4 w-4" />, text: "Pets, montarias e companheiros de batalha" },
  { icon: <Skull className="h-4 w-4" />, text: "Dungeons e bosses com mecânicas únicas" },
  { icon: <Flame className="h-4 w-4" />, text: "Sistema de party e raids para até 8 jogadores" },
  { icon: <Globe2 className="h-4 w-4" />, text: "Quatro biomas: Caatinga, Agreste, Litoral e Santa Cruz" },
];

type Trend = "up" | "down" | "flat";
type Row = { rank: number; name: string; klass: string; level: number; delta: number; trend: Trend };

const CLASS_LABEL: Record<string, string> = {
  warrior: "Guerreiro", mage: "Mago", archer: "Arqueiro", healer: "Curandeiro", assassin: "Assassino",
};
const CLASS_COLOR: Record<string, string> = {
  Guerreiro: "#c0392b", Mago: "#7c5cd6", Arqueiro: "#3a8b4f", Curandeiro: "#2aa498", Assassino: "#3d6cb8",
};

function TrendIcon({ trend, delta }: { trend: Trend; delta: number }) {
  if (trend === "up") return <span className="inline-flex items-center gap-1 text-emerald-400"><ChevronUp className="h-3.5 w-3.5" /> {delta}</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-1 text-red-400"><ChevronDown className="h-3.5 w-3.5" /> {delta}</span>;
  return <span className="inline-flex items-center gap-1 text-amber-200/60"><Minus className="h-3.5 w-3.5" /> —</span>;
}

function MedalRank({ rank }: { rank: number }) {
  if (rank === 1) return <span>🥇</span>;
  if (rank === 2) return <span>🥈</span>;
  if (rank === 3) return <span>🥉</span>;
  return <span className="text-amber-200/70 font-bold">{rank}</span>;
}

export function MMOLanding() {
  const [tab, setTab] = useState<"level" | "pvp" | "guilds">("level");
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [topLevel, setTopLevel] = useState<Row[]>([]);
  const [topPvp, setTopPvp] = useState<Row[]>([]);
  const [topGuilds, setTopGuilds] = useState<{ rank: number; name: string; members: number }[]>([]);
  const [loadingLb, setLoadingLb] = useState(true);

  const openAuth = (t: "login" | "signup") => { setAuthTab(t); setAuthOpen(true); };

  useEffect(() => {
    (async () => {
      setLoadingLb(true);
      // Top Level
      const lvl = await supabase.from("characters").select("name, class, level").order("level", { ascending: false }).limit(10);
      setTopLevel((lvl.data ?? []).map((c, i) => ({
        rank: i + 1, name: c.name, klass: CLASS_LABEL[c.class] ?? c.class, level: c.level, delta: 0, trend: "flat" as Trend,
      })));

      // Top PvP - count wins per character_id, join names
      const matches = await supabase.from("arena_matches").select("winner_id, arena_points_awarded").not("winner_id", "is", null);
      const tally = new Map<string, number>();
      (matches.data ?? []).forEach((m: any) => {
        if (!m.winner_id) return;
        tally.set(m.winner_id, (tally.get(m.winner_id) ?? 0) + (m.arena_points_awarded ?? 1));
      });
      const winnerIds = Array.from(tally.keys());
      if (winnerIds.length) {
        const chars = await supabase.from("characters").select("id, name, class").in("id", winnerIds);
        const map = new Map((chars.data ?? []).map((c: any) => [c.id, c]));
        const pvp = winnerIds
          .map((id) => ({ id, points: tally.get(id) ?? 0, c: map.get(id) }))
          .filter((x) => x.c)
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)
          .map((x: any, i) => ({
            rank: i + 1, name: x.c.name, klass: CLASS_LABEL[x.c.class] ?? x.c.class, level: x.points, delta: 0, trend: "flat" as Trend,
          }));
        setTopPvp(pvp);
      } else setTopPvp([]);

      // Top Guilds - by member count
      const gms = await supabase.from("guild_members").select("guild_id");
      const gtally = new Map<string, number>();
      (gms.data ?? []).forEach((g: any) => gtally.set(g.guild_id, (gtally.get(g.guild_id) ?? 0) + 1));
      const gids = Array.from(gtally.keys());
      if (gids.length) {
        const guilds = await supabase.from("guilds").select("id, name").in("id", gids);
        const gmap = new Map((guilds.data ?? []).map((g: any) => [g.id, g.name]));
        const tg = gids
          .map((id) => ({ id, members: gtally.get(id) ?? 0, name: gmap.get(id) }))
          .filter((g) => g.name)
          .sort((a, b) => b.members - a.members)
          .slice(0, 10)
          .map((g, i) => ({ rank: i + 1, name: g.name as string, members: g.members }));
        setTopGuilds(tg);
      } else setTopGuilds([]);

      setLoadingLb(false);
    })();
  }, []);

  const currentRows = useMemo(() => (tab === "level" ? topLevel : tab === "pvp" ? topPvp : []), [tab, topLevel, topPvp]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pb-16 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Div className="space-y-6 min-w-0">
          {/* Login */}
          <GoldFrame>
            <PanelTitle icon={<ShieldCheck className="h-3.5 w-3.5" />}>Login</PanelTitle>
            <Div className="grid gap-3 p-4 sm:grid-cols-2">
              <button onClick={() => openAuth("login")} className="mmo-btn-gold rounded-sm py-3 text-center text-sm">Conecte-se</button>
              <button onClick={() => openAuth("signup")} className="mmo-btn-dark rounded-sm py-3 text-center text-sm">Cadastre-se</button>
            </Div>
          </GoldFrame>

          {/* News ticker */}
          <GoldFrame>
            <PanelTitle icon={<Radio className="h-3.5 w-3.5" />}>News Ticker</PanelTitle>
            <Div>
              {NEWS_TICKER.map((n, i) => (
                <a key={i} href="#news" className="grid items-center gap-3 px-4 py-2.5 border-t border-amber-700/15 hover:bg-amber-500/5" style={{ gridTemplateColumns: "32px 1fr auto", color: "#ead7a3" }}>
                  <span style={{ color: "#f0c66b" }}>{n.icon}</span>
                  <span className="text-[12.5px] leading-snug">
                    <span className="text-amber-200/70 mr-2 font-semibold">{n.date}</span>
                    <span className="text-amber-300 font-bold">{n.tag}</span> — {n.text}
                  </span>
                  <ChevronRight className="h-4 w-4 text-amber-300/70" />
                </a>
              ))}
            </Div>
          </GoldFrame>

          {/* News parchment */}
          <GoldFrame>
            <PanelTitle icon={<Newspaper className="h-3.5 w-3.5" />}>News</PanelTitle>
            <Div className="mmo-parchment p-6">
              <h2 id="news" className="text-2xl font-bold inline-flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-amber-700" /> Novidades de Ziv Duel
              </h2>
              <Div className="my-4 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
              <h3 className="text-lg font-bold italic">Destaques do Reino de Oxente</h3>
              <Div className="mt-3 space-y-3">
                {HIGHLIGHTS.map((h, i) => (
                  <Div key={i} className="rounded-sm border border-amber-900/30 bg-amber-50/40 p-3">
                    <Div className="flex items-center gap-2 font-bold"><span className="text-amber-700">{h.icon}</span>{h.title}</Div>
                    <p className="mt-1 text-sm leading-relaxed">{h.body}</p>
                  </Div>
                ))}
              </Div>
              <Div className="my-4 h-px bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
              <h3 className="text-lg font-bold italic">Recursos Exclusivos</h3>
              <ul className="mt-3 grid gap-2">
                {FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-sm border border-amber-900/20 bg-amber-50/40 px-3 py-2 text-sm">
                    <span className="text-amber-700">{f.icon}</span>{f.text}
                  </li>
                ))}
              </ul>
            </Div>
          </GoldFrame>

          {/* Leaderboard */}
          <GoldFrame>
            <PanelTitle icon={<Trophy className="h-3.5 w-3.5" />}>Leaderboard</PanelTitle>
            <Div className="grid grid-cols-3 border-b border-amber-700/40">
              {([
                { k: "level", label: "Top Level", icon: <Crown className="h-3.5 w-3.5" /> },
                { k: "pvp", label: "Top PvP", icon: <Swords className="h-3.5 w-3.5" /> },
                { k: "guilds", label: "Top Guildas", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
              ] as const).map((t) => {
                const active = tab === t.k;
                return (
                  <button key={t.k} onClick={() => setTab(t.k)}
                    className={`flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest ${active ? "text-amber-200 bg-black/30 border-b-2 border-amber-400" : "text-amber-300/60 hover:text-amber-200"}`}
                    style={{ fontFamily: "Cinzel, Georgia, serif" }}>
                    {t.icon}{t.label}
                  </button>
                );
              })}
            </Div>
            <Div>
              {loadingLb && <Div className="px-4 py-6 text-center text-amber-200/60 italic text-sm">Carregando…</Div>}
              {!loadingLb && tab !== "guilds" && currentRows.length === 0 && (
                <Div className="px-4 py-6 text-center text-amber-200/60 italic text-sm">Nenhum dado ainda.</Div>
              )}
              {!loadingLb && tab !== "guilds" && currentRows.map((r) => (
                <Div key={r.rank} className="grid items-center gap-3 px-4 py-2.5 border-t border-amber-700/15" style={{ gridTemplateColumns: "36px 1fr auto auto" }}>
                  <span className="text-center"><MedalRank rank={r.rank} /></span>
                  <Div className="flex flex-col leading-tight">
                    <span className="font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>{r.name}</span>
                    <span className="mt-0.5 inline-block w-max rounded-sm px-1.5 py-px text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: CLASS_COLOR[r.klass] ?? "#555" }}>{r.klass}</span>
                  </Div>
                  <span className="font-bold text-amber-200 tabular-nums">{r.level.toLocaleString("pt-BR")}</span>
                  <span className="text-xs tabular-nums w-10 text-right"><TrendIcon trend={r.trend} delta={r.delta} /></span>
                </Div>
              ))}
              {!loadingLb && tab === "guilds" && topGuilds.length === 0 && (
                <Div className="px-4 py-6 text-center text-amber-200/60 italic text-sm">Nenhuma guilda ainda.</Div>
              )}
              {!loadingLb && tab === "guilds" && topGuilds.map((g) => (
                <Div key={g.rank} className="grid items-center gap-3 px-4 py-2.5 border-t border-amber-700/15" style={{ gridTemplateColumns: "36px 1fr auto" }}>
                  <span className="text-center"><MedalRank rank={g.rank} /></span>
                  <span className="font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>{g.name}</span>
                  <span className="font-bold text-amber-200 tabular-nums text-xs">{g.members} membros</span>
                </Div>
              ))}
            </Div>
          </GoldFrame>
        </Div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <GoldFrame>
            <PanelTitle icon={<Sparkles className="h-3.5 w-3.5 text-amber-300" />}>Webshop</PanelTitle>
            <Div className="p-4 text-center space-y-3">
              <p className="italic text-amber-200/80 text-sm" style={{ fontFamily: "Cinzel, Georgia, serif" }}>Conteúdo Exclusivo</p>
              <button className="mmo-btn-gold w-full rounded-sm py-2.5 text-xs">Cupons</button>
              <Link to="/bazar" className="mmo-btn-gold block w-full rounded-sm py-2.5 text-xs">Bazar de Personagens</Link>
            </Div>
          </GoldFrame>

          <GoldFrame>
            <PanelTitle icon={<BookOpenText className="h-3.5 w-3.5" />}>Wiki</PanelTitle>
            <Div className="p-4 text-center space-y-3">
              <Div className="mx-auto h-14 w-14 rounded-sm border border-amber-700/60 bg-black/40 flex items-center justify-center">
                <ScrollText className="h-7 w-7 text-amber-300" />
              </Div>
              <p className="text-xs text-amber-200/80 italic">Guias, classes, profissões e tudo de Oxente.</p>
              <Link to="/wiki" className="mmo-btn-gold block w-full rounded-sm py-2.5 text-[11px]">Explorar a Wiki</Link>
            </Div>
          </GoldFrame>

          <ServerStatus />
        </aside>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </SiteShell>
  );
}

export default MMOLanding;

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MessageCircle,
  Instagram,
  Users2,
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
import bgTexture from "@/assets/site-bg-texture.png";
import zivLogo from "@/assets/zivduel-logo.png";
import { Div } from "@/components/ui/Div";

/* =========================================================
   Wonderland-style MMORPG fan-site layout, themed for Ziv Duel.
   - Single self-contained component
   - Uses semantic gold/wood tokens defined locally on the section
   - Imports background texture and the Ziv Duel logo
   ========================================================= */

const TOP_NAV = [
  { label: "Página Inicial", href: "#home" },
  { label: "Registro de Alterações", href: "#changelog" },
  { label: "Biblioteca", href: "#library" },
  { label: "Bazar de Personagens", href: "#bazar" },
  { label: "Wiki", href: "#wiki" },
  { label: "Suporte", href: "#support" },
  { label: "Comunidade", href: "#community" },
];

const NEWS_TICKER = [
  {
    icon: <MapIcon className="h-4 w-4" />,
    date: "17 de mar. de 2026",
    tag: "[Mapa do Sertão]",
    text: "A expansão do Sertão Profundo está a todo vapor. Novas áreas e desafios chegando!",
  },
  {
    icon: <Wrench className="h-4 w-4" />,
    date: "15 de mar. de 2026",
    tag: "[Bugs Corrigidos]",
    text: "Ajustes em bugs reportados pela comunidade para melhorar estabilidade e balanceamento.",
  },
  {
    icon: <Swords className="h-4 w-4" />,
    date: "12 de mar. de 2026",
    tag: "[Evento PvP Arena]",
    text: "Preparem suas guildas: o anúncio do torneio de Arena está chegando. Fiquem atentos!",
  },
  {
    icon: <Ticket className="h-4 w-4" />,
    date: "10 de mar. de 2026",
    tag: "[Bazar de Personagens]",
    text: "Agora você poderá vender seu personagem por cupons de forma segura e oficial.",
  },
  {
    icon: <Coins className="h-4 w-4" />,
    date: "08 de mar. de 2026",
    tag: "[Cupons Disponíveis]",
    text: "Cupons disponíveis na Webshop. Garanta os seus e aproveite as novidades.",
  },
];

const HIGHLIGHTS = [
  {
    icon: <MapIcon className="h-4 w-4" />,
    title: "Expansão do Sertão",
    body: (
      <>
        Nossa equipe está trabalhando intensamente na expansão, e o progresso do{" "}
        <strong>Sertão Profundo</strong> está a todo vapor! Preparem-se para novas aventuras
        em terras inexploradas.
      </>
    ),
  },
  {
    icon: <Wrench className="h-4 w-4" />,
    title: "Ajustes e Estabilidade",
    body: (
      <>
        Realizamos uma série de correções em <strong>bugs reportados</strong> pela comunidade
        para garantir uma experiência de jogo mais fluida e justa para todos.
      </>
    ),
  },
  {
    icon: <Swords className="h-4 w-4" />,
    title: "Evento PvP Arena",
    body: (
      <>
        Preparem suas armas! O grande <strong>anúncio do torneio de Arena</strong> está
        chegando. Fiquem atentos às datas e preparem suas guildas para a batalha.
      </>
    ),
  },
  {
    icon: <Ticket className="h-4 w-4" />,
    title: "Bazar de Personagens",
    body: (
      <>
        Uma grande novidade! Agora você poderá <strong>vender seu personagem por cupons</strong>{" "}
        de forma segura e oficial dentro do nosso ecossistema.
      </>
    ),
  },
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
const LEADERBOARD: { rank: number; name: string; klass: string; level: number; delta: number; trend: Trend }[] = [
  { rank: 1, name: "MestreCangaceiro", klass: "Guerreiro", level: 1842, delta: 12, trend: "up" },
  { rank: 2, name: "ShadowMage", klass: "Mago", level: 1790, delta: 8, trend: "up" },
  { rank: 3, name: "FlechaDoSertão", klass: "Arqueiro", level: 1735, delta: 3, trend: "down" },
  { rank: 4, name: "PhoenixKnight", klass: "Guerreiro", level: 1698, delta: 15, trend: "up" },
  { rank: 5, name: "FrostBurn", klass: "Mago", level: 1654, delta: 5, trend: "up" },
  { rank: 6, name: "StormArrow", klass: "Arqueiro", level: 1621, delta: 1, trend: "down" },
  { rank: 7, name: "NightWalker", klass: "Assassino", level: 1589, delta: 22, trend: "up" },
  { rank: 8, name: "ThunderClap", klass: "Guerreiro", level: 1543, delta: 0, trend: "flat" },
  { rank: 9, name: "MysticRune", klass: "Curandeiro", level: 1510, delta: 7, trend: "up" },
  { rank: 10, name: "GoldenBow", klass: "Arqueiro", level: 1488, delta: 3, trend: "down" },
];

const CLASS_COLOR: Record<string, string> = {
  Guerreiro: "var(--mmo-warrior)",
  Mago: "var(--mmo-mage)",
  Arqueiro: "var(--mmo-archer)",
  Curandeiro: "var(--mmo-healer)",
  Assassino: "var(--mmo-assassin)",
};

function TrendIcon({ trend, delta }: { trend: Trend; delta: number }) {
  if (trend === "up") return <span className="inline-flex items-center gap-1 text-emerald-400"><ChevronUp className="h-3.5 w-3.5" /> {delta}</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-1 text-red-400"><ChevronDown className="h-3.5 w-3.5" /> {delta}</span>;
  return <span className="inline-flex items-center gap-1 text-amber-200/60"><Minus className="h-3.5 w-3.5" /> —</span>;
}

function MedalRank({ rank }: { rank: number }) {
  if (rank === 1) return <span title="1º">🥇</span>;
  if (rank === 2) return <span title="2º">🥈</span>;
  if (rank === 3) return <span title="3º">🥉</span>;
  return <span className="text-amber-200/70 font-bold">{rank}</span>;
}

/* ---------- Decorative ornament ---------- */
function GoldFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Div className={`mmo-frame ${className}`}>
      <span className="mmo-frame__corner mmo-frame__corner--tl" />
      <span className="mmo-frame__corner mmo-frame__corner--tr" />
      <span className="mmo-frame__corner mmo-frame__corner--bl" />
      <span className="mmo-frame__corner mmo-frame__corner--br" />
      {children}
    </Div>
  );
}

function PanelTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Div className="mmo-title">
      <span className="mmo-title__deco" />
      <span className="mmo-title__text inline-flex items-center gap-2">
        {icon}
        {children}
      </span>
      <span className="mmo-title__deco" />
    </Div>
  );
}

export function MMOLanding() {
  const [tab, setTab] = useState<"level" | "pvp" | "guilds">("level");
  const [online, setOnline] = useState(11352);

  useEffect(() => {
    const id = setInterval(() => setOnline((n) => n + Math.floor(Math.random() * 7) - 3), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <main
      id="home"
      className="mmo-root min-h-screen w-full text-amber-50"
      style={{
        // Local design tokens scoped to this landing
        "--mmo-gold": "#d7a042",
        "--mmo-gold-light": "#f0c66b",
        "--mmo-gold-dark": "#7a541d",
        "--mmo-wood": "#2b241d",
        "--mmo-wood-light": "#3a3026",
        "--mmo-wood-dark": "#1a1612",
        "--mmo-parchment": "#e1d5c1",
        "--mmo-parchment-dark": "#c9b896",
        "--mmo-warrior": "#c0392b",
        "--mmo-mage": "#7c5cd6",
        "--mmo-archer": "#3a8b4f",
        "--mmo-healer": "#2aa498",
        "--mmo-assassin": "#3d6cb8",
        backgroundImage: `url(${bgTexture})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        fontFamily: "Lato, system-ui, sans-serif",
      } as React.CSSProperties}
    >
      <style>{`
        .mmo-root h1, .mmo-root h2, .mmo-root h3, .mmo-root .mmo-display { font-family: Cinzel, Georgia, serif; letter-spacing: 0.02em; }
        .mmo-root::before {
          content: ""; position: fixed; inset: 0; z-index: 0;
          background: linear-gradient(180deg, rgba(20,15,10,0.55) 0%, rgba(20,15,10,0.35) 30%, rgba(20,15,10,0.7) 100%);
          pointer-events: none;
        }
        .mmo-root > * { position: relative; z-index: 1; }

        .mmo-utility {
          background: linear-gradient(#1a1410, #0e0a07);
          border-bottom: 1px solid rgba(215,160,66,0.25);
          color: #e7d6a8;
        }
        .mmo-nav {
          background: linear-gradient(#7d5f36 0%, #564029 100%);
          border-top: 1px solid rgba(240,198,107,0.5);
          border-bottom: 2px solid rgba(0,0,0,0.5);
          box-shadow: inset 0 -2px 0 rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.4);
        }
        .mmo-nav a, .mmo-nav button {
          font-family: Cinzel, Georgia, serif;
          letter-spacing: 0.12em;
          color: #fff3d6;
          text-shadow: 0 1px 0 rgba(0,0,0,0.6);
          transition: color .15s, background .15s;
        }
        .mmo-nav a:hover, .mmo-nav button:hover { color: #ffe8a8; background: rgba(0,0,0,0.18); }

        .mmo-hero {
          position: relative;
          padding: 1.5rem 1rem 3rem;
        }
        .mmo-logo { filter: drop-shadow(0 10px 24px rgba(0,0,0,0.65)); }

        /* Frame system — gold ornate borders over wood panels */
        .mmo-frame {
          position: relative;
          background: linear-gradient(#372e25 0%, #211a13 100%);
          border: 1px solid rgba(215,160,66,0.55);
          box-shadow:
            inset 0 0 0 1px rgba(255,215,140,0.08),
            inset 0 0 24px rgba(0,0,0,0.5),
            0 10px 24px rgba(0,0,0,0.5);
          border-radius: 4px;
        }
        .mmo-frame__corner {
          position: absolute; width: 14px; height: 14px;
          background: linear-gradient(#f0c66b, #d7a042);
          border: 1px solid #2b1d0a;
          transform: rotate(45deg);
        }
        .mmo-frame__corner--tl { top: -7px; left: -7px; }
        .mmo-frame__corner--tr { top: -7px; right: -7px; }
        .mmo-frame__corner--bl { bottom: -7px; left: -7px; }
        .mmo-frame__corner--br { bottom: -7px; right: -7px; }

        .mmo-title {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.6rem 1rem;
          background: linear-gradient(#7d5f36 0%, #564029 100%);
          border-bottom: 1px solid rgba(240,198,107,0.35);
          color: #fff3d6;
          font-family: Cinzel, Georgia, serif;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.78rem;
          text-shadow: 0 1px 0 rgba(0,0,0,0.6);
        }
        .mmo-title__text { flex: none; }
        .mmo-title__deco {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(240,198,107,.5) 50%, transparent 100%);
        }

        .mmo-btn-gold {
          background: linear-gradient(#e0ac52 0%, #bd7f28 100%);
          color: #2b1d0a;
          border: 1px solid #7a541d;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 2px 4px rgba(0,0,0,.4);
          font-family: Cinzel, Georgia, serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 700;
          transition: filter .15s, transform .05s;
        }
        .mmo-btn-gold:hover { filter: brightness(1.08); }
        .mmo-btn-gold:active { transform: translateY(1px); }

        .mmo-btn-dark {
          background: linear-gradient(#3a3026 0%, #211a13 100%);
          color: #f0c66b;
          border: 1px solid rgba(215,160,66,0.55);
          font-family: Cinzel, Georgia, serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .mmo-btn-dark:hover { color: #ffe8a8; border-color: rgba(240,198,107,0.85); }

        .mmo-row {
          display: grid; grid-template-columns: 32px 1fr auto;
          align-items: center; gap: 0.75rem;
          padding: 0.65rem 1rem;
          border-top: 1px solid rgba(215,160,66,0.15);
          color: #ead7a3;
          transition: background .15s;
        }
        .mmo-row:hover { background: rgba(215,160,66,0.06); }
        .mmo-row .mmo-row__icon { color: #f0c66b; }

        .mmo-parchment {
          background: linear-gradient(#e1d5c1 0%, #d8cab6 50%, #e1d5c1 100%);
          color: #2b1d0a;
          border: 1px solid rgba(122,84,29,0.45);
          box-shadow: inset 0 0 0 2px rgba(255,255,255,0.4);
        }

        .mmo-leader-row {
          display: grid;
          grid-template-columns: 36px 1fr auto auto;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1rem;
          border-top: 1px solid rgba(215,160,66,0.12);
        }
        .mmo-leader-row:hover { background: rgba(215,160,66,0.06); }
        .mmo-class-pill {
          display: inline-block; font-size: 0.66rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 1px 6px; border-radius: 2px;
          color: white;
        }
        .mmo-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(215,160,66,.35) 20%, rgba(215,160,66,.55) 50%, rgba(215,160,66,.35) 80%, transparent 100%);
          margin: 1.25rem 0;
        }

        @keyframes mmoPulse { 0%,100% { opacity:1 } 50% { opacity:0.55 } }
        .mmo-online-dot {
          width: 8px; height: 8px; border-radius: 99px; background: #38d27a;
          box-shadow: 0 0 10px #38d27a;
          animation: mmoPulse 1.6s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>

      {/* ===== Top utility bar ===== */}
      <Div className="mmo-utility">
        <Div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-amber-200">
            <MessageCircle className="h-3.5 w-3.5" /> Discord
          </a>
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-amber-200">
            <Instagram className="h-3.5 w-3.5" /> Instagram
          </a>
          <span className="inline-flex items-center gap-1.5">
            <Users2 className="h-3.5 w-3.5" />
            <span className="mmo-online-dot" /> {online.toLocaleString("pt-BR")} <span className="text-amber-200/70">Online</span>
          </span>
        </Div>
      </Div>

      {/* ===== Main nav ===== */}
      <nav className="mmo-nav">
        <Div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-1 px-2 py-2 text-[11px]">
          {TOP_NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-1.5 rounded-sm font-bold uppercase"
            >
              {item.label}
            </a>
          ))}
          <select className="ml-2 bg-black/30 border border-amber-600/50 text-amber-100 text-[11px] uppercase font-bold px-2 py-1 rounded-sm">
            <option>pt</option><option>en</option><option>es</option>
          </select>
          <a href="#support" className="px-3 py-1.5 rounded-sm font-bold uppercase">Suporte</a>
          <a href="#terms" className="px-3 py-1.5 rounded-sm font-bold uppercase">Termos</a>
        </Div>
      </nav>

      {/* ===== Hero with logo ===== */}
      <section className="mmo-hero">
        <Div className="mx-auto max-w-7xl flex justify-center">
          <img
            src={zivLogo}
            alt="Ziv Duel — An Epic Beginning"
            className="mmo-logo w-[min(640px,80vw)] h-auto"
            width={1024}
            height={680}
          />
        </Div>
      </section>

      {/* ===== Body grid: center column + sidebar ===== */}
      <section className="mx-auto max-w-7xl px-3 pb-16 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ===== CENTER COLUMN ===== */}
        <Div className="space-y-6 min-w-0">
          {/* Login panel */}
          <GoldFrame>
            <PanelTitle icon={<ShieldCheck className="h-3.5 w-3.5" />}>Login</PanelTitle>
            <Div className="grid gap-3 p-4 sm:grid-cols-2">
              <Link to="/auth" className="mmo-btn-gold rounded-sm py-3 text-center text-sm">
                Conecte-se
              </Link>
              <Link to="/auth" className="mmo-btn-dark rounded-sm py-3 text-center text-sm">
                Cadastre-se
              </Link>
            </Div>
          </GoldFrame>

          {/* News ticker */}
          <GoldFrame>
            <PanelTitle icon={<Radio className="h-3.5 w-3.5" />}>News Ticker</PanelTitle>
            <Div>
              {NEWS_TICKER.map((n, i) => (
                <a key={i} href="#news" className="mmo-row block hover:no-underline" style={{ display: "grid" }}>
                  <span className="mmo-row__icon">{n.icon}</span>
                  <span className="text-[12.5px] leading-snug">
                    <span className="text-amber-200/70 mr-2 font-semibold">{n.date}</span>
                    <span className="text-amber-300 font-bold">{n.tag}</span>{" "}
                    — {n.text}
                  </span>
                  <ChevronRight className="h-4 w-4 text-amber-300/70" />
                </a>
              ))}
            </Div>
          </GoldFrame>

          {/* News article (parchment) */}
          <GoldFrame>
            <PanelTitle icon={<Newspaper className="h-3.5 w-3.5" />}>News</PanelTitle>
            <Div className="mmo-parchment p-6">
              <h2 id="news" className="text-2xl font-bold inline-flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-[var(--mmo-gold-dark)]" />
                Novidades de Ziv Duel
              </h2>
              <Div className="mmo-divider" />

              <h3 className="text-lg font-bold italic">Destaques do Reino de Oxente</h3>
              <Div className="mt-3 space-y-3">
                {HIGHLIGHTS.map((h, i) => (
                  <Div key={i} className="rounded-sm border border-amber-900/30 bg-amber-50/40 p-3">
                    <Div className="flex items-center gap-2 font-bold">
                      <span className="text-[var(--mmo-gold-dark)]">{h.icon}</span>
                      {h.title}
                    </Div>
                    <p className="mt-1 text-sm leading-relaxed">{h.body}</p>
                  </Div>
                ))}
              </Div>

              <p className="mt-5 text-sm leading-relaxed">
                Nosso servidor oferece a funcionalidade de <em>multi-mundo</em>, permitindo que você
                transite entre todos os personagens da sua conta, independentemente do mundo. Somos
                um único servidor com diversos mundos, o que significa que você compartilhará suas{" "}
                <em>moedas, VIP e fidelidade</em> sem a necessidade de novas compras.
              </p>

              <Div className="mmo-divider" />

              <h3 className="text-lg font-bold italic">Recursos Exclusivos</h3>
              <ul className="mt-3 grid gap-2">
                {FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-sm border border-amber-900/20 bg-amber-50/40 px-3 py-2 text-sm">
                    <span className="text-[var(--mmo-gold-dark)]">{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <Div className="mmo-divider" />
              <p className="text-center text-sm italic">
                Atenciosamente, equipe <strong>Ziv Duel</strong>
              </p>
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
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    className={`flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest transition ${
                      active ? "text-amber-200 bg-black/30 border-b-2 border-amber-400" : "text-amber-300/60 hover:text-amber-200"
                    }`}
                    style={{ fontFamily: "Cinzel, Georgia, serif" }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                );
              })}
            </Div>

            <Div className="grid grid-cols-[36px_1fr_auto_auto] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-300/70">
              <span>#</span><span>Player</span><span>Level</span><span>±</span>
            </Div>

            <Div>
              {LEADERBOARD.map((r) => (
                <Div key={r.rank} className="mmo-leader-row">
                  <span className="text-center"><MedalRank rank={r.rank} /></span>
                  <Div className="flex flex-col leading-tight">
                    <span className="font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>{r.name}</span>
                    <span className="mmo-class-pill mt-0.5 w-max" style={{ background: CLASS_COLOR[r.klass] }}>{r.klass}</span>
                  </Div>
                  <span className="font-bold text-amber-200 tabular-nums">{r.level.toLocaleString("pt-BR")}</span>
                  <span className="text-xs tabular-nums w-10 text-right"><TrendIcon trend={r.trend} delta={r.delta} /></span>
                </Div>
              ))}
            </Div>
            <Div className="text-center text-[11px] italic text-amber-300/60 px-3 py-2 border-t border-amber-700/30">
              Atualizado a cada 5 minutos · Dados do servidor em tempo real
            </Div>
          </GoldFrame>
        </Div>

        {/* ===== SIDEBAR ===== */}
        <aside className="space-y-6">
          {/* Webshop */}
          <GoldFrame>
            <Div className="mmo-title justify-center">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span className="mmo-title__text">Webshop</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            </Div>
            <Div className="p-4 text-center space-y-3">
              <p className="italic text-amber-200/80 text-sm" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
                Conteúdo Exclusivo
              </p>
              <button className="mmo-btn-gold w-full rounded-sm py-2.5 text-xs">Cupons</button>
              <button className="mmo-btn-gold w-full rounded-sm py-2.5 text-xs">Bazar de Personagens</button>
            </Div>
          </GoldFrame>

          {/* Boosted */}
          <GoldFrame>
            <PanelTitle><Flame className="h-3.5 w-3.5" /> Boosted</PanelTitle>
            <Div className="grid grid-cols-2 gap-3 p-4">
              <Div className="text-center">
                <Div className="mx-auto h-16 w-16 rounded-sm border border-amber-700/60 bg-black/40 flex items-center justify-center text-3xl">
                  👹
                </Div>
                <Div className="mt-2 text-[10px] uppercase tracking-widest text-amber-300/70">Boss</Div>
                <Div className="text-sm font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>Cabra-Cabriola</Div>
              </Div>
              <Div className="text-center">
                <Div className="mx-auto h-16 w-16 rounded-sm border border-amber-700/60 bg-black/40 flex items-center justify-center text-3xl">
                  🐉
                </Div>
                <Div className="mt-2 text-[10px] uppercase tracking-widest text-amber-300/70">Criatura</Div>
                <Div className="text-sm font-bold text-amber-100" style={{ fontFamily: "Cinzel, Georgia, serif" }}>Lobisomem</Div>
              </Div>
            </Div>
          </GoldFrame>

          {/* Wiki */}
          <GoldFrame>
            <PanelTitle><BookOpenText className="h-3.5 w-3.5" /> Wiki</PanelTitle>
            <Div className="p-4 text-center space-y-3">
              <Div className="mx-auto h-14 w-14 rounded-sm border border-amber-700/60 bg-black/40 flex items-center justify-center">
                <ScrollText className="h-7 w-7 text-amber-300" />
              </Div>
              <p className="text-xs text-amber-200/80 italic">
                Guias, monstros, missões e todo o conhecimento de Oxente.
              </p>
              <button className="mmo-btn-gold w-full rounded-sm py-2.5 text-[11px]">
                Explorar a Wiki
              </button>
            </Div>
          </GoldFrame>

          {/* Server status */}
          <GoldFrame>
            <PanelTitle><Globe2 className="h-3.5 w-3.5" /> Status do Servidor</PanelTitle>
            <Div className="p-4 space-y-2 text-sm">
              <Div className="flex items-center justify-between">
                <span className="text-amber-200/80">Mundo</span>
                <span className="font-bold text-amber-100">Oxente</span>
              </Div>
              <Div className="flex items-center justify-between">
                <span className="text-amber-200/80">Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                  <span className="mmo-online-dot" /> Online
                </span>
              </Div>
              <Div className="flex items-center justify-between">
                <span className="text-amber-200/80">Players</span>
                <span className="font-bold text-amber-100 tabular-nums">{online.toLocaleString("pt-BR")}</span>
              </Div>
              <Div className="flex items-center justify-between">
                <span className="text-amber-200/80">Uptime</span>
                <span className="font-bold text-amber-100">99.97%</span>
              </Div>
            </Div>
          </GoldFrame>
        </aside>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-amber-700/30 bg-black/60 backdrop-blur">
        <Div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-amber-200/70">
          <p className="max-w-3xl mx-auto leading-relaxed">
            Por favor, entre em contato conosco via Discord se não conseguir registrar uma nova conta
            ou fazer login no jogo. Este servidor monitora e bloqueia continuamente endereços IP
            envolvidos em atividades suspeitas.
          </p>
          <p className="mt-3 text-amber-300/80" style={{ fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.18em" }}>
            © 2026 ZIV DUEL · ALL RIGHTS RESERVED
          </p>
        </Div>
      </footer>
    </main>
  );
}

export default MMOLanding;

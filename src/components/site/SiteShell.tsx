import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Instagram, Users2 } from "lucide-react";
import bgTexture from "@/assets/site-bg-texture.png";
import zivLogo from "@/assets/zivduel-logo.png";
import { Div } from "@/components/ui/Div";
import { AuthModal } from "@/components/AuthModal";
import { DiscordIcon } from "@/components/site/DiscordIcon";

const NAV = [
  { label: "Início", to: "/" },
  { label: "Bazar", to: "/bazar" },
  { label: "Wiki", to: "/wiki" },
  { label: "Suporte", to: "/suporte" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [online, setOnline] = useState(11352);
  const loc = useLocation();

  useEffect(() => {
    const id = setInterval(() => setOnline((n) => Math.max(8000, n + Math.floor(Math.random() * 9) - 4)), 4000);
    return () => clearInterval(id);
  }, []);

  const openAuth = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <main
      className="mmo-root min-h-screen w-full text-amber-50"
      style={{
        "--mmo-gold": "#d7a042",
        "--mmo-gold-light": "#f0c66b",
        "--mmo-gold-dark": "#7a541d",
        "--mmo-wood": "#2b241d",
        "--mmo-parchment": "#e1d5c1",
        backgroundImage: `url(${bgTexture})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center top",
        fontFamily: "Lato, system-ui, sans-serif",
      } as React.CSSProperties}
    >
      <style>{`
        .mmo-root h1, .mmo-root h2, .mmo-root h3 { font-family: Cinzel, Georgia, serif; letter-spacing: 0.02em; }
        .mmo-root::before {
          content: ""; position: fixed; inset: 0; z-index: 0;
          background: linear-gradient(180deg, rgba(20,15,10,0.55) 0%, rgba(20,15,10,0.35) 30%, rgba(20,15,10,0.7) 100%);
          pointer-events: none;
        }
        .mmo-root > * { position: relative; z-index: 1; }
        .mmo-utility { background: linear-gradient(#1a1410, #0e0a07); border-bottom: 1px solid rgba(215,160,66,0.25); color: #e7d6a8; }
        .mmo-nav { background: linear-gradient(#7d5f36, #564029); border-top: 1px solid rgba(240,198,107,0.5); border-bottom: 2px solid rgba(0,0,0,0.5); box-shadow: inset 0 -2px 0 rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.4); }
        .mmo-nav a, .mmo-nav button { font-family: Cinzel, Georgia, serif; letter-spacing: 0.12em; color: #fff3d6; text-shadow: 0 1px 0 rgba(0,0,0,0.6); transition: color .15s, background .15s; }
        .mmo-nav a:hover, .mmo-nav button:hover { color: #ffe8a8; background: rgba(0,0,0,0.18); }
        .mmo-nav a.active { color: #ffe8a8; background: rgba(0,0,0,0.25); }
        .mmo-discord-btn {
          background: linear-gradient(#5865F2 0%, #404eed 100%);
          color: white !important;
          border: 1px solid #2c36b8;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 2px 6px rgba(0,0,0,.45);
          padding: 6px 12px; border-radius: 4px;
          display: inline-flex; align-items: center; gap: 6px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;
          font-family: Cinzel, Georgia, serif; font-size: 11px;
        }
        .mmo-discord-btn:hover { filter: brightness(1.1); background: linear-gradient(#5865F2 0%, #404eed 100%); }
        @keyframes mmoPulse { 0%,100% { opacity:1 } 50% { opacity:0.55 } }
        .mmo-online-dot { width: 8px; height: 8px; border-radius: 99px; background: #38d27a; box-shadow: 0 0 10px #38d27a; animation: mmoPulse 1.6s ease-in-out infinite; display: inline-block; }
        .mmo-frame { position: relative; background: linear-gradient(#372e25, #211a13); border: 1px solid rgba(215,160,66,0.55); box-shadow: inset 0 0 0 1px rgba(255,215,140,0.08), inset 0 0 24px rgba(0,0,0,0.5), 0 10px 24px rgba(0,0,0,0.5); border-radius: 4px; }
        .mmo-frame__corner { position: absolute; width: 14px; height: 14px; background: linear-gradient(#f0c66b, #d7a042); border: 1px solid #2b1d0a; transform: rotate(45deg); }
        .mmo-frame__corner--tl { top: -7px; left: -7px; } .mmo-frame__corner--tr { top: -7px; right: -7px; }
        .mmo-frame__corner--bl { bottom: -7px; left: -7px; } .mmo-frame__corner--br { bottom: -7px; right: -7px; }
        .mmo-title { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: linear-gradient(#7d5f36, #564029); border-bottom: 1px solid rgba(240,198,107,0.35); color: #fff3d6; font-family: Cinzel, Georgia, serif; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.78rem; text-shadow: 0 1px 0 rgba(0,0,0,0.6); }
        .mmo-title__deco { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(240,198,107,.5) 50%, transparent); }
        .mmo-btn-gold { background: linear-gradient(#e0ac52, #bd7f28); color: #2b1d0a; border: 1px solid #7a541d; box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 2px 4px rgba(0,0,0,.4); font-family: Cinzel, Georgia, serif; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; transition: filter .15s; }
        .mmo-btn-gold:hover { filter: brightness(1.08); }
        .mmo-btn-dark { background: linear-gradient(#3a3026, #211a13); color: #f0c66b; border: 1px solid rgba(215,160,66,0.55); font-family: Cinzel, Georgia, serif; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; }
        .mmo-btn-dark:hover { color: #ffe8a8; border-color: rgba(240,198,107,0.85); }
        .mmo-parchment { background: linear-gradient(#e1d5c1, #d8cab6 50%, #e1d5c1); color: #2b1d0a; border: 1px solid rgba(122,84,29,0.45); box-shadow: inset 0 0 0 2px rgba(255,255,255,0.4); }
      `}</style>

      {/* Top utility bar */}
      <Div className="mmo-utility">
        <Div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
          <a href="https://discord.gg" target="_blank" rel="noreferrer" className="mmo-discord-btn">
            <DiscordIcon className="h-3.5 w-3.5" /> Discord
          </a>
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-amber-200">
            <Instagram className="h-3.5 w-3.5" /> Instagram
          </a>
          <span className="inline-flex items-center gap-1.5">
            <Users2 className="h-3.5 w-3.5" />
            <span className="mmo-online-dot" /> {online.toLocaleString("pt-BR")}{" "}
            <span className="text-amber-200/70">Online</span>
          </span>
        </Div>
      </Div>

      {/* Main nav */}
      <nav className="mmo-nav">
        <Div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-1 px-2 py-2 text-[11px]">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded-sm font-bold uppercase ${loc.pathname === item.to ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <button onClick={() => openAuth("login")} className="px-3 py-1.5 rounded-sm font-bold uppercase">
            Conecte-se
          </button>
          <button onClick={() => openAuth("signup")} className="px-3 py-1.5 rounded-sm font-bold uppercase">
            Cadastre-se
          </button>
        </Div>
      </nav>

      {/* Hero logo */}
      <section className="px-4 pt-6 pb-4">
        <Div className="mx-auto max-w-7xl flex justify-center">
          <Link to="/">
            <img src={zivLogo} alt="Ziv Duel" className="w-[min(520px,70vw)] h-auto" style={{ filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.65))" }} />
          </Link>
        </Div>
      </section>

      {children}

      {/* Footer */}
      <footer className="border-t border-amber-700/30 bg-black/60 backdrop-blur mt-10">
        <Div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-amber-200/70 space-y-3">
          <Div className="flex flex-wrap justify-center gap-4 text-amber-300/80 uppercase tracking-widest" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
            <Link to="/wiki" className="hover:text-amber-200">Wiki</Link>
            <Link to="/suporte" className="hover:text-amber-200">Suporte</Link>
            <Link to="/bazar" className="hover:text-amber-200">Bazar</Link>
            <Link to="/termos" className="hover:text-amber-200">Termos</Link>
            <a href="https://discord.gg" target="_blank" rel="noreferrer" className="hover:text-amber-200 inline-flex items-center gap-1">
              <DiscordIcon className="h-3 w-3" /> Discord
            </a>
          </Div>
          <p className="text-amber-300/70" style={{ fontFamily: "Cinzel, Georgia, serif", letterSpacing: "0.18em" }}>
            © 2026 ZIV DUEL · ALL RIGHTS RESERVED
          </p>
        </Div>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </main>
  );
}

export function GoldFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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

export function PanelTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Div className="mmo-title">
      <span className="mmo-title__deco" />
      <span className="inline-flex items-center gap-2">{icon}{children}</span>
      <span className="mmo-title__deco" />
    </Div>
  );
}

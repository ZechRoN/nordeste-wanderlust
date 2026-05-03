import { useState } from "react";
import { SiteShell, GoldFrame, PanelTitle } from "@/components/site/SiteShell";
import { Div } from "@/components/ui/Div";
import { BookOpenText, Sword, Sparkles, Hammer } from "lucide-react";

const CLASSES = [
  { name: "Guerreiro", icon: "⚔️", color: "#c0392b", attr: "Força", role: "Tank / DPS corpo a corpo", desc: "Mestre do combate físico, alta vitalidade e dano em área. Domina armas pesadas e escudos." },
  { name: "Mago", icon: "🔮", color: "#7c5cd6", attr: "Inteligência", role: "DPS mágico / Controle", desc: "Conjura magias elementais devastadoras à distância. Frágil, mas letal com mana abundante." },
  { name: "Arqueiro", icon: "🏹", color: "#3a8b4f", attr: "Agilidade", role: "DPS à distância", desc: "Preciso, móvel e mortal. Elimina inimigos antes que cheguem perto. Especialista em armadilhas." },
  { name: "Curandeiro", icon: "💚", color: "#2aa498", attr: "Vontade", role: "Suporte / Cura", desc: "Sustenta o grupo com curas, buffs e remoção de status. Indispensável em raids." },
  { name: "Assassino", icon: "🗡️", color: "#3d6cb8", attr: "Velocidade", role: "Burst DPS / Furtivo", desc: "Ataca pelas sombras com dano crítico explosivo. Especialista em furtividade e venenos." },
];

const SUBCLASSES = [
  { base: "Guerreiro", name: "Cangaceiro", desc: "Especializa em duas armas leves, ganha velocidade e dano sangrante." },
  { base: "Guerreiro", name: "Defensor de Oxente", desc: "Tank puro com escudo e provocação em área." },
  { base: "Mago", name: "Pajé Elemental", desc: "Domina os 4 elementos com combos de magias." },
  { base: "Mago", name: "Necromante do Sertão", desc: "Invoca esqueletos e drena vida dos inimigos." },
  { base: "Arqueiro", name: "Caçador de Caatinga", desc: "Armadilhas, pets e tiros perfurantes." },
  { base: "Arqueiro", name: "Atirador de Elite", desc: "Tiros precisos a longuíssima distância com dano massivo." },
  { base: "Curandeiro", name: "Beata Sagrada", desc: "Cura em área e ressurreição com escalonamento por fé." },
  { base: "Curandeiro", name: "Druida do Agreste", desc: "Híbrido: cura, buffs naturais e dano físico." },
  { base: "Assassino", name: "Lapidador", desc: "Combos rápidos com adagas envenenadas." },
  { base: "Assassino", name: "Sombra do Litoral", desc: "Stealth permanente e teletransporte curto." },
];

const PROFESSIONS = [
  { name: "Ferreiro", icon: "🔨", desc: "Forja armas e armaduras, repara equipamentos." },
  { name: "Alquimista", icon: "⚗️", desc: "Cria poções de cura, buffs e venenos." },
  { name: "Pescador", icon: "🎣", desc: "Captura peixes raros do litoral para receitas." },
  { name: "Caçador", icon: "🏹", desc: "Coleta peles, ossos e troféus de criaturas." },
  { name: "Lenhador", icon: "🪓", desc: "Coleta madeira para construção e crafting." },
  { name: "Minerador", icon: "⛏️", desc: "Extrai minérios e gemas das montanhas." },
  { name: "Cozinheiro", icon: "🍲", desc: "Prepara pratos típicos com buffs temporários." },
  { name: "Costureiro", icon: "🧵", desc: "Tece roupas e armaduras leves de pano." },
  { name: "Curtidor", icon: "🪡", desc: "Trabalha couro para armaduras médias." },
  { name: "Joalheiro", icon: "💎", desc: "Lapida gemas e cria anéis e amuletos." },
  { name: "Encantador", icon: "✨", desc: "Encanta itens com runas Major e Minor." },
  { name: "Escriba", icon: "📜", desc: "Cria pergaminhos de magia e mapas." },
  { name: "Domador", icon: "🐺", desc: "Treina e captura pets e montarias." },
  { name: "Construtor", icon: "🏛️", desc: "Edifica estruturas em cidades de clã." },
  { name: "Cartógrafo", icon: "🗺️", desc: "Revela áreas ocultas e cria atalhos." },
];

const SECTIONS = [
  { key: "classes", label: "Classes", icon: <Sword className="h-3.5 w-3.5" /> },
  { key: "subclasses", label: "Subclasses", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: "profissoes", label: "Profissões", icon: <Hammer className="h-3.5 w-3.5" /> },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

export default function WikiPage() {
  const [section, setSection] = useState<SectionKey>("classes");

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-3 pb-10 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside>
          <GoldFrame>
            <PanelTitle icon={<BookOpenText className="h-3.5 w-3.5" />}>Wiki</PanelTitle>
            <Div className="p-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-sm text-sm uppercase tracking-widest ${
                    section === s.key ? "bg-amber-900/40 text-amber-200" : "text-amber-300/70 hover:bg-black/20"
                  }`}
                  style={{ fontFamily: "Cinzel, Georgia, serif", fontSize: 11 }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </Div>
          </GoldFrame>
        </aside>

        {/* Content */}
        <Div className="min-w-0">
          {section === "classes" && (
            <GoldFrame>
              <PanelTitle icon={<Sword className="h-3.5 w-3.5" />}>Classes</PanelTitle>
              <Div className="mmo-parchment p-5">
                <h1 className="text-2xl font-bold mb-1">Classes do Reino de Oxente</h1>
                <p className="text-sm italic mb-4">Cinco classes principais, cada uma com identidade e estilo de jogo únicos.</p>
                <Div className="grid gap-3 sm:grid-cols-2">
                  {CLASSES.map((c) => (
                    <Div key={c.name} className="rounded-sm border border-amber-900/30 bg-amber-50/50 p-3">
                      <Div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{c.icon}</span>
                        <Div>
                          <Div className="font-bold text-base" style={{ color: c.color }}>{c.name}</Div>
                          <Div className="text-[11px] uppercase tracking-widest opacity-70">{c.role}</Div>
                        </Div>
                      </Div>
                      <p className="text-sm">{c.desc}</p>
                      <p className="text-xs mt-2"><strong>Atributo base:</strong> {c.attr}</p>
                    </Div>
                  ))}
                </Div>
              </Div>
            </GoldFrame>
          )}

          {section === "subclasses" && (
            <GoldFrame>
              <PanelTitle icon={<Sparkles className="h-3.5 w-3.5" />}>Subclasses</PanelTitle>
              <Div className="mmo-parchment p-5">
                <h1 className="text-2xl font-bold mb-1">Subclasses Híbridas</h1>
                <p className="text-sm italic mb-4">Ao atingir nível 50, escolha uma subclasse para refinar seu estilo.</p>
                <Div className="grid gap-3 sm:grid-cols-2">
                  {SUBCLASSES.map((s) => (
                    <Div key={s.name} className="rounded-sm border border-amber-900/30 bg-amber-50/50 p-3">
                      <Div className="text-[10px] uppercase tracking-widest opacity-70">{s.base}</Div>
                      <Div className="font-bold text-base">{s.name}</Div>
                      <p className="text-sm mt-1">{s.desc}</p>
                    </Div>
                  ))}
                </Div>
              </Div>
            </GoldFrame>
          )}

          {section === "profissoes" && (
            <GoldFrame>
              <PanelTitle icon={<Hammer className="h-3.5 w-3.5" />}>Profissões</PanelTitle>
              <Div className="mmo-parchment p-5">
                <h1 className="text-2xl font-bold mb-1">Profissões</h1>
                <p className="text-sm italic mb-4">Disponíveis a partir do nível 100. Cada personagem pode aprender até 2 profissões.</p>
                <Div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PROFESSIONS.map((p) => (
                    <Div key={p.name} className="rounded-sm border border-amber-900/30 bg-amber-50/50 p-3 flex gap-3 items-start">
                      <span className="text-2xl">{p.icon}</span>
                      <Div>
                        <Div className="font-bold">{p.name}</Div>
                        <p className="text-xs mt-0.5">{p.desc}</p>
                      </Div>
                    </Div>
                  ))}
                </Div>
              </Div>
            </GoldFrame>
          )}
        </Div>
      </section>
    </SiteShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CharacterCreation } from "@/components/CharacterCreation";
import { CharacterDashboard } from "@/components/CharacterDashboard";
import { useToast } from "@/hooks/use-toast";
import { GameButton, GamePanel, GamePanelTabs } from "@/components/ui/game-panel";
import { Div } from "@/components/ui/Div";
import { LogOut, Plus, Search } from "lucide-react";

type CharacterRow = {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  gold: number;
  current_biome: string;
  health?: number;
  max_health?: number;
  mana?: number;
  max_mana?: number;
  strength?: number;
  agility?: number;
  intelligence?: number;
  vitality?: number;
  luck?: number;
};

const CLASS_META: Record<string, { label: string; accent: string; emoji: string }> = {
  warrior: { label: "Guerreiro", accent: "warrior", emoji: "⚔️" },
  mage: { label: "Mago", accent: "mage", emoji: "🔮" },
  archer: { label: "Arqueiro", accent: "archer", emoji: "🏹" },
  healer: { label: "Curandeiro", accent: "healer", emoji: "💚" },
  assassin: { label: "Assassino", accent: "assassin", emoji: "🗡️" },
};

const CLASS_TABS = [
  { key: "all", label: "All" },
  ...Object.entries(CLASS_META).map(([key, meta]) => ({ key, label: `${meta.emoji} ${meta.label}` })),
];

const Game = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRow | "create" | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [biomeFilter, setBiomeFilter] = useState<string>("all");
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 60]);
  const [focusedCharacterId, setFocusedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadCharacters();
  }, [user?.id, navigate]);

  const loadCharacters = async () => {
    if (!user) return;
    setErrorMessage(null);
    setLoading(true);
    const { data, error } = await supabase.from("characters").select("*").eq("user_id", user.id);
    if (error) {
      setErrorMessage(error.message);
      toast({ title: "Erro ao carregar personagens", description: error.message, variant: "destructive" });
      setCharacters([]);
    } else {
      setCharacters((data as any) || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const handleCharacterCreated = (character: any) => { setCharacters(prev => [...prev, character]); setSelectedCharacter(character); };

  const levelBounds = useMemo<[number, number]>(() => {
    if (!characters.length) return [1, 60];
    const levels = characters.map((c) => c.level || 1);
    return [Math.min(...levels), Math.max(...levels)];
  }, [characters]);

  useEffect(() => {
    setLevelRange(([min, max]) => {
      const nextMin = Math.max(levelBounds[0], min);
      const nextMax = Math.min(levelBounds[1], max);
      if (nextMin <= nextMax) return [nextMin, nextMax];
      return [levelBounds[0], levelBounds[1]];
    });
  }, [levelBounds]);

  const biomeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of characters) if (c.current_biome) set.add(c.current_biome);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return characters
      .filter((c) => {
        if (classFilter !== "all" && c.class !== classFilter) return false;
        if (biomeFilter !== "all" && c.current_biome !== biomeFilter) return false;
        const level = c.level ?? 1;
        if (level < levelRange[0] || level > levelRange[1]) return false;
        if (!normalizedQuery) return true;
        return c.name.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
  }, [biomeFilter, characters, classFilter, levelRange, query]);

  const focusedCharacter = (() => {
    const current = filteredCharacters.find((c) => c.id === focusedCharacterId);
    return current ?? filteredCharacters[0] ?? null;
  })();

  useEffect(() => {
    if (!focusedCharacterId && filteredCharacters[0]?.id) setFocusedCharacterId(filteredCharacters[0].id);
  }, [filteredCharacters, focusedCharacterId]);

  if (loading) {
    return (
      <Div className="fixed inset-0 rpg-game-bg flex items-center justify-center">
        <span className="rpg-loading text-lg">Carregando personagens...</span>
      </Div>
    );
  }

  if (selectedCharacter && selectedCharacter !== "create") {
    return <CharacterDashboard character={selectedCharacter as any} onBack={() => setSelectedCharacter(null)} onSignOut={handleSignOut} />;
  }

  return (
    <Div className="fixed inset-0 rpg-game-bg flex items-center justify-center p-4">
      {selectedCharacter === "create" ? (
        <CharacterCreation onCharacterCreated={handleCharacterCreated} onCancel={() => setSelectedCharacter(null)} />
      ) : characters.length === 0 ? (
        <CharacterCreation onCharacterCreated={handleCharacterCreated} />
      ) : (
        <Div className="w-full max-w-5xl">
          <GamePanel
            title="Character"
            onClose={undefined}
            footer={
              <Div className="flex items-center justify-between gap-2 w-full">
                <GameButton variant="danger" onClick={handleSignOut}>
                  <LogOut className="h-3 w-3 mr-1" />
                  Sair
                </GameButton>
                <Div className="flex items-center gap-2">
                  <span className="rpg-capacity">Characters: {characters.length}/5</span>
                  <GameButton variant="secondary" onClick={() => setSelectedCharacter("create")} disabled={characters.length >= 5}>
                    <Plus className="h-3 w-3 mr-1" />
                    Novo
                  </GameButton>
                  <GameButton
                    variant="gold"
                    disabled={!focusedCharacter}
                    onClick={() => focusedCharacter && setSelectedCharacter(focusedCharacter)}
                  >
                    Entrar
                  </GameButton>
                </Div>
              </Div>
            }
          >
            <Div className="flex items-center justify-between gap-2 mb-2">
              <GamePanelTabs
                tabs={CLASS_TABS}
                activeTab={classFilter}
                onTabChange={(key) => setClassFilter(key)}
              />
              <Div className="relative w-[220px] shrink-0">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
                <input
                  className="rpg-input pl-8"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Div>
            </Div>

            {errorMessage && (
              <Div className="rpg-item-detail" style={{ borderColor: "hsl(0 65% 50%)" }}>
                {errorMessage}
              </Div>
            )}

            <Div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-2">
              <Div className="space-y-2">
                <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                  <Div className="text-[11px]">
                    Guild: Main Street
                  </Div>
                </Div>
                <Div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                  {filteredCharacters.map((char) => {
                    const meta = CLASS_META[char.class] ?? { label: char.class, accent: "primary", emoji: "👤" };
                    const isActive = focusedCharacter?.id === char.id;
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => setFocusedCharacterId(char.id)}
                        className={`rpg-class-card w-full text-left ${isActive ? "rpg-class-selected" : ""}`}
                      >
                        <Div className="flex items-center gap-2">
                          <Div skin="slot" className="rpg-slot-filled" style={{ width: 32, height: 32, maxWidth: 32, minWidth: 32 }}>
                            <span className="rpg-slot-icon">{meta.emoji}</span>
                          </Div>
                          <Div className="min-w-0 flex-1">
                            <Div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[12px] truncate">{char.name}</span>
                              <span className="rpg-combatant-level">Lv. {char.level}</span>
                            </Div>
                            <Div className="text-[10px] opacity-70 truncate">{meta.label}</Div>
                          </Div>
                        </Div>
                      </button>
                    );
                  })}
                </Div>
              </Div>

              <Div className="space-y-2">
                {focusedCharacter ? (
                  <>
                    <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                      <Div className="flex items-center justify-between gap-2">
                        <Div className="font-bold text-[13px]">{focusedCharacter.name}</Div>
                        <Div className="text-[11px] opacity-70">
                          {CLASS_META[focusedCharacter.class]?.label ?? focusedCharacter.class} • Lv. {focusedCharacter.level}
                        </Div>
                      </Div>
                    </Div>

                    <Div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                        <Div className="flex justify-between text-[11px]">
                          <span>HP</span>
                          <span>{focusedCharacter.health ?? "-"} / {focusedCharacter.max_health ?? "-"}</span>
                        </Div>
                        <Div className="flex justify-between text-[11px]">
                          <span>MP</span>
                          <span>{focusedCharacter.mana ?? "-"} / {focusedCharacter.max_mana ?? "-"}</span>
                        </Div>
                        <Div className="flex justify-between text-[11px]">
                          <span>EXP</span>
                          <span>{focusedCharacter.experience}</span>
                        </Div>
                        <Div className="flex justify-between text-[11px]">
                          <span>Gold</span>
                          <span>{focusedCharacter.gold}</span>
                        </Div>
                        <Div className="flex justify-between text-[11px]">
                          <span>Biome</span>
                          <span>{focusedCharacter.current_biome}</span>
                        </Div>
                      </Div>

                      <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                        <Div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                          <Div className="flex justify-between"><span>STR</span><span>{focusedCharacter.strength ?? "-"}</span></Div>
                          <Div className="flex justify-between"><span>AGI</span><span>{focusedCharacter.agility ?? "-"}</span></Div>
                          <Div className="flex justify-between"><span>INT</span><span>{focusedCharacter.intelligence ?? "-"}</span></Div>
                          <Div className="flex justify-between"><span>VIT</span><span>{focusedCharacter.vitality ?? "-"}</span></Div>
                          <Div className="flex justify-between"><span>LUK</span><span>{focusedCharacter.luck ?? "-"}</span></Div>
                        </Div>
                      </Div>
                    </Div>
                  </>
                ) : (
                  <Div className="rpg-item-detail">Nenhum personagem encontrado.</Div>
                )}
              </Div>
            </Div>
          </GamePanel>
        </Div>
      )}
    </Div>
  );
};

export default Game;

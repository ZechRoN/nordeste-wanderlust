import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CharacterCreation } from "@/components/CharacterCreation";
import { CharacterDashboard } from "@/components/CharacterDashboard";
import heroBanner from "@/assets/hero-banner.jpg";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Moon, Plus, Search, Sun } from "lucide-react";

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

const Game = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterRow | "create" | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [biomeFilter, setBiomeFilter] = useState<string>("all");
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 60]);
  const [previewCharacter, setPreviewCharacter] = useState<CharacterRow | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadCharacters();
  }, [user, navigate]);

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

  if (loading) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[image:var(--gradient-hero)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-36 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedCharacter && selectedCharacter !== "create") {
    return <CharacterDashboard character={selectedCharacter as any} onBack={() => setSelectedCharacter(null)} onSignOut={handleSignOut} />;
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[image:var(--gradient-hero)]">
      {selectedCharacter === "create" ? (
        <div className="px-4 py-10">
          <CharacterCreation onCharacterCreated={handleCharacterCreated} onCancel={() => setSelectedCharacter(null)} />
        </div>
      ) : characters.length === 0 ? (
        <div className="px-4 py-10">
          <CharacterCreation onCharacterCreated={handleCharacterCreated} />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">Seleção de personagem</h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  {filteredCharacters.length}/{characters.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Bem-vindo{user?.email ? `, ${user.email}` : ""}. Filtra, dá preview e entra no jogo.
              </p>
              {errorMessage && (
                <p className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={resolvedTheme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
              <Button onClick={() => setSelectedCharacter("create")} disabled={characters.length >= 5}>
                <Plus className="mr-2 h-4 w-4" />
                Novo ({characters.length}/5)
              </Button>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Filtros</CardTitle>
              <CardDescription>Mobile-first e rápido: tudo aqui já atualiza na hora.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="character-search">Buscar</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="character-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                    placeholder="Nome do personagem"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Classe</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(CLASS_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.emoji} {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bioma</Label>
                <Select value={biomeFilter} onValueChange={setBiomeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {biomeOptions.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nível ({levelRange[0]}–{levelRange[1]})</Label>
                <Slider
                  value={levelRange}
                  min={levelBounds[0]}
                  max={levelBounds[1]}
                  step={1}
                  onValueChange={(v) => setLevelRange([v[0] ?? levelBounds[0], v[1] ?? levelBounds[1]])}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredCharacters.map((char) => {
                const meta = CLASS_META[char.class] ?? { label: char.class, accent: "primary", emoji: "👤" };
                return (
                  <motion.div
                    key={char.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Card className="group h-full overflow-hidden">
                      <CardHeader className="space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base">{char.name}</CardTitle>
                            <CardDescription className="truncate">
                              {meta.emoji} {meta.label} • Nível {char.level}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {char.current_biome}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <button
                          type="button"
                          className="relative block w-full overflow-hidden rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          onClick={() => setPreviewCharacter(char)}
                          aria-label={`Abrir preview de ${char.name}`}
                        >
                          <img
                            src={heroBanner}
                            alt=""
                            className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                            <Badge style={{ background: `hsl(var(--${meta.accent}))`, color: "white" }}>
                              {meta.emoji} {meta.label}
                            </Badge>
                            <div className="text-xs font-medium text-foreground">
                              🪙 {char.gold} • ⭐ {char.experience} XP
                            </div>
                          </div>
                        </button>

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>FOR {char.strength ?? "-"}</span>
                          <span>AGI {char.agility ?? "-"}</span>
                          <span>INT {char.intelligence ?? "-"}</span>
                          <span>VIT {char.vitality ?? "-"}</span>
                          <span>SOR {char.luck ?? "-"}</span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between gap-2">
                        <Button variant="outline" onClick={() => setPreviewCharacter(char)}>
                          Preview
                        </Button>
                        <Button onClick={() => setSelectedCharacter(char)} aria-label={`Entrar com ${char.name}`}>
                          Entrar
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredCharacters.length === 0 && (
            <div className="mt-10 text-center text-sm text-muted-foreground">
              Nada encontrado. Ajusta os filtros e bora de novo.
            </div>
          )}

          <Dialog open={!!previewCharacter} onOpenChange={(open) => !open && setPreviewCharacter(null)}>
            <DialogContent className="sm:max-w-2xl">
              {previewCharacter && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-xl border">
                    <img
                      src={heroBanner}
                      alt={`Imagem de ${previewCharacter.name}`}
                      className="h-56 w-full object-cover sm:h-full"
                      loading="eager"
                      decoding="async"
                    />
                  </div>

                  <div className="space-y-4">
                    <DialogHeader className="space-y-1">
                      <DialogTitle className="flex items-center justify-between gap-3">
                        <span className="truncate">{previewCharacter.name}</span>
                        <Badge variant="secondary">Nível {previewCharacter.level}</Badge>
                      </DialogTitle>
                      <DialogDescription>
                        {CLASS_META[previewCharacter.class]?.emoji ?? "👤"} {CLASS_META[previewCharacter.class]?.label ?? previewCharacter.class} • {previewCharacter.current_biome}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl border p-3">
                        <div className="text-xs text-muted-foreground">Ouro</div>
                        <div className="font-medium">🪙 {previewCharacter.gold}</div>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="text-xs text-muted-foreground">Experiência</div>
                        <div className="font-medium">⭐ {previewCharacter.experience} XP</div>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="text-xs text-muted-foreground">Vida</div>
                        <div className="font-medium">❤️ {previewCharacter.health ?? "-"} / {previewCharacter.max_health ?? "-"}</div>
                      </div>
                      <div className="rounded-xl border p-3">
                        <div className="text-xs text-muted-foreground">Mana</div>
                        <div className="font-medium">✨ {previewCharacter.mana ?? "-"} / {previewCharacter.max_mana ?? "-"}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="rounded-xl border p-3">FOR <span className="text-foreground">{previewCharacter.strength ?? "-"}</span></div>
                      <div className="rounded-xl border p-3">AGI <span className="text-foreground">{previewCharacter.agility ?? "-"}</span></div>
                      <div className="rounded-xl border p-3">INT <span className="text-foreground">{previewCharacter.intelligence ?? "-"}</span></div>
                      <div className="rounded-xl border p-3">VIT <span className="text-foreground">{previewCharacter.vitality ?? "-"}</span></div>
                      <div className="rounded-xl border p-3">SOR <span className="text-foreground">{previewCharacter.luck ?? "-"}</span></div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={() => setPreviewCharacter(null)}>
                        Fechar
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedCharacter(previewCharacter);
                          setPreviewCharacter(null);
                        }}
                      >
                        Entrar com {previewCharacter.name}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default Game;

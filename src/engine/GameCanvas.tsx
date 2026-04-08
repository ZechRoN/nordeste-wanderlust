import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react';
import { TILE_SIZE, Direction, WALK_SPEED, MAP_WIDTH, MAP_HEIGHT } from './constants';
import { generateTileMap, isWalkable, getBiomeAt, getBiomeSpawnPoint, getMapPOIs, TileMapData, MapPOI } from './TileMap';
import { renderMap, renderParallax, getDayFactor, renderDayNightOverlay, renderPlayer, renderPOI, renderMinimap, renderControls, renderCreature } from './Renderer';
import { preloadEssentialSprites, scheduleBackgroundPreload } from './SpriteLoader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Div } from '@/components/ui/Div';
import { GameButton } from '@/components/ui/game-panel';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type MinimapFilters = {
  showCreatures: boolean;
  showPlayer: boolean;
  showNpcs: boolean;
};

const MINIMAP_FILTERS_STORAGE_KEY = 'ziv_minimap_filters_v1';
const DEFAULT_MINIMAP_FILTERS: MinimapFilters = { showCreatures: true, showPlayer: true, showNpcs: true };
const DAY_NIGHT_CYCLE_MS = 6 * 60 * 1000;

type PlayerAction = 'idle' | 'walk' | 'attack' | 'hurt' | 'death';

function parseMinimapFilters(raw: unknown): MinimapFilters {
  if (!raw || typeof raw !== 'object') return DEFAULT_MINIMAP_FILTERS;
  const record = raw as Record<string, unknown>;
  const showCreatures = record.showCreatures === false ? false : true;
  const showPlayer = record.showPlayer === false ? false : true;
  const showNpcs = record.showNpcs === false ? false : true;
  return { showCreatures, showPlayer, showNpcs };
}

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  gold: number;
  position_x: number;
  position_y: number;
  current_biome: 'caatinga' | 'agreste' | 'litoral' | 'santa_cruz';
}

interface Creature {
  id: string;
  name: string;
  description: string;
  biome: string;
  level: number;
  rarity: string;
  special_ability: string;
}

interface SpawnedCreature extends Creature {
  worldX: number;
  worldY: number;
}

interface GameCanvasProps {
  character: Character;
  onCharacterUpdate: (character: any) => void;
  onStartCombat: (creature: Creature) => void;
  onOpenMenu: () => void;
  onOpenInventory: () => void;
  onNpcInteracted?: (npcName: string) => void;
  hudRightSlot?: ReactNode;
}

export function GameCanvas({ character, onCharacterUpdate, onStartCombat, onOpenMenu, onOpenInventory, onNpcInteracted, hudRightSlot }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCssSizeRef = useRef<number>(0);
  const minimapDprRef = useRef<number>(1);
  const animFrameRef = useRef(0);
  const worldStartMsRef = useRef<number>(Date.now());
  const playerActionRef = useRef<PlayerAction>('idle');
  const playerActionStartMsRef = useRef<number>(0);
  const playerActionUntilMsRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const playerPosRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef({ x: 0, y: 0 });
  const directionRef = useRef<Direction>(Direction.DOWN);
  const isMovingRef = useRef(false);
  const mapRef = useRef<TileMapData | null>(null);
  const creaturesRef = useRef<SpawnedCreature[]>([]);
  const poisRef = useRef<MapPOI[]>([]);
  const lastMoveTimeRef = useRef(0);
  const [interactMessage, setInteractMessage] = useState<string | null>(null);
  const exploredRef = useRef<Uint8Array | null>(null);
  const minimapZoomRef = useRef(2);
  const minimapAlphaRef = useRef(0.92);
  const [minimapZoom, setMinimapZoom] = useState(2);
  const [minimapAlpha, setMinimapAlpha] = useState(0.92);
  const [activeQuestCount, setActiveQuestCount] = useState(0);
  const activeQuestCountRef = useRef(0);
  const minimapFiltersRef = useRef<MinimapFilters>(DEFAULT_MINIMAP_FILTERS);
  const [minimapFilters, setMinimapFilters] = useState<MinimapFilters>(DEFAULT_MINIMAP_FILTERS);
  const [minimapFiltersOpen, setMinimapFiltersOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MINIMAP_FILTERS_STORAGE_KEY);
      if (!raw) return;
      const parsed = parseMinimapFilters(JSON.parse(raw));
      minimapFiltersRef.current = parsed;
      setMinimapFilters(parsed);
    } catch {
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(MINIMAP_FILTERS_STORAGE_KEY, JSON.stringify(minimapFilters));
    } catch {
    }
  }, [minimapFilters]);

  const setMinimapFilter = useCallback(<K extends keyof MinimapFilters>(key: K, value: MinimapFilters[K]) => {
    setMinimapFilters(prev => {
      const next = { ...prev, [key]: value };
      minimapFiltersRef.current = next;
      return next;
    });
  }, []);

  const setMinimapZoomClamped = useCallback((next: number) => {
    const value = Math.max(1, Math.min(3, Math.round(next)));
    setMinimapZoom(value);
    minimapZoomRef.current = value;
  }, []);

  const triggerPlayerAction = useCallback((action: PlayerAction, durationMs: number) => {
    const now = Date.now();
    playerActionRef.current = action;
    playerActionStartMsRef.current = now;
    playerActionUntilMsRef.current = now + Math.max(0, durationMs);
  }, []);

  useEffect(() => {
    if (character.health <= 0) {
      triggerPlayerAction('death', DAY_NIGHT_CYCLE_MS);
      return;
    }
    if (playerActionRef.current === 'death') {
      triggerPlayerAction('idle', 0);
    }
  }, [character.health, triggerPlayerAction]);

  // Initialize map and player position
  useEffect(() => {
    preloadEssentialSprites(character.current_biome, character.class);
    scheduleBackgroundPreload();

    const map = generateTileMap(42);
    mapRef.current = map;
    exploredRef.current = new Uint8Array(map.width * map.height);

    // Get spawn point based on current biome
    const spawn = getBiomeSpawnPoint(character.current_biome);
    // Find walkable tile near spawn
    let spawnX = spawn.x;
    let spawnY = spawn.y;
    for (let r = 0; r < 10; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const tx = spawn.x + dx;
          const ty = spawn.y + dy;
          if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT && isWalkable(map.tiles[ty][tx])) {
            spawnX = tx;
            spawnY = ty;
            r = 10; dx = r + 1; dy = r + 1; // break all loops
          }
        }
      }
    }

    playerPosRef.current = { x: spawnX, y: spawnY };
    targetPosRef.current = { x: spawnX, y: spawnY };

    // Load POIs
    poisRef.current = getMapPOIs();

    const markExplored = (x: number, y: number) => {
      const explored = exploredRef.current;
      if (!explored) return;
      const radius = 4;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
          explored[ty * map.width + tx] = 1;
        }
      }
    };

    markExplored(spawnX, spawnY);

    // Load creatures from DB and spawn them
    loadCreatures();
  }, []);

  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const cssSize = Math.max(120, Math.floor(Math.min(rect.width, rect.height)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      minimapCssSizeRef.current = cssSize;
      minimapDprRef.current = dpr;
      canvas.width = Math.floor(cssSize * dpr);
      canvas.height = Math.floor(cssSize * dpr);
    };

    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const loadActiveQuests = async () => {
      const { data, error } = await supabase
        .from('character_quests' as any)
        .select('id')
        .eq('character_id', character.id)
        .eq('completed', false);
      if (error) return;
      const count = (data as any)?.length ?? 0;
      setActiveQuestCount(count);
      activeQuestCountRef.current = count;
    };
    loadActiveQuests();
  }, [character.id]);

  const loadCreatures = async () => {
    try {
      const { data } = await supabase.from('creatures').select('*');
      if (data) {
        const spawned: SpawnedCreature[] = [];
        data.forEach((creature: Creature) => {
          // Spawn 2-3 instances per creature in their biome
          const count = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            const region = {
              caatinga: { sx: 2, sy: 2, ex: 38, ey: 28 },
              agreste: { sx: 42, sy: 2, ex: 78, ey: 28 },
              litoral: { sx: 2, sy: 32, ex: 38, ey: 58 },
              santa_cruz: { sx: 42, sy: 32, ex: 78, ey: 58 },
            }[creature.biome] || { sx: 2, sy: 2, ex: 38, ey: 28 };

            const wx = region.sx + Math.floor(Math.random() * (region.ex - region.sx));
            const wy = region.sy + Math.floor(Math.random() * (region.ey - region.sy));

            if (mapRef.current && isWalkable(mapRef.current.tiles[wy]?.[wx])) {
              spawned.push({ ...creature, worldX: wx, worldY: wy });
            }
          }
        });
        creaturesRef.current = spawned;
      }
    } catch (e) {
      console.error('Failed to load creatures', e);
    }
  };

  const handleInteract = useCallback(() => {
    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;

    for (const poi of poisRef.current) {
      const dist = Math.abs(poi.x - px) + Math.abs(poi.y - py);
      if (dist <= 2) {
        setInteractMessage(`${poi.emoji} ${poi.name}`);
        setTimeout(() => setInteractMessage(null), 2000);

        if (poi.type === 'rest') {
          toast.success('Descansando... Vida e mana restauradas!');
        } else if (poi.type === 'quest') {
          toast.info(`Quest: ${poi.name}`);
        } else if (poi.type === 'shop') {
          toast.info(`Loja: ${poi.name}`);
        } else if (poi.type === 'npc') {
          toast.info(`NPC: ${poi.name}`);
          onNpcInteracted?.(poi.name);
        }
        return;
      }
    }

    for (const creature of creaturesRef.current) {
      const dist = Math.abs(creature.worldX - px) + Math.abs(creature.worldY - py);
      if (dist <= 2) {
        triggerPlayerAction('attack', 520);
        onStartCombat(creature);
        return;
      }
    }

    setInteractMessage('Nada para interagir aqui...');
    setTimeout(() => setInteractMessage(null), 1500);
  }, [onStartCombat, onNpcInteracted, triggerPlayerAction]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysRef.current.add(e.key.toLowerCase());

      if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        triggerPlayerAction('attack', 520);
      }
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        triggerPlayerAction('hurt', 420);
      }
      
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        onOpenInventory();
      }
      if (e.key.toLowerCase() === 'm' || e.key === 'Escape') {
        e.preventDefault();
        onOpenMenu();
      }
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleInteract();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [character, handleInteract, onOpenInventory, onOpenMenu, triggerPlayerAction]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    const updateAndRender = () => {
      if (!running || !mapRef.current) {
        if (running) requestAnimationFrame(updateAndRender);
        return;
      }

      animFrameRef.current++;
      const map = mapRef.current;

      // Handle movement
      const now = Date.now();
      if (now - lastMoveTimeRef.current > 120) {
        const keys = keysRef.current;
        let dx = 0, dy = 0;
        if (keys.has('w') || keys.has('arrowup')) { dy = -1; directionRef.current = Direction.UP; }
        if (keys.has('s') || keys.has('arrowdown')) { dy = 1; directionRef.current = Direction.DOWN; }
        if (keys.has('a') || keys.has('arrowleft')) { dx = -1; directionRef.current = Direction.LEFT; }
        if (keys.has('d') || keys.has('arrowright')) { dx = 1; directionRef.current = Direction.RIGHT; }

        if (dx !== 0 || dy !== 0) {
          const newX = playerPosRef.current.x + dx;
          const newY = playerPosRef.current.y + dy;

          if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT && isWalkable(map.tiles[newY][newX])) {
            playerPosRef.current = { x: newX, y: newY };
            isMovingRef.current = true;
            lastMoveTimeRef.current = now;
            const explored = exploredRef.current;
            if (explored) {
              const radius = 4;
              for (let ry = -radius; ry <= radius; ry++) {
                for (let rx = -radius; rx <= radius; rx++) {
                  const tx = newX + rx;
                  const ty = newY + ry;
                  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) continue;
                  explored[ty * map.width + tx] = 1;
                }
              }
            }

            // Check biome change
            const newBiome = getBiomeAt(newX, newY);
            if (newBiome !== character.current_biome) {
              supabase
                .from('characters')
                .update({ current_biome: newBiome, position_x: newX, position_y: newY })
                .eq('id', character.id)
                .select()
                .single()
                .then(({ data }) => {
                  if (data) onCharacterUpdate(data);
                });
              toast.info(`Entrou no bioma: ${newBiome}`);
            }

            // Random creature encounter (very low chance)
            if (Math.random() < 0.005) {
              const biome = getBiomeAt(newX, newY);
              const nearby = creaturesRef.current.filter(c => c.biome === biome);
              if (nearby.length > 0) {
                const creature = nearby[Math.floor(Math.random() * nearby.length)];
                toast.warning(`${creature.name} te atacou!`);
                triggerPlayerAction('hurt', 420);
                onStartCombat(creature);
              }
            }
          }
        } else {
          isMovingRef.current = false;
        }
      }

      // Camera follow player (smooth)
      const targetCamX = playerPosRef.current.x * TILE_SIZE - canvas.width / 2 + TILE_SIZE / 2;
      const targetCamY = playerPosRef.current.y * TILE_SIZE - canvas.height / 2 + TILE_SIZE / 2;
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.1;

      // Clamp camera
      cameraRef.current.x = Math.max(0, Math.min(cameraRef.current.x, MAP_WIDTH * TILE_SIZE - canvas.width));
      cameraRef.current.y = Math.max(0, Math.min(cameraRef.current.y, MAP_HEIGHT * TILE_SIZE - canvas.height));

      const timeOfDay01 = ((now - worldStartMsRef.current) % DAY_NIGHT_CYCLE_MS) / DAY_NIGHT_CYCLE_MS;
      const dayFactor = getDayFactor(timeOfDay01);
      renderParallax(ctx, cameraRef.current.x, cameraRef.current.y, canvas.width, canvas.height, animFrameRef.current, dayFactor);

      // Render map
      renderMap(ctx, map, cameraRef.current.x, cameraRef.current.y, canvas.width, canvas.height, animFrameRef.current);

      // Render POIs
      for (const poi of poisRef.current) {
        renderPOI(ctx, poi, cameraRef.current.x, cameraRef.current.y, animFrameRef.current);
      }

      // Render creatures
      for (const creature of creaturesRef.current) {
        const screenX = creature.worldX * TILE_SIZE - cameraRef.current.x;
        const screenY = creature.worldY * TILE_SIZE - cameraRef.current.y;
        if (screenX > -TILE_SIZE && screenX < canvas.width + TILE_SIZE && screenY > -TILE_SIZE && screenY < canvas.height + TILE_SIZE) {
          renderCreature(ctx, creature.worldX, creature.worldY, cameraRef.current.x, cameraRef.current.y, creature.rarity, animFrameRef.current, creature.name);
        }
      }

      const hasTimedAction = now < playerActionUntilMsRef.current;
      const action: PlayerAction =
        character.health <= 0 ? 'death'
        : hasTimedAction ? playerActionRef.current
        : isMovingRef.current ? 'walk'
        : 'idle';

      const actionTimeMs = hasTimedAction ? now - playerActionStartMsRef.current : 0;
      if (!hasTimedAction && playerActionRef.current !== 'idle' && character.health > 0) {
        playerActionRef.current = 'idle';
        playerActionStartMsRef.current = 0;
        playerActionUntilMsRef.current = 0;
      }

      // Render player
      renderPlayer(
        ctx,
        playerPosRef.current.x, playerPosRef.current.y,
        cameraRef.current.x, cameraRef.current.y,
        directionRef.current,
        character.class,
        animFrameRef.current,
        isMovingRef.current,
        action,
        actionTimeMs
      );

      // Player name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const nameX = playerPosRef.current.x * TILE_SIZE - cameraRef.current.x + TILE_SIZE / 2;
      const nameY = playerPosRef.current.y * TILE_SIZE - cameraRef.current.y - 4;
      ctx.fillText(character.name, nameX, nameY);

      renderDayNightOverlay(ctx, canvas.width, canvas.height, timeOfDay01);

      const minimapCanvas = minimapCanvasRef.current;
      const minimapCtx = minimapCanvas?.getContext('2d');
      if (minimapCtx) {
        const dpr = minimapDprRef.current;
        const cssSize = minimapCssSizeRef.current || 0;
        if (cssSize > 0) {
          const filters = minimapFiltersRef.current;
          const allowPoiTypes: MapPOI['type'][] = (['npc', 'creature', 'shop', 'quest', 'rest'] as const).filter((type) => {
            if (type === 'npc') return filters.showNpcs;
            if (type === 'creature') return filters.showCreatures;
            return true;
          });
          minimapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
          minimapCtx.clearRect(0, 0, cssSize, cssSize);
          renderMinimap(minimapCtx, map, playerPosRef.current.x, playerPosRef.current.y, cssSize, cssSize, cssSize, {
            zoom: minimapZoomRef.current,
            alpha: minimapAlphaRef.current,
            explored: exploredRef.current ?? undefined,
            pois: poisRef.current,
            trackedPoiTypes: activeQuestCountRef.current > 0 ? ['quest'] : [],
            position: { x: 0, y: 0 },
            size: cssSize,
            showPlayer: filters.showPlayer,
            allowPoiTypes,
          });
        }
      }
      renderControls(ctx, canvas.width, canvas.height);

      // Interaction message
      if (interactMessage) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        const msgWidth = ctx.measureText(interactMessage).width + 24;
        ctx.fillRect(canvas.width / 2 - msgWidth / 2, canvas.height / 2 - 20, msgWidth, 30);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvas.width / 2 - msgWidth / 2, canvas.height / 2 - 20, msgWidth, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(interactMessage, canvas.width / 2, canvas.height / 2);
      }

      requestAnimationFrame(updateAndRender);
    };

    requestAnimationFrame(updateAndRender);
    return () => { running = false; };
  }, [character, interactMessage, triggerPlayerAction]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <Div className="relative w-full h-full min-h-[500px]" style={{ imageRendering: 'pixelated' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-background cursor-crosshair"
        tabIndex={0}
        onFocus={() => canvasRef.current?.focus()}
      />
      <Div className="minimap-hud hidden md:block">
        <Div className="rpg-hud-bar minimap-hud__panel">
          <Div className="minimap-hud__canvas-wrap">
            <canvas ref={minimapCanvasRef} className="minimap-hud__canvas" />
              <Div className="minimap-hud__zoom-buttons">
                <GameButton
                  size="sm"
                  variant="secondary"
                  className="minimap-hud__zoom-btn"
                  disabled={minimapZoom <= 1}
                  onClick={() => setMinimapZoomClamped(minimapZoomRef.current - 1)}
                  aria-label="Diminuir zoom do minimapa"
                >
                  -
                </GameButton>
                <GameButton
                  size="sm"
                  variant="secondary"
                  className="minimap-hud__zoom-btn"
                  disabled={minimapZoom >= 3}
                  onClick={() => setMinimapZoomClamped(minimapZoomRef.current + 1)}
                  aria-label="Aumentar zoom do minimapa"
                >
                  +
                </GameButton>
              </Div>
              {minimapFiltersOpen ? (
                <Div className="minimap-hud__overlay" onClick={() => setMinimapFiltersOpen(false)}>
                  <Div
                    className="rpg-item-detail minimimap-hud__modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Filtros do minimapa"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Div className="minimap-hud__modal-header">
                      <span className="minimap-hud__modal-title">Filtros</span>
                      <GameButton size="sm" variant="secondary" onClick={() => setMinimapFiltersOpen(false)} aria-label="Fechar filtros">
                        ×
                      </GameButton>
                    </Div>
                    <Div className="minimap-hud__modal-body">
                      <Div className="minimap-hud__checkbox-row">
                        <Checkbox
                          id="minimap-filter-creature"
                          checked={minimapFilters.showCreatures}
                          onCheckedChange={(v) => setMinimapFilter('showCreatures', v === true)}
                        />
                        <Label htmlFor="minimap-filter-creature">Monstro</Label>
                      </Div>
                      <Div className="minimap-hud__checkbox-row">
                        <Checkbox
                          id="minimap-filter-player"
                          checked={minimapFilters.showPlayer}
                          onCheckedChange={(v) => setMinimapFilter('showPlayer', v === true)}
                        />
                        <Label htmlFor="minimap-filter-player">Player</Label>
                      </Div>
                      <Div className="minimap-hud__checkbox-row">
                        <Checkbox
                          id="minimap-filter-npc"
                          checked={minimapFilters.showNpcs}
                          onCheckedChange={(v) => setMinimapFilter('showNpcs', v === true)}
                        />
                        <Label htmlFor="minimap-filter-npc">NPC</Label>
                      </Div>
                    </Div>
                    <Div className="minimap-hud__modal-footer">
                      <GameButton size="sm" variant="gold" onClick={() => setMinimapFiltersOpen(false)}>
                        Salvar
                      </GameButton>
                    </Div>
                  </Div>
                </Div>
              ) : null}
          </Div>
          <Div className="minimap-hud__side">
            <Div className="minimap-hud__controls">
              <Div className="minimap-hud__row">
                <span className="minimap-hud__label">α</span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={minimapAlpha}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMinimapAlpha(value);
                    minimapAlphaRef.current = value;
                  }}
                  className="minimap-hud__range"
                />
              </Div>
              <Div className="minimap-hud__row minimap-hud__row--meta">
                <span className="minimap-hud__label">Q</span>
                <span className="minimap-hud__value">{activeQuestCount}</span>
              </Div>
            </Div>
            <Div className="minimap-hud__buttons">
              <GameButton size="sm" variant={minimapFiltersOpen ? 'gold' : 'secondary'} onClick={() => setMinimapFiltersOpen(v => !v)}>
                Filtros
              </GameButton>
              {hudRightSlot}
            </Div>
          </Div>
        </Div>
      </Div>
      {/* Mobile controls */}
      <Div className="absolute bottom-12 left-4 md:hidden flex flex-col items-center gap-1 opacity-70">
        <button
          className="w-12 h-12 bg-foreground/20 rounded flex items-center justify-center text-xl"
          onTouchStart={() => keysRef.current.add('w')}
          onTouchEnd={() => keysRef.current.delete('w')}
        >↑</button>
        <Div className="flex gap-1">
          <button
            className="w-12 h-12 bg-foreground/20 rounded flex items-center justify-center text-xl"
            onTouchStart={() => keysRef.current.add('a')}
            onTouchEnd={() => keysRef.current.delete('a')}
          >←</button>
          <button
            className="w-12 h-12 bg-foreground/20 rounded flex items-center justify-center text-xl"
            onTouchStart={() => keysRef.current.add('s')}
            onTouchEnd={() => keysRef.current.delete('s')}
          >↓</button>
          <button
            className="w-12 h-12 bg-foreground/20 rounded flex items-center justify-center text-xl"
            onTouchStart={() => keysRef.current.add('d')}
            onTouchEnd={() => keysRef.current.delete('d')}
          >→</button>
        </Div>
      </Div>
      <Div className="absolute bottom-12 right-4 md:hidden flex gap-2 opacity-70">
        <button
          className="w-14 h-14 bg-primary/30 rounded-full flex items-center justify-center text-sm font-bold"
          onClick={handleInteract}
        >E</button>
      </Div>
    </Div>
  );
}

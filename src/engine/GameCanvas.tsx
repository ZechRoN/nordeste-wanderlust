import { useRef, useEffect, useState, useCallback } from 'react';
import { TILE_SIZE, Direction, WALK_SPEED, MAP_WIDTH, MAP_HEIGHT } from './constants';
import { generateTileMap, isWalkable, getBiomeAt, getBiomeSpawnPoint, getMapPOIs, TileMapData, MapPOI } from './TileMap';
import { renderMap, renderPlayer, renderPOI, renderMinimap, renderHUD, renderControls, renderCreature } from './Renderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export function GameCanvas({ character, onCharacterUpdate, onStartCombat, onOpenMenu, onOpenInventory }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
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

  // Initialize map and player position
  useEffect(() => {
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

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysRef.current.add(e.key.toLowerCase());
      
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
  }, [character]);

  const handleInteract = useCallback(() => {
    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;

    // Check POIs
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
        }
        return;
      }
    }

    // Check creatures
    for (const creature of creaturesRef.current) {
      const dist = Math.abs(creature.worldX - px) + Math.abs(creature.worldY - py);
      if (dist <= 2) {
        onStartCombat(creature);
        return;
      }
    }

    setInteractMessage('Nada para interagir aqui...');
    setTimeout(() => setInteractMessage(null), 1500);
  }, [onStartCombat]);

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

      // Clear
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

      // Render player
      renderPlayer(
        ctx,
        playerPosRef.current.x, playerPosRef.current.y,
        cameraRef.current.x, cameraRef.current.y,
        directionRef.current,
        character.class,
        animFrameRef.current,
        isMovingRef.current
      );

      // Player name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const nameX = playerPosRef.current.x * TILE_SIZE - cameraRef.current.x + TILE_SIZE / 2;
      const nameY = playerPosRef.current.y * TILE_SIZE - cameraRef.current.y - 4;
      ctx.fillText(character.name, nameX, nameY);

      // HUD
      renderHUD(ctx, canvas.width, character);
      renderMinimap(ctx, map, playerPosRef.current.x, playerPosRef.current.y, canvas.width, canvas.height, 170, {
        zoom: minimapZoomRef.current,
        alpha: minimapAlphaRef.current,
        explored: exploredRef.current ?? undefined,
        pois: poisRef.current,
        trackedPoiTypes: activeQuestCountRef.current > 0 ? ['quest'] : [],
      });
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
  }, [character, interactMessage]);

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
    <div className="relative w-full h-full min-h-[500px]" style={{ imageRendering: 'pixelated' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-background cursor-crosshair"
        tabIndex={0}
        onFocus={() => canvasRef.current?.focus()}
      />
      <div className="absolute top-2 right-2 z-20 hidden md:block">
        <div className="rpg-panel !p-2 !bg-[hsl(var(--rpg-panel-bg))]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] opacity-70">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={minimapZoom}
              onChange={(e) => {
                const value = Number(e.target.value);
                setMinimapZoom(value);
                minimapZoomRef.current = value;
              }}
              className="w-24"
            />
            <span className="text-[11px] opacity-70">α</span>
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
              className="w-24"
            />
            <span className="text-[11px] opacity-70">Q</span>
            <span className="text-[11px] font-bold">{activeQuestCount}</span>
          </div>
        </div>
      </div>
      {/* Mobile controls */}
      <div className="absolute bottom-12 left-4 md:hidden flex flex-col items-center gap-1 opacity-70">
        <button
          className="w-12 h-12 bg-foreground/20 rounded flex items-center justify-center text-xl"
          onTouchStart={() => keysRef.current.add('w')}
          onTouchEnd={() => keysRef.current.delete('w')}
        >↑</button>
        <div className="flex gap-1">
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
        </div>
      </div>
      <div className="absolute bottom-12 right-4 md:hidden flex gap-2 opacity-70">
        <button
          className="w-14 h-14 bg-primary/30 rounded-full flex items-center justify-center text-sm font-bold"
          onClick={handleInteract}
        >E</button>
      </div>
    </div>
  );
}

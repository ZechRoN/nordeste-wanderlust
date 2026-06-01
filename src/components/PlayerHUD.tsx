import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, TrendingUp, Droplets, Shield } from "lucide-react";
import { Div } from "@/components/ui/Div";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCharacterIdentity } from "@/hooks/useCharacterIdentity";

type PlayerHUDCharacter = {
  id?: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  gold: number;
};

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "0";
  return Math.floor(n).toLocaleString();
}

type StatBarKind = "hp" | "mp" | "xp";

function HUDStat(props: {
  ariaLabel: string;
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  tooltip: string;
  barKind: StatBarKind;
  valueMax: number;
  valueNow: number;
  pct: number;
  compact?: boolean;
}) {
  const { ariaLabel, label, icon, value, tooltip, barKind, valueMax, valueNow, pct, compact } = props;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Div className={`player-hud__stat${compact ? " player-hud__stat--compact" : ""}`} aria-label={ariaLabel}>
          <Div className="player-hud__stat-icon" aria-hidden="true">
            {icon}
          </Div>
          <Div className="player-hud__stat-body">
            <Div className="player-hud__stat-top">
              <span className="player-hud__stat-label">{label}</span>
              {value}
            </Div>
            <Div
              className={`player-hud__bar-track player-hud__bar-track--${barKind}`}
              role="progressbar"
              aria-label={`Progresso de ${ariaLabel.toLowerCase()}`}
              aria-valuemin={0}
              aria-valuemax={valueMax}
              aria-valuenow={valueNow}
            >
              <motion.div
                className={`player-hud__bar-fill player-hud__bar-fill--${barKind}`}
                initial={false}
                animate={{ width: `${Math.round(clampPct(pct) * 100)}%` }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
              />
            </Div>
          </Div>
        </Div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function PlayerHUD({ character, notificationSlot }: { character: PlayerHUDCharacter; notificationSlot?: React.ReactNode }) {
  const xpMax = useMemo(() => Math.max(1, character.level * 100), [character.level]);
  const hpPct = clampPct(character.max_health ? character.health / character.max_health : 0);
  const mpPct = clampPct(character.max_mana ? character.mana / character.max_mana : 0);
  const xpPct = clampPct(xpMax ? character.experience / xpMax : 0);

  const classBadge = useMemo(() => {
    const map: Record<string, { label: string; accent: string; glyph: string }> = {
      warrior: { label: "Guerreiro", accent: "warrior", glyph: "⚔️" },
      mage: { label: "Mago", accent: "mage", glyph: "🔮" },
      archer: { label: "Arqueiro", accent: "archer", glyph: "🏹" },
      healer: { label: "Curandeiro", accent: "healer", glyph: "💚" },
      assassin: { label: "Assassino", accent: "assassin", glyph: "🗡️" },
    };
    return map[character.class] ?? { label: character.class, accent: "primary", glyph: "👤" };
  }, [character.class]);

  return (
    <TooltipProvider>
      <Div className="player-hud" role="region" aria-label="Atributos do jogador">
        <Div className="rpg-hud-bar player-hud__panel">
          <Div className="player-hud__top">
            <Div className="player-hud__identity">
              <Div className={`player-hud__avatar player-hud__avatar--${classBadge.accent}`} aria-hidden="true">
                <span className="player-hud__avatar-glyph">{classBadge.glyph}</span>
              </Div>

              <Div className="player-hud__meta">
                <Div className="player-hud__name-row">
                  <Div className="player-hud__level-badge" aria-label={`Nível ${character.level}`}>
                    Lv {character.level}
                  </Div>
                  <Div className="player-hud__name">{character.name}</Div>
                </Div>
                <Div className="player-hud__sub">{classBadge.label}</Div>
              </Div>
            </Div>

            <Div className="player-hud__chips" aria-label="Recursos">
              {notificationSlot && <Div className="player-hud__chip">{notificationSlot}</Div>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Div className="player-hud__chip" aria-label="Gold">
                    <span aria-hidden="true">🪙</span>
                    <motion.span
                      key={`gold_${character.gold}`}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="player-hud__chip-value"
                    >
                      {formatNumber(character.gold)}
                    </motion.span>
                  </Div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Ouro</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Div className="player-hud__chip" aria-label="XP">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span className="player-hud__chip-value">{formatNumber(character.experience)}</span>
                  </Div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Experiência atual</TooltipContent>
              </Tooltip>
            </Div>
          </Div>

          <Div className="player-hud__stats">
          <HUDStat
            ariaLabel="Vida"
            label="HP"
            icon={<Heart className="h-4 w-4" />}
            tooltip="Pontos de vida (HP)"
            barKind="hp"
            valueMax={character.max_health}
            valueNow={character.health}
            pct={hpPct}
            value={
              <motion.span
                key={`${character.health}/${character.max_health}`}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="player-hud__stat-value"
              >
                {formatNumber(character.health)}/{formatNumber(character.max_health)}
              </motion.span>
            }
          />

          <HUDStat
            ariaLabel="Mana"
            label="MP"
            icon={<Droplets className="h-4 w-4" />}
            tooltip="Mana (MP)"
            barKind="mp"
            valueMax={character.max_mana}
            valueNow={character.mana}
            pct={mpPct}
            value={
              <motion.span
                key={`${character.mana}/${character.max_mana}`}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="player-hud__stat-value"
              >
                {formatNumber(character.mana)}/{formatNumber(character.max_mana)}
              </motion.span>
            }
          />

          <HUDStat
            ariaLabel="Experiência"
            label="EXP"
            icon={<TrendingUp className="h-4 w-4" />}
            tooltip="Experiência para o próximo nível"
            barKind="xp"
            valueMax={xpMax}
            valueNow={character.experience}
            pct={xpPct}
            compact
            value={
              <motion.span
                key={`${character.experience}/${xpMax}`}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="player-hud__stat-value"
              >
                {formatNumber(character.experience)}/{formatNumber(xpMax)}
              </motion.span>
            }
          />

          </Div>
        </Div>
      </Div>
    </TooltipProvider>
  );
}

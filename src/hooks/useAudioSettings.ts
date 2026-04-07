import { useCallback, useEffect, useMemo, useState } from "react";
import { applyAudioSettings } from "./useGameAudio";

type AudioSettings = {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
};

const STORAGE_KEY = "ziv_audio_settings_v1";

function clamp01(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function readSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      musicVolume: clamp01(parsed.musicVolume ?? 0.2),
      sfxVolume: clamp01(parsed.sfxVolume ?? 0.8),
      musicMuted: !!parsed.musicMuted,
      sfxMuted: !!parsed.sfxMuted,
    };
  } catch {
    return { musicVolume: 0.2, sfxVolume: 0.8, musicMuted: false, sfxMuted: false };
  }
}

function writeSettings(s: AudioSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => readSettings());

  useEffect(() => {
    applyAudioSettings(settings);
    writeSettings(settings);
  }, [settings]);

  const musicVolumePct = useMemo(() => Math.round(settings.musicVolume * 100), [settings.musicVolume]);
  const sfxVolumePct = useMemo(() => Math.round(settings.sfxVolume * 100), [settings.sfxVolume]);

  const setMusicVolumePct = useCallback((pct: number) => {
    setSettings((prev) => ({ ...prev, musicVolume: clamp01(pct / 100) }));
  }, []);

  const setSfxVolumePct = useCallback((pct: number) => {
    setSettings((prev) => ({ ...prev, sfxVolume: clamp01(pct / 100) }));
  }, []);

  const toggleMusicMute = useCallback(() => {
    setSettings((prev) => ({ ...prev, musicMuted: !prev.musicMuted }));
  }, []);

  const toggleSfxMute = useCallback(() => {
    setSettings((prev) => ({ ...prev, sfxMuted: !prev.sfxMuted }));
  }, []);

  return {
    settings,
    musicVolumePct,
    sfxVolumePct,
    setMusicVolumePct,
    setSfxVolumePct,
    toggleMusicMute,
    toggleSfxMute,
  };
}


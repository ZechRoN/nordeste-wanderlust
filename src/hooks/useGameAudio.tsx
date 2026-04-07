import { useRef, useEffect } from 'react';

// Procedural audio using Web Audio API — no external files needed
const audioCtxRef = { current: null as AudioContext | null };

function getCtx(): AudioContext {
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
  if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  return audioCtxRef.current;
}

type AudioSettings = {
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
};

const audioSettingsRef = { current: { musicVolume: 0.2, sfxVolume: 0.8, musicMuted: false, sfxMuted: false } as AudioSettings };

export function applyAudioSettings(next: Partial<AudioSettings>) {
  audioSettingsRef.current = { ...audioSettingsRef.current, ...next };
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.12) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain).connect(ctx.destination);
  source.start();
}

function playSfxTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.12) {
  const s = audioSettingsRef.current;
  if (s.sfxMuted || s.sfxVolume <= 0) return;
  playTone(freq, duration, type, volume * s.sfxVolume);
}

function playSfxNoise(duration: number, volume = 0.08) {
  const s = audioSettingsRef.current;
  if (s.sfxMuted || s.sfxVolume <= 0) return;
  playNoise(duration, volume * s.sfxVolume);
}

function playMusicTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.02) {
  const s = audioSettingsRef.current;
  if (s.musicMuted || s.musicVolume <= 0) return;
  playTone(freq, duration, type, volume * s.musicVolume);
}

// Sound effect library
export const SFX = {
  menuClick: () => playSfxTone(800, 0.08, 'square', 0.06),
  menuHover: () => playSfxTone(600, 0.05, 'sine', 0.03),
  attack: () => {
    playSfxNoise(0.15, 0.1);
    playSfxTone(200, 0.12, 'sawtooth', 0.08);
  },
  hit: () => {
    playSfxNoise(0.1, 0.12);
    playSfxTone(150, 0.15, 'square', 0.06);
  },
  critical: () => {
    playSfxTone(400, 0.08, 'square', 0.1);
    setTimeout(() => playSfxTone(600, 0.1, 'square', 0.1), 80);
    setTimeout(() => playSfxTone(800, 0.15, 'sawtooth', 0.08), 160);
  },
  miss: () => playSfxTone(200, 0.2, 'sine', 0.04),
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playSfxTone(f, 0.3, 'square', 0.08), i * 120)
    );
  },
  defeat: () => {
    [400, 350, 300, 200].forEach((f, i) =>
      setTimeout(() => playSfxTone(f, 0.4, 'sawtooth', 0.06), i * 200)
    );
  },
  levelUp: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => playSfxTone(f, 0.25, 'square', 0.07), i * 100)
    );
  },
  itemPickup: () => {
    playSfxTone(1200, 0.06, 'square', 0.05);
    setTimeout(() => playSfxTone(1600, 0.08, 'square', 0.05), 60);
  },
  gold: () => {
    playSfxTone(1400, 0.05, 'sine', 0.06);
    setTimeout(() => playSfxTone(1800, 0.08, 'sine', 0.06), 50);
  },
  error: () => playSfxTone(150, 0.3, 'sawtooth', 0.06),
  heal: () => {
    [400, 500, 600, 800].forEach((f, i) =>
      setTimeout(() => playSfxTone(f, 0.15, 'sine', 0.05), i * 80)
    );
  },
  openPanel: () => {
    playSfxTone(300, 0.05, 'square', 0.04);
    setTimeout(() => playSfxTone(500, 0.08, 'square', 0.04), 40);
  },
  closePanel: () => {
    playSfxTone(500, 0.05, 'square', 0.04);
    setTimeout(() => playSfxTone(300, 0.08, 'square', 0.04), 40);
  },
  chatMessage: () => playSfxTone(1000, 0.06, 'sine', 0.04),
};

// Biome ambient music
const BIOME_MUSIC: Record<string, { notes: number[]; tempo: number; type: OscillatorType }> = {
  caatinga: { notes: [262, 294, 330, 294, 262, 220, 262, 294], tempo: 600, type: 'sine' },
  agreste: { notes: [330, 370, 415, 370, 330, 294, 262, 294], tempo: 500, type: 'triangle' },
  litoral: { notes: [392, 440, 494, 523, 494, 440, 392, 349], tempo: 700, type: 'sine' },
  santa_cruz: { notes: [262, 311, 370, 311, 262, 233, 262, 311], tempo: 550, type: 'triangle' },
};

export function useBackgroundMusic(biome: string, enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIdxRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const music = BIOME_MUSIC[biome] || BIOME_MUSIC.caatinga;
    noteIdxRef.current = 0;

    intervalRef.current = setInterval(() => {
      const note = music.notes[noteIdxRef.current % music.notes.length];
      playMusicTone(note, 0.4, music.type, 0.02);
      noteIdxRef.current++;
    }, music.tempo);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [biome, enabled]);
}

export function useGameAudio() {
  return SFX;
}

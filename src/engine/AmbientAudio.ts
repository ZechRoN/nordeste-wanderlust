// Ambient audio system: crickets at night, birds during day
// Uses Web Audio API procedural generation

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

interface AmbientLoop {
  active: boolean;
  timeout: ReturnType<typeof setTimeout> | null;
}

const ambientState: {
  dayFactor: number;
  running: boolean;
  crickets: AmbientLoop;
  birds: AmbientLoop;
  wind: AmbientLoop;
  volume: number;
  muted: boolean;
} = {
  dayFactor: 1,
  running: false,
  crickets: { active: false, timeout: null },
  birds: { active: false, timeout: null },
  wind: { active: false, timeout: null },
  volume: 0.3,
  muted: false,
};

export function setAmbientVolume(vol: number, muted: boolean) {
  ambientState.volume = vol;
  ambientState.muted = muted;
}

function playCricketChirp() {
  if (ambientState.muted || ambientState.volume <= 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const vol = ambientState.volume * 0.04 * (1 - ambientState.dayFactor);
  if (vol < 0.001) return;

  // Two rapid oscillator bursts = cricket chirp
  for (let burst = 0; burst < 2 + Math.floor(Math.random() * 3); burst++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const freq = 4000 + Math.random() * 2000;
    osc.frequency.setValueAtTime(freq, now);
    const t = now + burst * 0.06;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + 0.04);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }
}

function playBirdChirp() {
  if (ambientState.muted || ambientState.volume <= 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const vol = ambientState.volume * 0.03 * ambientState.dayFactor;
  if (vol < 0.001) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const baseFreq = 1800 + Math.random() * 1500;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.linearRampToValueAtTime(baseFreq + 400 + Math.random() * 600, now + 0.08);
  osc.frequency.linearRampToValueAtTime(baseFreq - 200, now + 0.18);
  osc.frequency.linearRampToValueAtTime(baseFreq + 200, now + 0.25);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.02);
  gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.15);
  gain.gain.linearRampToValueAtTime(0, now + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);

  // Second note for variety
  if (Math.random() < 0.5) {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    const f2 = baseFreq + 300 + Math.random() * 400;
    osc2.frequency.setValueAtTime(f2, now + 0.3);
    osc2.frequency.linearRampToValueAtTime(f2 - 500, now + 0.5);
    gain2.gain.setValueAtTime(0, now + 0.3);
    gain2.gain.linearRampToValueAtTime(vol * 0.6, now + 0.33);
    gain2.gain.linearRampToValueAtTime(0, now + 0.55);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.3);
    osc2.stop(now + 0.6);
  }
}

function playWindGust() {
  if (ambientState.muted || ambientState.volume <= 0) return;
  const ctx = getCtx();
  const now = ctx.currentTime;
  const vol = ambientState.volume * 0.02;
  if (vol < 0.001) return;

  const bufferSize = Math.floor(ctx.sampleRate * 0.8);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Filtered noise for wind
  let prev = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    prev = prev * 0.95 + white * 0.05; // low-pass
    data[i] = prev;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.3);
  gain.gain.linearRampToValueAtTime(0, now + 0.8);
  source.connect(gain).connect(ctx.destination);
  source.start(now);
}

function cricketLoop() {
  if (!ambientState.running) return;
  const nightFactor = 1 - ambientState.dayFactor;
  if (nightFactor > 0.3) {
    playCricketChirp();
  }
  const interval = 800 + Math.random() * 2500;
  ambientState.crickets.timeout = setTimeout(cricketLoop, interval);
}

function birdLoop() {
  if (!ambientState.running) return;
  if (ambientState.dayFactor > 0.4) {
    playBirdChirp();
  }
  const interval = 2000 + Math.random() * 5000;
  ambientState.birds.timeout = setTimeout(birdLoop, interval);
}

function windLoop() {
  if (!ambientState.running) return;
  playWindGust();
  const interval = 5000 + Math.random() * 10000;
  ambientState.wind.timeout = setTimeout(windLoop, interval);
}

export function updateAmbientDayFactor(dayFactor: number) {
  ambientState.dayFactor = dayFactor;
}

export function startAmbientAudio() {
  if (ambientState.running) return;
  ambientState.running = true;
  cricketLoop();
  birdLoop();
  windLoop();
}

export function stopAmbientAudio() {
  ambientState.running = false;
  if (ambientState.crickets.timeout) clearTimeout(ambientState.crickets.timeout);
  if (ambientState.birds.timeout) clearTimeout(ambientState.birds.timeout);
  if (ambientState.wind.timeout) clearTimeout(ambientState.wind.timeout);
}

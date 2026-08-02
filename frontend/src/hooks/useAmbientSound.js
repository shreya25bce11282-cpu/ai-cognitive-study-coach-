import { useRef, useState, useCallback, useEffect } from 'react';

export const PRESETS = [
  { id: 'lofi', label: 'Lo-fi', icon: '🎧' },
  { id: 'rain', label: 'Rain', icon: '🌧️' },
  { id: 'forest', label: 'Forest', icon: '🌲' },
  { id: 'white', label: 'White Noise', icon: '🌫️' },
  { id: 'library', label: 'Library', icon: '📚' },
];

function makeNoiseBuffer(ctx, seconds = 4) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // brownian-ish smoothing for a softer noise floor
    b0 = 0.99 * b0 + white * 0.01;
    b1 = 0.98 * b1 + white * 0.05;
    b2 = 0.95 * b2 + white * 0.1;
    data[i] = (b0 + b1 + b2) * 1.2;
  }
  return buffer;
}

export default function useAmbientSound() {
  const ctxRef = useRef(null);
  const nodesRef = useRef({});
  const schedulersRef = useRef([]);
  const [active, setActive] = useState(null);
  const [volume, setVolume] = useState(0.4);
  const [muted, setMuted] = useState(false);

  const teardown = useCallback(() => {
    schedulersRef.current.forEach((id) => clearInterval(id));
    schedulersRef.current = [];
    const nodes = nodesRef.current;
    Object.values(nodes).forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (_e) {
        /* already stopped */
      }
    });
    nodesRef.current = {};
  }, []);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const scheduleBlip = useCallback((ctx, master, { freqMin, freqMax, gain, every, jitter, type = 'sine', dur = 0.15 }) => {
    const id = setInterval(() => {
      if (Math.random() > 0.4) return; // sparse, natural randomness
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freqMin + Math.random() * (freqMax - freqMin);
      g.gain.value = 0;
      osc.connect(g).connect(master);
      const now = ctx.currentTime;
      g.gain.linearRampToValueAtTime(gain, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    }, every + Math.random() * jitter);
    schedulersRef.current.push(id);
  }, []);

  const play = useCallback(
    (presetId) => {
      teardown();
      const ctx = ensureCtx();
      const master = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(ctx.destination);
      nodesRef.current.master = master;

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = makeNoiseBuffer(ctx);
      noiseSrc.loop = true;

      const filter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();

      switch (presetId) {
        case 'rain': {
          filter.type = 'bandpass';
          filter.frequency.value = 2200;
          filter.Q.value = 0.6;
          noiseGain.gain.value = 0.9;
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 0.15;
          lfoGain.gain.value = 300;
          lfo.connect(lfoGain).connect(filter.frequency);
          lfo.start();
          nodesRef.current.lfo = lfo;
          break;
        }
        case 'forest': {
          filter.type = 'lowpass';
          filter.frequency.value = 800;
          noiseGain.gain.value = 0.5;
          scheduleBlip(ctx, master, { freqMin: 1800, freqMax: 3200, gain: 0.05, every: 3000, jitter: 4000, type: 'sine', dur: 0.2 });
          break;
        }
        case 'library': {
          filter.type = 'lowpass';
          filter.frequency.value = 400;
          noiseGain.gain.value = 0.25;
          scheduleBlip(ctx, master, { freqMin: 200, freqMax: 400, gain: 0.03, every: 8000, jitter: 6000, type: 'triangle', dur: 0.3 });
          break;
        }
        case 'lofi': {
          filter.type = 'lowpass';
          filter.frequency.value = 1200;
          noiseGain.gain.value = 0.15; // vinyl-crackle bed
          const chordFreqs = [174.6, 220, 261.6, 329.6]; // Fm7-ish pad
          chordFreqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            osc.detune.value = (i - 1.5) * 4;
            g.gain.value = 0.06;
            osc.connect(g).connect(master);
            osc.start();
            nodesRef.current[`pad${i}`] = osc;
          });
          scheduleBlip(ctx, master, { freqMin: 3000, freqMax: 6000, gain: 0.02, every: 1200, jitter: 1500, type: 'square', dur: 0.02 });
          break;
        }
        case 'white':
        default: {
          filter.type = 'allpass';
          filter.frequency.value = 1000;
          noiseGain.gain.value = 0.5;
          break;
        }
      }

      noiseSrc.connect(filter).connect(noiseGain).connect(master);
      noiseSrc.start();
      nodesRef.current.noiseSrc = noiseSrc;
      nodesRef.current.filter = filter;

      setActive(presetId);
    },
    [ensureCtx, teardown, volume, muted, scheduleBlip]
  );

  const stop = useCallback(() => {
    teardown();
    setActive(null);
  }, [teardown]);

  const setVolumeLive = useCallback((v) => {
    setVolume(v);
    if (nodesRef.current.master) {
      nodesRef.current.master.gain.linearRampToValueAtTime(
        muted ? 0 : v,
        (ctxRef.current?.currentTime || 0) + 0.1
      );
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (nodesRef.current.master) {
        nodesRef.current.master.gain.linearRampToValueAtTime(
          next ? 0 : volume,
          (ctxRef.current?.currentTime || 0) + 0.1
        );
      }
      return next;
    });
  }, [volume]);

  useEffect(() => () => teardown(), [teardown]);

  return { active, volume, muted, play, stop, setVolume: setVolumeLive, toggleMute, presets: PRESETS };
}
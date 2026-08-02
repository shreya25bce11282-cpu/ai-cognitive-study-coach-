import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

export const DEFAULT_POMODORO = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, cyclesBeforeLong: 4 };

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.0001;
      osc.connect(g).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.18;
      g.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.45);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (_e) {
    /* audio unavailable, ignore */
  }
}

export default function useActiveSession() {
  const [phase, setPhase] = useState('idle'); // idle | active | rating | done
  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState(0); // seconds, total active study time
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  // Pomodoro state
  const [mode, setMode] = useState('classic'); // classic | pomodoro
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // work | shortBreak | longBreak
  const [pomodoroRemaining, setPomodoroRemaining] = useState(DEFAULT_POMODORO.work);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const pomodoroConfigRef = useRef(DEFAULT_POMODORO);

  // Notes & tags
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState([]);

  // Tick the elapsed timer every second while active (classic mode counts up)
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
        if (mode === 'pomodoro') {
          setPomodoroRemaining((r) => {
            if (r <= 1) {
              handlePomodoroTransition();
              return 0;
            }
            return r - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  const handlePomodoroTransition = useCallback(() => {
    playChime();
    setPomodoroPhase((prevPhase) => {
      const cfg = pomodoroConfigRef.current;
      if (prevPhase === 'work') {
        setCompletedPomodoros((c) => {
          const next = c + 1;
          const isLong = next % cfg.cyclesBeforeLong === 0;
          setPomodoroRemaining(isLong ? cfg.longBreak : cfg.shortBreak);
          return next;
        });
        return 'break'; // resolved below via completedPomodoros effect
      }
      setPomodoroRemaining(cfg.work);
      return 'work';
    });
  }, []);

  // Resolve 'break' -> shortBreak/longBreak label once completedPomodoros updates
  useEffect(() => {
    if (pomodoroPhase === 'break') {
      const cfg = pomodoroConfigRef.current;
      setPomodoroPhase(completedPomodoros % cfg.cyclesBeforeLong === 0 ? 'longBreak' : 'shortBreak');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedPomodoros]);

  const start = useCallback(async (subject, sessionMode = 'classic', pomodoroConfig = DEFAULT_POMODORO) => {
    setError(null);
    try {
      const sess = await api.startSession(subject, sessionMode);
      setSession(sess);
      setElapsed(0);
      setNotes('');
      setTags([]);
      setMode(sessionMode);
      pomodoroConfigRef.current = pomodoroConfig;
      setPomodoroPhase('work');
      setPomodoroRemaining(pomodoroConfig.work);
      setCompletedPomodoros(0);
      setPhase('active');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  const stop = useCallback(() => {
    setPhase('rating');
  }, []);

  const submitRating = useCallback(
    async (focus_rating, fatigue_rating) => {
      setError(null);
      try {
        const res = await api.endSession(session.id, focus_rating, fatigue_rating, {
          notes: notes || null,
          tags: tags.length ? tags : null,
          pomodoro_count: mode === 'pomodoro' ? completedPomodoros : null,
        });
        setResult(res);
        setPhase('done');
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    },
    [session, notes, tags, mode, completedPomodoros]
  );

  const reset = useCallback(() => {
    setPhase('idle');
    setSession(null);
    setElapsed(0);
    setResult(null);
    setError(null);
    setNotes('');
    setTags([]);
    setMode('classic');
    setPomodoroPhase('work');
    setCompletedPomodoros(0);
  }, []);

  const addTag = useCallback((tag) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    setTags((t) => (t.includes(clean) ? t : [...t, clean]));
  }, []);

  const removeTag = useCallback((tag) => {
    setTags((t) => t.filter((x) => x !== tag));
  }, []);

  return {
    phase,
    session,
    elapsed,
    result,
    error,
    start,
    stop,
    submitRating,
    reset,
    // pomodoro
    mode,
    pomodoroPhase,
    pomodoroRemaining,
    completedPomodoros,
    pomodoroConfig: pomodoroConfigRef.current,
    // notes/tags
    notes,
    setNotes,
    tags,
    addTag,
    removeTag,
  };
}
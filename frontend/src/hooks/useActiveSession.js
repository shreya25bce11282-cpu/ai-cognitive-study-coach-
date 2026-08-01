import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

export default function useActiveSession() {
  const [phase, setPhase] = useState('idle'); // idle | active | rating | done
  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  // Tick the elapsed timer every second while active
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const start = useCallback(async (subject) => {
    setError(null);
    try {
      const sess = await api.startSession(subject);
      setSession(sess);
      setElapsed(0);
      setPhase('active');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  const stop = useCallback(() => {
    setPhase('rating');
  }, []);

  const submitRating = useCallback(async (focus_rating, fatigue_rating) => {
    setError(null);
    try {
      const res = await api.endSession(session.id, focus_rating, fatigue_rating);
      setResult(res);
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, [session]);

  const reset = useCallback(() => {
    setPhase('idle');
    setSession(null);
    setElapsed(0);
    setResult(null);
    setError(null);
  }, []);

  return { phase, session, elapsed, result, error, start, stop, submitRating, reset };
}

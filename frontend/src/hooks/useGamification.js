import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export default function useGamification() {
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, achievementsRes] = await Promise.all([
        api.getGamificationStats(),
        api.getAchievements(),
      ]);
      setStats(statsRes);
      setAchievements(achievementsRes);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, achievements, loading, error, refresh };
}
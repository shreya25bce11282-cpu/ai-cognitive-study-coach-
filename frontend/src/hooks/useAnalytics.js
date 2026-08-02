import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export default function useAnalytics() {
  const [data, setData] = useState({
    summary: null,
    fatigue: null,
    burnout: null,
    breakRec: null,
    bestTime: null,
    subjectPerf: null,
    studyPlan: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, fatigue, burnout, breakRec, bestTime, subjectPerf, studyPlan] =
        await Promise.all([
          api.getAnalyticsSummary(),
          api.getFatigue(),
          api.getBurnoutRisk(),
          api.getBreakRecommendation(),
          api.getBestTime(),
          api.getSubjectPerformance(),
          api.getStudyPlan(),
        ]);
      setData({ summary, fatigue, burnout, breakRec, bestTime, subjectPerf, studyPlan });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...data, loading, error, refresh };
}
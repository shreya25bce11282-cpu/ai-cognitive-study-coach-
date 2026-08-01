import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Sessions ───────────────────────────────────────────────
export const getSessions = () => api.get('/sessions').then((r) => r.data);

export const startSession = (subject) =>
  api.post('/sessions/start', { subject }).then((r) => r.data);

export const endSession = (session_id, focus_rating, fatigue_rating) =>
  api.post('/sessions/end', { session_id, focus_rating, fatigue_rating }).then((r) => r.data);

// ─── Analytics ──────────────────────────────────────────────
export const getAnalyticsSummary = () => api.get('/analytics/summary').then((r) => r.data);
export const getFatigue = () => api.get('/analytics/fatigue').then((r) => r.data);
export const getBurnoutRisk = () => api.get('/analytics/burnout-risk').then((r) => r.data);
export const getBreakRecommendation = () => api.get('/analytics/break-recommendation').then((r) => r.data);
export const getBestTime = () => api.get('/analytics/best-time').then((r) => r.data);
export const predictSession = (subject) =>
  api.get(`/analytics/predict-session?subject=${encodeURIComponent(subject)}`).then((r) => r.data);
export const getOptimalSession = (subject) =>
  api.get(`/analytics/optimal-session?subject=${encodeURIComponent(subject)}`).then((r) => r.data);
export const getSubjectPerformance = () => api.get('/analytics/subject-performance').then((r) => r.data);
export const getStudyPlan = () => api.get('/analytics/recommend-study-plan').then((r) => r.data);

export default api;
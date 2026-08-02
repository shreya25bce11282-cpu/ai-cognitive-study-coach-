import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Sessions ───────────────────────────────────────────────
export const getSessions = () => api.get('/sessions').then((r) => r.data);

export const startSession = (subject, mode = 'classic') =>
  api.post('/sessions/start', { subject, mode }).then((r) => r.data);

export const endSession = (session_id, focus_rating, fatigue_rating, extra = {}) =>
  api
    .post('/sessions/end', { session_id, focus_rating, fatigue_rating, ...extra })
    .then((r) => r.data);

// ─── Analytics ──────────────────────────────────────────────
export const getAnalyticsSummary = () => api.get('/analytics/summary').then((r) => r.data);
export const getFatigue = () => api.get('/analytics/fatigue').then((r) => r.data);
export const getBurnoutRisk = () => api.get('/analytics/burnout-risk').then((r) => r.data);
export const getBreakRecommendation = () => api.get('/analytics/break-recommendation').then((r) => r.data);
export const getBestTime = () => api.get('/analytics/best-time').then((r) => r.data);
export const predictSession = (subject) => api.get(`/analytics/predict-session?subject=${encodeURIComponent(subject)}`).then((r) => r.data);
export const getOptimalSession = (subject) => api.get(`/analytics/optimal-session?subject=${encodeURIComponent(subject)}`).then((r) => r.data);
export const getSubjectPerformance = () => api.get('/analytics/subject-performance').then((r) => r.data);
export const getStudyPlan = () => api.get('/analytics/recommend-study-plan').then((r) => r.data);
export const getWeeklyTrends = () => api.get('/analytics/weekly-trends').then((r) => r.data);
export const getHeatmapData = () => api.get('/analytics/heatmap').then((r) => r.data);
export const getFocusDecayCurve = () => api.get('/analytics/focus-decay').then((r) => r.data);

// ─── AI ─────────────────────────────────────────────────────
export const getAiInsights = () => api.get('/ai/insights').then((r) => r.data);
export const getAiStudyPlan = () => api.get('/ai/study-plan').then((r) => r.data);
export const aiChat = (message, history) => api.post('/ai/chat', { message, history }).then((r) => r.data);

// ─── Gamification ───────────────────────────────────────────
export const getGamificationStats = () => api.get('/gamification/stats').then((r) => r.data);
export const getAchievements = () => api.get('/gamification/achievements').then((r) => r.data);
export const getStreak = () => api.get('/gamification/streak').then((r) => r.data);

// ─── Goals ──────────────────────────────────────────────────
export const getGoals = () => api.get('/goals').then((r) => r.data);
export const getGoalsProgress = () => api.get('/goals/progress').then((r) => r.data);
export const createGoal = (subject, weekly_hours_target) =>
  api.post('/goals', { subject, weekly_hours_target }).then((r) => r.data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`).then((r) => r.data);

export default api;
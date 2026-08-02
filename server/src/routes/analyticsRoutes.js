const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/analyticsController');

const router = Router();

const subjectQuerySchema = z.object({
  subject: z.string().min(1).max(100).trim(),
});

router.get('/summary', ctrl.getSummary);
router.get('/fatigue', ctrl.getFatigue);
router.get('/burnout-risk', ctrl.getBurnoutRisk);
router.get('/break-recommendation', ctrl.getBreakRecommendation);
router.get('/best-time', ctrl.getBestTime);
router.get('/predict-session', validate(subjectQuerySchema, 'query'), ctrl.predictSession);
router.get('/optimal-session', validate(subjectQuerySchema, 'query'), ctrl.optimalSession);
router.get('/subject-performance', ctrl.subjectPerformance);
router.get('/recommend-study-plan', ctrl.recommendStudyPlan);
router.get('/weekly-trends', ctrl.getWeeklyTrends);
router.get('/heatmap', ctrl.getHeatmapData);
router.get('/focus-decay', ctrl.getFocusDecayCurve);

module.exports = router;
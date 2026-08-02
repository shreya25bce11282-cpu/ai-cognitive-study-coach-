const db = require('../db/db');

let genAI = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    // Lazy-require so the app still boots without the package installed/key set
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

function isAiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function buildContext() {
  const { rows: recent } = await db.query(`
    SELECT subject, duration_min, focus_rating, fatigue_rating, started_at, notes, tags
    FROM study_sessions
    WHERE ended_at IS NOT NULL
    ORDER BY started_at DESC
    LIMIT 30
  `);

  const { rows: statsRows } = await db.query('SELECT * FROM user_stats WHERE id = 1');
  const { rows: subjectRows } = await db.query(`
    SELECT subject, ROUND(AVG(focus_rating), 1) AS avg_focus,
           ROUND(AVG(fatigue_rating), 1) AS avg_fatigue,
           ROUND(AVG(duration_min), 1) AS avg_duration_min,
           COUNT(*)::int AS sessions
    FROM study_sessions
    WHERE ended_at IS NOT NULL
    GROUP BY subject
    ORDER BY sessions DESC
  `);

  return {
    recentSessions: recent,
    stats: statsRows[0] || null,
    subjectPerformance: subjectRows,
  };
}

function systemPrompt(context) {
  return `You are an encouraging, data-driven study coach embedded in a study-tracking app.
You are given the user's real session history, streak/XP stats, and per-subject performance as JSON.
Give specific, concise, actionable advice grounded ONLY in the data provided — cite actual numbers
(e.g. "your focus drops after 45 min in Math") rather than generic platitudes. Keep responses under
150 words unless asked for a full study plan. Use a warm, motivating tone.

USER DATA:
${JSON.stringify(context, null, 2)}`;
}

// GET /api/ai/insights — proactive AI study insight for the dashboard
async function getInsights(req, res, next) {
  try {
    if (!isAiEnabled()) {
      return res.json({
        enabled: false,
        message: 'AI features are disabled. Add GEMINI_API_KEY to your .env to enable AI insights.',
      });
    }

    const context = await buildContext();
    if (context.recentSessions.length === 0) {
      return res.json({
        enabled: true,
        insight:
          'Log your first study session and I\'ll start spotting patterns in your focus, fatigue, and timing!',
      });
    }

    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      systemPrompt(context),
      'Give me one short, specific insight about my recent study patterns and one concrete tip.',
    ]);

    res.json({ enabled: true, insight: result.response.text() });
  } catch (err) {
    if (err.message && /API key/i.test(err.message)) {
      return res.json({ enabled: false, message: 'Invalid Gemini API key.' });
    }
    next(err);
  }
}

// POST /api/ai/chat — conversational endpoint, { message, history? }
async function chat(req, res, next) {
  try {
    if (!isAiEnabled()) {
      return res.status(200).json({
        enabled: false,
        reply: 'AI chat is disabled. Add GEMINI_API_KEY to your .env to enable the AI Coach.',
      });
    }

    const { message, history } = req.body;
    const context = await buildContext();
    const client = getClient();
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt(context),
    });

    const chatSession = model.startChat({
      history: Array.isArray(history)
        ? history.slice(-10).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content || '').slice(0, 2000) }],
          }))
        : [],
    });

    const result = await chatSession.sendMessage(message);
    res.json({ enabled: true, reply: result.response.text() });
  } catch (err) {
    if (err.message && /API key/i.test(err.message)) {
      return res.json({ enabled: false, reply: 'Invalid Gemini API key.' });
    }
    next(err);
  }
}

// GET /api/ai/study-plan — AI-generated weekly plan from historical patterns
async function studyPlan(req, res, next) {
  try {
    if (!isAiEnabled()) {
      return res.json({
        enabled: false,
        message: 'AI features are disabled. Add GEMINI_API_KEY to your .env to enable plan generation.',
      });
    }

    const context = await buildContext();
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent([
      systemPrompt(context),
      `Generate a realistic weekly study plan (Mon–Sun) based on this user's historical performance.
       For each day, suggest 1-2 subjects, a duration in minutes, and a best time of day, grounded in
       the data. Respond ONLY with JSON in this exact shape, no markdown fences, no prose:
       {"days":[{"day":"Monday","blocks":[{"subject":"...","duration_min":45,"time_of_day":"Morning","reason":"..."}]}]}`,
    ]);

    let text = result.response.text().trim();
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const plan = JSON.parse(text);
    res.json({ enabled: true, plan });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ enabled: true, error: 'AI returned an unparsable plan. Try again.' });
    }
    next(err);
  }
}

module.exports = { getInsights, chat, studyPlan, isAiEnabled };
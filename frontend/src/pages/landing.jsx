import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';

const FEATURES = [
  { icon: '🤖', title: 'AI Study Coach', desc: 'Get personalized insights from your real session data.' },
  { icon: '🍅', title: 'Pomodoro Timer', desc: 'Configurable focus/break cycles with auto-transitions.' },
  { icon: '🔥', title: 'Streaks & XP', desc: 'Build daily habits with levels and achievements.' },
  { icon: '📈', title: 'Deep Analytics', desc: 'Focus trends, burnout risk, and heatmaps.' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function Landing({ onStart }) {
  return (
    <div style={{ maxWidth: '780px', margin: '40px auto', textAlign: 'center', position: 'relative' }}>
      {/* Floating decorative orbs framing the hero */}
      <div
        aria-hidden="true"
        className="float-anim"
        style={{
          position: 'absolute', top: '-40px', left: '-60px', width: '140px', height: '140px',
          borderRadius: '50%', background: 'var(--gradient-emerald)', filter: 'blur(50px)',
          opacity: 0.35, pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        className="float-anim"
        style={{
          position: 'absolute', top: '20px', right: '-50px', width: '110px', height: '110px',
          borderRadius: '50%', background: 'var(--gradient-coral)', filter: 'blur(50px)',
          opacity: 0.3, pointerEvents: 'none', animationDelay: '1.2s',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '3.5rem', marginBottom: '16px' }}
      >
        🧬
      </motion.div>

      <motion.h1
        className="page-title"
        style={{ fontSize: '2.6rem', marginBottom: '12px' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        Study Smarter, Not Harder
      </motion.h1>

      <motion.p
        style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px', lineHeight: 1.6 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        Track your focus, beat burnout, and let AI turn your study data into a plan that actually works.
      </motion.p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {FEATURES.map((f) => (
          <motion.div key={f.title} variants={item}>
            <GlassCard style={{ padding: '20px', textAlign: 'left', height: '100%' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        className="btn-primary"
        style={{ fontSize: '1.15rem', padding: '18px 48px' }}
        onClick={onStart}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        🚀 Get Started
      </motion.button>
    </div>
  );
}
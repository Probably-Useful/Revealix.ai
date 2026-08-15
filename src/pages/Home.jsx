import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiZap, FiShield, FiBarChart2, FiMic, FiChevronDown } from 'react-icons/fi';
import { MdFaceRetouchingNatural } from 'react-icons/md';

/* ── Scroll reveal ── */
const Reveal = ({ children, delay = 0, y = 30 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const controls = useAnimation();
  useEffect(() => { if (inView) controls.start('visible'); }, [inView, controls]);
  return (
    <motion.div ref={ref} initial="hidden" animate={controls}
      variants={{ hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] } } }}>
      {children}
    </motion.div>
  );
};

/* ── Stats bar ── */
const STATS = [
  { value: '7', label: 'Emotions Detected' },
  { value: '<200ms', label: 'Detection Latency' },
  { value: '95%+', label: 'Accuracy Rate' },
  { value: 'Real-time', label: 'Multi-face Tracking' },
];

/* ── Feature cards ── */
const FEATURES = [
  {
    icon: FiZap, title: 'Real-Time Detection',
    desc: 'Sub-200ms facial emotion analysis directly from your webcam, with bounding boxes and live emotion labels.',
    tag: 'Live',
  },
  {
    icon: FiBarChart2, title: 'Session Analytics',
    desc: 'Every session is logged to Supabase. Visualise emotion trends, per-person breakdowns and session timelines.',
    tag: 'Dashboard',
  },
  {
    icon: FiMic, title: 'Text & Voice Analysis',
    desc: 'VADER-powered NLP sentiment scoring from typed input or live speech. Word-by-word breakdown with polarity.',
    tag: 'NLP',
  },
  {
    icon: MdFaceRetouchingNatural, title: 'Multi-Person Tracking',
    desc: 'Simultaneously identifies and tracks multiple faces in frame — each assigned their own emotion timeline.',
    tag: 'CV',
  },
  {
    icon: FiShield, title: 'Privacy First',
    desc: 'Raw video frames are never stored or transmitted. Only emotion metadata is persisted to your database.',
    tag: 'Secure',
  },
  {
    icon: FiBarChart2, title: 'Editable Person Labels',
    desc: 'Rename auto-detected persons to real names directly from the dashboard. Your data, your labels.',
    tag: 'New',
  },
];

/* ── Use-case cards ── */
const USE_CASES = [
  { emoji: '🚚', title: 'Fleet Safety', desc: 'Monitor driver emotional state for fatigue, distress, and aggression detection in real time.' },
  { emoji: '🎓', title: 'Education', desc: 'Track student engagement and frustration levels during online classes to improve delivery.' },
  { emoji: '🏪', title: 'Retail UX', desc: 'Capture genuine emotional reactions to products, layouts, or advertisements.' },
  { emoji: '🧠', title: 'Mental Health', desc: 'Support therapists with session-level emotional logs for longitudinal mood tracking.' },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ════ HERO ════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '9rem 1.5rem 5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
        }} />

        {/* Crimson glow */}
        <div style={{
          position: 'absolute', top: '15%', left: '50%',
          transform: 'translateX(-50%)',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(199,54,89,0.1) 0%, transparent 65%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ position: 'relative', zIndex: 1, marginBottom: '2.25rem' }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            background: 'rgba(199,54,89,0.08)',
            border: '1px solid rgba(199,54,89,0.2)',
            borderRadius: '100px', padding: '0.3rem 0.85rem',
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--crimson)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <motion.span
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--crimson)', display: 'block' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            AI-Powered Emotion Intelligence
          </span>
        </motion.div>

        {/* Giant title with original texture reveal */}
        <motion.h1
          initial={{ backgroundSize: '55%' }}
          animate={{ backgroundSize: '14%' }}
          transition={{ duration: 9, delay: 0.3, ease: 'easeOut' }}
          style={{
            position: 'relative', zIndex: 1,
            fontFamily: '"Red Hat Display", sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(5rem, 15vw, 13rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            backgroundImage: 'url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2VpA1DPuS5T3kKYAmCY1Vel58zZQN7-3Bdg&s)',
            backgroundRepeat: 'repeat',
            backgroundPosition: '50% 50%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'hsla(0,0%,0%,0.07)',
            margin: '0 0 1.75rem',
            userSelect: 'none',
          }}
        >
          Revealix
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.65 }}
          style={{
            position: 'relative', zIndex: 1,
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: '420px', lineHeight: 1.8,
            marginBottom: '2.5rem', fontWeight: 400,
          }}
        >
          Unmask emotions in real-time.<br />From face to feeling — in milliseconds.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 48px rgba(199,54,89,0.5)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/live-feed')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.85rem 2rem', background: 'var(--crimson)',
              color: '#fff', borderRadius: '12px',
              fontSize: '0.95rem', fontWeight: 600,
              boxShadow: '0 0 32px rgba(199,54,89,0.3)',
              transition: 'box-shadow 0.2s',
            }}>
            Start Analyzing <FiArrowRight />
          </motion.button>
          <motion.button whileHover={{ scale: 1.04, borderColor: 'rgba(255,255,255,0.2)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '0.85rem 2rem', background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.75)', borderRadius: '12px',
              fontSize: '0.95rem', fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s',
            }}>
            View Dashboard
          </motion.button>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1, color: 'rgba(255,255,255,0.2)', fontSize: '1.4rem' }}
        >
          <FiChevronDown />
        </motion.div>
      </section>

      {/* ════ STATS STRIP ════ */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0', }}>
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div style={{
                textAlign: 'center', padding: '1rem',
                borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: '#fff', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', letterSpacing: '0.04em' }}>{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 1.5rem' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--crimson)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>Capabilities</p>
            <h2 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', lineHeight: 1.15 }}>
              Everything you need to<br />understand human emotion
            </h2>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', background: 'var(--border)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <motion.div whileHover={{ background: 'rgba(199,54,89,0.04)' }}
                style={{ background: 'var(--surface)', padding: '2rem', transition: 'background 0.2s', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '11px',
                    background: 'rgba(199,54,89,0.1)', border: '1px solid rgba(199,54,89,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--crimson)', fontSize: '1.15rem',
                  }}>
                    <f.icon />
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                    padding: '0.2rem 0.55rem', borderRadius: '100px',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════ USE CASES ════ */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--crimson)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>Real-World Applications</p>
              <h2 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff', lineHeight: 1.2 }}>
                Built for industries that<br />run on human insight
              </h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {USE_CASES.map((u, i) => (
              <Reveal key={u.title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4, borderColor: 'rgba(199,54,89,0.3)' }}
                  style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: '16px', padding: '1.75rem',
                    transition: 'border-color 0.2s',
                  }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>{u.emoji}</span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.45rem' }}>{u.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{u.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA ════ */}
      <section style={{ padding: '7rem 1.5rem' }}>
        <Reveal>
          <div style={{
            maxWidth: 760, margin: '0 auto', textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: '-2px', borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(199,54,89,0.4), transparent 60%)',
              zIndex: 0,
            }} />
            <div style={{
              position: 'relative', zIndex: 1,
              background: 'var(--surface)',
              borderRadius: '26px',
              padding: 'clamp(2.5rem, 6vw, 4rem)',
              border: '1px solid rgba(199,54,89,0.15)',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 300, height: 200,
                background: 'radial-gradient(circle, rgba(199,54,89,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--crimson)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>Get Started</p>
              <h2 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#fff', marginBottom: '1rem', lineHeight: 1.2 }}>
                Ready to see what<br />emotions reveal?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '2.25rem', fontSize: '0.95rem' }}>
                Start a session in seconds. No account required.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 48px rgba(199,54,89,0.5)' }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/live-feed')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.85rem 2.2rem', background: 'var(--crimson)',
                    color: '#fff', borderRadius: '12px',
                    fontSize: '0.95rem', fontWeight: 600,
                    boxShadow: '0 0 36px rgba(199,54,89,0.35)',
                  }}>
                  Launch Live Feed <FiArrowRight />
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/contact')}
                  style={{
                    padding: '0.85rem 2rem', background: 'transparent',
                    color: 'rgba(255,255,255,0.6)', borderRadius: '12px',
                    fontSize: '0.95rem', fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                  }}>
                  Contact Us
                </motion.button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default Home;

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiVideo, FiVideoOff, FiBarChart2, FiAlertCircle,
  FiCheckCircle, FiUser,
} from 'react-icons/fi';
import { MdFaceRetouchingNatural } from 'react-icons/md';
import { api } from '../lib/api';

const EMOTION_COLORS = {
  happy: '#4ade80', neutral: '#60a5fa', sad: '#818cf8',
  angry: '#f87171', surprised: '#fbbf24', fearful: '#34d399', disgusted: '#fb923c',
};

const LiveFeed = () => {
  const [phase, setPhase] = useState('idle'); // idle | setup | loading | live | done | error
  const [personName, setPersonName] = useState('');
  const [videoSrc, setVideoSrc] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const navigate = useNavigate();

  const startSession = useCallback(async () => {
    if (!personName.trim()) return;
    setPhase('loading');
    setErrorMsg('');
    try {
      const res = await api.post('/start_recording', { person_name: personName.trim() });
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      setSessionId(data.session_id);
      localStorage.setItem('revealix_owned_sessions', JSON.stringify(
        [...JSON.parse(localStorage.getItem('revealix_owned_sessions') || '[]'), data.session_id]
      ));
      setTimeout(() => {
        setVideoSrc(api.videoFeedUrl());
        setPhase('live');
      }, 2000);
    } catch {
      setErrorMsg('Could not connect to the backend. Make sure the Python server is running.\n\nRun: cd backend && python app.py');
      setPhase('error');
    }
  }, [personName]);

  const stopSession = useCallback(async () => {
    try {
      await api.post('/stop_recording');
    } catch { /* best effort */ }
    setVideoSrc(null);
    setPhase('done');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '7rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, black 30%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(circle, rgba(199,54,89,0.06) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '14px', background: 'rgba(199,54,89,0.1)', border: '1px solid rgba(199,54,89,0.2)', color: 'var(--crimson)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
            <MdFaceRetouchingNatural />
          </div>
          <h1 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#fff', lineHeight: 1.1, marginBottom: '0.6rem' }}>
            Live Emotion Feed
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Real-time facial emotion detection. Start a session, let the camera analyse emotions, stop when done to save data to your dashboard.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }} className="lf-grid">

          {/* ── Main panel ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

            {/* Video / state area */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <AnimatePresence mode="wait">

                {/* Idle */}
                {phase === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '3rem' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '22px', background: 'rgba(199,54,89,0.08)', border: '1px solid rgba(199,54,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crimson)', fontSize: '2.5rem' }}>
                      <FiVideo />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>Camera Standby</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Enter your name and press Start Session</p>
                    </div>
                  </motion.div>
                )}

                {/* Loading */}
                {phase === 'loading' && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <motion.div
                      style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(199,54,89,0.15)', borderTopColor: 'var(--crimson)' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>INITIALISING CAMERA…</p>
                  </motion.div>
                )}

                {/* Live feed */}
                {phase === 'live' && videoSrc && (
                  <motion.img key="feed" src={videoSrc} alt="Live emotion feed"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}

                {/* Error */}
                {phase === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                    <FiAlertCircle style={{ fontSize: '2.5rem', color: '#f87171' }} />
                    <p style={{ color: '#f87171', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line', maxWidth: 360 }}>{errorMsg}</p>
                    <button onClick={() => setPhase('idle')}
                      style={{ padding: '0.5rem 1.2rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: '0.82rem', cursor: 'pointer' }}>
                      Try Again
                    </button>
                  </motion.div>
                )}

                {/* Done */}
                {phase === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '3rem', textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220 }}
                      style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '2rem' }}>
                      <FiCheckCircle />
                    </motion.div>
                    <div>
                      <p style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>Session Complete</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Data saved to Supabase. View it in the Dashboard.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/dashboard')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'var(--crimson)', color: '#fff', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                        <FiBarChart2 /> View Dashboard
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.04 }} onClick={() => { setPhase('idle'); setPersonName(''); }}
                        style={{ padding: '0.6rem 1.25rem', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.6)', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer' }}>
                        New Session
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* REC badge */}
              {phase === 'live' && (
                <motion.div animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(199,54,89,0.9)', borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>
                  ● REC
                </motion.div>
              )}
            </div>

            {/* Emotion legend */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {Object.entries(EMOTION_COLORS).map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 100 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color, fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Right panel ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Session setup card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.4rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--crimson)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>Session Setup</p>

              {/* Person name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <FiUser size={11} /> Your Name
                </label>
                <input
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && phase === 'idle') startSession(); }}
                  placeholder="e.g. John Smith"
                  disabled={phase !== 'idle'}
                  style={{
                    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 10, color: '#fff', padding: '0.65rem 0.9rem',
                    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
                    opacity: phase !== 'idle' ? 0.5 : 1,
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(199,54,89,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.35rem' }}>
                  Used to label your emotion data in the dashboard.
                </p>
              </div>

              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <motion.div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: phase === 'live' ? '#4ade80' : phase === 'error' ? '#f87171' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                  animate={phase === 'live' ? { opacity: [1, 0.3, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {phase === 'idle' ? 'Ready' : phase === 'loading' ? 'Starting…' : phase === 'live' ? 'Recording' : phase === 'done' ? 'Complete' : 'Error'}
                </span>
              </div>

              {/* Action button */}
              {phase === 'live' ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={stopSession}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', background: 'rgba(199,54,89,0.1)', border: '1px solid rgba(199,54,89,0.35)', color: 'var(--crimson)', cursor: 'pointer' }}>
                  <FiVideoOff /> Stop & Save
                </motion.button>
              ) : (
                <motion.button
                  whileHover={phase === 'idle' && personName.trim() ? { scale: 1.02, boxShadow: '0 0 32px rgba(199,54,89,0.4)' } : {}}
                  whileTap={phase === 'idle' && personName.trim() ? { scale: 0.97 } : {}}
                  onClick={phase === 'idle' ? startSession : undefined}
                  disabled={phase !== 'idle' || !personName.trim()}
                  style={{
                    width: '100%', padding: '0.8rem', borderRadius: 12,
                    fontSize: '0.9rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                    background: phase !== 'idle' || !personName.trim() ? 'rgba(199,54,89,0.3)' : 'var(--crimson)',
                    color: '#fff', cursor: phase !== 'idle' || !personName.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: phase === 'idle' && personName.trim() ? '0 0 20px rgba(199,54,89,0.3)' : 'none',
                    transition: 'all 0.2s',
                    opacity: phase === 'loading' ? 0.7 : 1,
                  }}
                >
                  {phase === 'loading'
                    ? <><motion.div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff' }} animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} /> Starting…</>
                    : <><FiVideo /> Start Session</>
                  }
                </motion.button>
              )}
            </div>

            {/* Info cards */}
            {[
              { icon: '⚡', title: 'Real-Time Detection', desc: 'DeepFace analyses every frame in under 200ms with bounding boxes.' },
              { icon: '👥', title: 'Multi-Person', desc: 'Tracks multiple faces simultaneously, each with their own timeline.' },
              { icon: '🔒', title: 'Privacy First', desc: 'Raw video is never stored — only emotion metadata is saved.' },
            ].map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.15rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: '0.2rem' }}>{c.title}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{c.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .lf-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LiveFeed;

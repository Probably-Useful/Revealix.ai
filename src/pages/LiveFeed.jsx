import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const [phase, setPhase] = useState('idle'); // idle | loading | live | done | error
  const [personName, setPersonName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [eventCount, setEventCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const sessionIdRef = useRef(null);
  const navigate = useNavigate();

  // Draw bounding box on overlay canvas
  const drawOverlay = useCallback((region, emotion, confidence) => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    // Use the video's actual rendered dimensions
    const rect = video.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    if (!displayW || !displayH) return;

    overlay.width = displayW;
    overlay.height = displayH;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, displayW, displayH);
    if (!region || (!region.w && !region.width)) return;

    const rw = region.w ?? region.width ?? 0;
    const rh = region.h ?? region.height ?? 0;
    if (!rw || !rh) return;

    // Scale from video natural resolution to display size
    const naturalW = video.videoWidth || 640;
    const naturalH = video.videoHeight || 480;
    const scaleX = displayW / naturalW;
    const scaleY = displayH / naturalH;

    const x = (region.x ?? 0) * scaleX;
    const y = (region.y ?? 0) * scaleY;
    const w = rw * scaleX;
    const h = rh * scaleY;

    const color = EMOTION_COLORS[emotion] ?? '#C73659';

    // Bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Corner accents
    const cs = Math.min(16, w * 0.2, h * 0.2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + cs); ctx.lineTo(x, y); ctx.lineTo(x + cs, y);
    ctx.moveTo(x + w - cs, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cs);
    ctx.moveTo(x, y + h - cs); ctx.lineTo(x, y + h); ctx.lineTo(x + cs, y + h);
    ctx.moveTo(x + w - cs, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cs);
    ctx.stroke();

    // Label
    const pct = Math.round((confidence > 1 ? confidence : confidence * 100));
    const label = `${emotion}  ${pct}%`;
    ctx.font = 'bold 13px Inter, sans-serif';
    const textW = ctx.measureText(label).width + 16;
    const labelY = y > 32 ? y - 8 : y + h + 24;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, labelY - 20, textW, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 8, labelY - 2);
  }, []);

  // Capture a frame from the video and send to backend for analysis
  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !sessionIdRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
    if (!blob) return;

    const form = new FormData();
    form.append('frame', blob, 'frame.jpg');
    form.append('session_id', sessionIdRef.current);
    form.append('person_name', personName);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/analyze_frame`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.emotion) {
        setCurrentEmotion(data.emotion);
        setEmotionHistory(prev => [...prev.slice(-19), data.emotion]);
        if (data.logged) setEventCount(c => c + 1);
        drawOverlay(data.region, data.emotion, data.confidence ?? 0);
      } else {
        // Clear overlay if no face detected
        const overlay = overlayRef.current;
        if (overlay) overlay.getContext('2d').clearRect(0, 0, overlay.width, overlay.height);
      }
    } catch { /* network error, skip frame */ }
  }, [personName]);

  const startSession = useCallback(async () => {
    if (!personName.trim()) return;
    setPhase('loading');
    setErrorMsg('');

    // Request camera access from browser
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setErrorMsg('Camera access denied. Please allow camera permissions and try again.');
      setPhase('error');
      return;
    }

    // Register session with backend
    try {
      const res = await api.post('/start_recording', { person_name: personName.trim() });
      const data = await res.json();
      const sid = data.session_id;
      setSessionId(sid);
      sessionIdRef.current = sid;
      const owned = JSON.parse(localStorage.getItem('revealix_owned_sessions') || '[]');
      localStorage.setItem('revealix_owned_sessions', JSON.stringify([...owned, sid]));
    } catch {
      // Backend might not support frame analysis yet — still show camera
      const fallbackId = crypto.randomUUID();
      setSessionId(fallbackId);
      sessionIdRef.current = fallbackId;
    }

    setPhase('live');
    setEventCount(0);
    setEmotionHistory([]);
    setCurrentEmotion(null);

    // Start sending frames every 800ms
    intervalRef.current = setInterval(analyzeFrame, 800);
  }, [personName, analyzeFrame]);

  const stopSession = useCallback(async () => {
    clearInterval(intervalRef.current);

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Clear overlay
    if (overlayRef.current) {
      overlayRef.current.getContext('2d').clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }

    // Tell backend to save
    try {
      await api.post('/stop_recording');
    } catch { /* best effort */ }

    setPhase('done');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const emotionColor = currentEmotion ? (EMOTION_COLORS[currentEmotion] ?? '#fff') : 'rgba(255,255,255,0.3)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '7rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, black 30%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(circle, rgba(199,54,89,0.06) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '14px', background: 'rgba(199,54,89,0.1)', border: '1px solid rgba(199,54,89,0.2)', color: 'var(--crimson)', fontSize: '1.5rem', marginBottom: '1.25rem' }}>
            <MdFaceRetouchingNatural />
          </div>
          <h1 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#fff', lineHeight: 1.1, marginBottom: '0.6rem' }}>
            Live Emotion Feed
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Uses your device camera to detect facial emotions in real time. Works on laptop, phone, or tablet.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }} className="lf-grid">

          {/* ── Camera / state panel ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ background: 'var(--surface)', border: `1px solid ${phase === 'live' ? 'rgba(199,54,89,0.3)' : 'var(--border)'}`, borderRadius: 20, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

              {/* Live video element — always mounted, hidden when not live */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  opacity: phase === 'live' ? 1 : 0,
                  position: phase === 'live' ? 'relative' : 'absolute',
                }}
              />

              {/* Bounding box overlay canvas */}
              {phase === 'live' && (
                <canvas
                  ref={overlayRef}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none',
                  }}
                />
              )}

              <AnimatePresence mode="wait">
                {phase === 'idle' && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '3rem' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '22px', background: 'rgba(199,54,89,0.08)', border: '1px solid rgba(199,54,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crimson)', fontSize: '2.5rem' }}>
                      <FiVideo />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>Camera Standby</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Enter your name and press Start Session</p>
                    </div>
                  </motion.div>
                )}

                {phase === 'loading' && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <motion.div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(199,54,89,0.15)', borderTopColor: 'var(--crimson)' }}
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>REQUESTING CAMERA…</p>
                  </motion.div>
                )}

                {phase === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                    <FiAlertCircle style={{ fontSize: '2.5rem', color: '#f87171' }} />
                    <p style={{ color: '#f87171', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 360 }}>{errorMsg}</p>
                    <button onClick={() => setPhase('idle')} style={{ padding: '0.5rem 1.2rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: '0.82rem', cursor: 'pointer' }}>Try Again</button>
                  </motion.div>
                )}

                {phase === 'done' && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '3rem', textAlign: 'center' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220 }}
                      style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', fontSize: '2rem' }}>
                      <FiCheckCircle />
                    </motion.div>
                    <div>
                      <p style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>Session Complete</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>{eventCount} emotion events saved to Supabase.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/dashboard')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', background: 'var(--crimson)', color: '#fff', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                        <FiBarChart2 /> View Dashboard
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.04 }} onClick={() => { setPhase('idle'); setPersonName(''); setEventCount(0); }}
                        style={{ padding: '0.6rem 1.25rem', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.6)', borderRadius: 10, fontSize: '0.85rem', cursor: 'pointer' }}>
                        New Session
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live emotion overlay */}
              {phase === 'live' && currentEmotion && (
                <motion.div
                  key={currentEmotion}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.8rem', background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(10px)', borderRadius: 100, border: `1px solid ${emotionColor}40` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: emotionColor }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: emotionColor, textTransform: 'capitalize' }}>{currentEmotion}</span>
                </motion.div>
              )}

              {/* REC badge */}
              {phase === 'live' && (
                <motion.div animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(199,54,89,0.9)', borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: '#fff' }}>
                  ● REC
                </motion.div>
              )}
            </div>

            {/* Emotion history strip */}
            {phase === 'live' && emotionHistory.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {emotionHistory.map((em, i) => {
                  const c = EMOTION_COLORS[em] ?? '#fff';
                  return (
                    <div key={i} style={{ padding: '0.2rem 0.55rem', background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 100, fontSize: '0.7rem', color: c, fontWeight: 500 }}>
                      {em}
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Emotion color legend */}
            {phase !== 'live' && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {Object.entries(EMOTION_COLORS).map(([label, color]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', background: `${color}12`, border: `1px solid ${color}25`, borderRadius: 100 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.68rem', color, fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Right panel ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Session setup card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.4rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--crimson)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>Session Setup</p>

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
                  style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, color: '#fff', padding: '0.65rem 0.9rem', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', opacity: phase !== 'idle' ? 0.5 : 1, transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(199,54,89,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.35rem' }}>Labels your emotion data in the dashboard.</p>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <motion.div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: phase === 'live' ? '#4ade80' : phase === 'error' ? '#f87171' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                  animate={phase === 'live' ? { opacity: [1, 0.3, 1] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {phase === 'idle' ? 'Ready' : phase === 'loading' ? 'Starting…' : phase === 'live' ? `Recording · ${eventCount} events` : phase === 'done' ? 'Complete' : 'Error'}
                </span>
              </div>

              {/* Button */}
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
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', background: phase !== 'idle' || !personName.trim() ? 'rgba(199,54,89,0.3)' : 'var(--crimson)', color: '#fff', cursor: phase !== 'idle' || !personName.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                  {phase === 'loading'
                    ? <><motion.div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff' }} animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} /> Starting…</>
                    : <><FiVideo /> Start Session</>
                  }
                </motion.button>
              )}
            </div>

            {/* Info cards */}
            {[
              { icon: '📱', title: 'Works on Any Device', desc: 'Uses your browser camera — laptop webcam, phone selfie camera, or tablet.' },
              { icon: '⚡', title: 'Real-Time Detection', desc: 'Frames are analysed by DeepFace every 1.5 seconds with emotion confidence scores.' },
              { icon: '🔒', title: 'Privacy First', desc: 'Raw video never leaves your device. Only emotion metadata is saved.' },
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

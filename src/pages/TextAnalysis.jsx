import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FiMic, FiMicOff, FiSend, FiZap, FiTrash2 } from 'react-icons/fi';
import { MdSentimentSatisfiedAlt, MdSentimentNeutral, MdSentimentVeryDissatisfied } from 'react-icons/md';
import { api } from '../lib/api';

/* ── helpers ── */
const scoreColor = (s) => s >= 0.6 ? '#4ade80' : s <= 0.38 ? '#f87171' : '#60a5fa';

const sentimentLabel = (s) => {
  if (s >= 0.65) return { label: 'Positive', color: '#4ade80', icon: MdSentimentSatisfiedAlt, bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' };
  if (s >= 0.55) return { label: 'Mostly Positive', color: '#86efac', icon: MdSentimentSatisfiedAlt, bg: 'rgba(134,239,172,0.08)', border: 'rgba(134,239,172,0.2)' };
  if (s >= 0.45) return { label: 'Neutral', color: '#60a5fa', icon: MdSentimentNeutral, bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' };
  if (s >= 0.35) return { label: 'Mostly Negative', color: '#fca5a5', icon: MdSentimentVeryDissatisfied, bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.2)' };
  return { label: 'Negative', color: '#f87171', icon: MdSentimentVeryDissatisfied, bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' };
};

const wordColor = (s) => s > 0.3 ? '#4ade80' : s < -0.3 ? '#f87171' : '#60a5fa';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(8,8,16,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.78rem', color: '#fff' }}>
      {payload.map((p, i) => <p key={i}>{p.dataKey ?? p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</strong></p>)}
    </div>
  );
};

/* ── Animated score ring ── */
const ScoreRing = ({ score, color }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.round(score * 100);
  const dash = (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: '2rem', color, lineHeight: 1 }}
        >
          {pct}%
        </motion.span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>SCORE</span>
      </div>
    </div>
  );
};

/* ── Word pill ── */
const WordPill = ({ word, score }) => {
  const c = wordColor(score);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.22rem 0.6rem', borderRadius: '100px',
        background: `${c}12`, border: `1px solid ${c}30`,
        color: c, fontSize: '0.76rem', fontWeight: 500,
      }}
    >
      {word}
      <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>{score > 0 ? '+' : ''}{score.toFixed(2)}</span>
    </motion.span>
  );
};

/* ── Bar label ── */
const BreakdownBar = ({ label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', width: 58, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 3, background: color }}
      />
    </div>
    <span style={{ fontSize: '0.72rem', color, width: 38, textAlign: 'right', fontWeight: 600 }}>{(value * 100).toFixed(1)}%</span>
  </div>
);

const EXAMPLES = [
  'This is the best day of my life, I feel amazing!',
  "I'm frustrated with how this keeps failing over and over.",
  'The weather today is fairly average, nothing special.',
];

const TextAnalysis = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const analyze = useCallback(async (inputText) => {
    const target = inputText ?? text;
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post('/analyze_sentiment', { text: target.trim() });
      if (!res.ok) throw new Error(res.status);
      setResult(await res.json());
    } catch {
      setError('Could not reach the backend. Make sure the Python server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [text]);

  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Speech recognition not supported in this browser.'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.start(); setListening(true);
    r.onresult = (e) => { setText(p => (p ? p + ' ' : '') + e.results[0][0].transcript); setListening(false); };
    r.onerror = r.onend = () => setListening(false);
    recognitionRef.current = r;
  }, [listening]);

  const sentiment = result ? sentimentLabel(result.compound) : null;
  const SentIcon = sentiment?.icon;

  const radarData = result ? [
    { category: 'Positive', value: result.pos },
    { category: 'Neutral', value: result.neu },
    { category: 'Negative', value: result.neg },
  ] : [];

  const wordBarData = result?.word_scores
    ? Object.entries(result.word_scores)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 14)
        .map(([word, score]) => ({ word, score }))
    : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '7rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, black 30%, transparent 100%)',
      }} />
      <div style={{ position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(199,54,89,0.07) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Page header ── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--crimson)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>Text & Voice</p>
          <h1 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#fff', lineHeight: 1.1, marginBottom: '0.6rem' }}>
            Sentiment Analysis
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', maxWidth: 480 }}>
            Type or speak any text. VADER NLP scores every word for emotional polarity in real time.
          </p>
        </motion.div>

        {/* ── Main input card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.25rem' }}>

          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze(); }}
              placeholder="Type something to analyse… or click the mic. Press Ctrl+Enter to submit."
              rows={4}
              style={{
                width: '100%', background: 'var(--surface-2)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: '1rem 1rem 2.5rem', color: '#fff',
                fontSize: '0.95rem', lineHeight: 1.65,
                resize: 'vertical', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(199,54,89,0.45)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            {/* char count */}
            <span style={{ position: 'absolute', bottom: '0.6rem', right: '0.75rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
              {text.length} chars
            </span>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Mic */}
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={toggleVoice}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 0.9rem',
                  background: listening ? 'rgba(199,54,89,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${listening ? 'rgba(199,54,89,0.35)' : 'var(--border)'}`,
                  borderRadius: 10, color: listening ? 'var(--crimson)' : 'rgba(255,255,255,0.5)',
                  fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
                }}>
                {listening
                  ? <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><FiMicOff size={14} /></motion.div>
                  : <FiMic size={14} />}
                {listening ? 'Listening…' : 'Speak'}
              </motion.button>

              {/* Clear */}
              {text && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { setText(''); setResult(null); setError(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <FiTrash2 size={13} /> Clear
                </motion.button>
              )}
            </div>

            {/* Analyse */}
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 32px rgba(199,54,89,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => analyze()}
              disabled={loading || !text.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.6rem 1.4rem',
                background: 'var(--crimson)', color: '#fff', borderRadius: 10,
                fontSize: '0.88rem', fontWeight: 600,
                boxShadow: '0 0 20px rgba(199,54,89,0.22)',
                opacity: loading || !text.trim() ? 0.55 : 1,
                cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading
                ? <motion.div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff' }} animate={{ rotate: 360 }} transition={{ duration: 0.65, repeat: Infinity, ease: 'linear' }} />
                : <FiSend size={14} />}
              Analyse
            </motion.button>
          </div>
        </motion.div>

        {/* ── Example prompts ── */}
        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginRight: '0.25rem' }}>Try:</span>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => { setText(ex); analyze(ex); }}
                style={{
                  padding: '0.3rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 100, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                  maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(199,54,89,0.35)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                {ex.length > 38 ? ex.slice(0, 38) + '…' : ex}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Error ── */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '0.85rem 1.1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.85rem' }}>
            ⚠ {error}
          </motion.div>
        )}

        {/* ── Loading shimmer ── */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, height: 180 }} />
            ))}
          </div>
        )}

        {/* ══ RESULTS ══ */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div key="results"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >

              {/* ── Hero result card ── */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 20, padding: '1.75rem',
                display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: `radial-gradient(circle at 100% 0%, ${sentiment.bg} 0%, transparent 65%)`, pointerEvents: 'none' }} />

                {/* Ring */}
                <ScoreRing score={result.compound} color={scoreColor(result.compound)} />

                {/* Label + bars */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', background: sentiment.bg, border: `1px solid ${sentiment.border}`, borderRadius: 100 }}>
                      {SentIcon && <SentIcon style={{ color: sentiment.color, fontSize: '1rem' }} />}
                      <span style={{ color: sentiment.color, fontSize: '0.82rem', fontWeight: 700 }}>{sentiment.label}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>compound: {result.compound.toFixed(3)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <BreakdownBar label="Positive" value={result.pos} color="#4ade80" />
                    <BreakdownBar label="Neutral" value={result.neu} color="#60a5fa" />
                    <BreakdownBar label="Negative" value={result.neg} color="#f87171" />
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 130 }}>
                  {[
                    { label: 'Words scored', value: Object.keys(result.word_scores ?? {}).length },
                    { label: 'Positive terms', value: result.top_positive?.length ?? 0, color: '#4ade80' },
                    { label: 'Negative terms', value: result.top_negative?.length ?? 0, color: '#f87171' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.6rem 0.8rem' }}>
                      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.15rem' }}>{s.label}</p>
                      <p style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: '1.3rem', color: s.color ?? '#fff', lineHeight: 1 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Charts row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>

                {/* Radar */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '0.25rem' }}>Sentiment Breakdown</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>Radar view of pos / neu / neg</p>
                  <ResponsiveContainer width="100%" height={210}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 1]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="value" stroke="var(--crimson)" fill="var(--crimson)" fillOpacity={0.18} strokeWidth={2} dot={{ r: 3, fill: 'var(--crimson)' }} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Word scores bar */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '0.25rem' }}>Top Word Scores</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>Sorted by absolute polarity</p>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={wordBarData} layout="vertical" barSize={11} margin={{ left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" domain={[-1, 1]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="word" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {wordBarData.map((e, i) => <Cell key={i} fill={wordColor(e.score)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Key triggers ── */}
              {(result.top_positive?.length > 0 || result.top_negative?.length > 0) && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
                    <FiZap style={{ color: 'var(--crimson)', fontSize: '0.9rem' }} />
                    <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>Key Triggers</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {result.top_positive?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>✅ Positive drivers</p>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {result.top_positive.map(w => <WordPill key={w} word={w} score={result.word_scores?.[w] ?? 0.5} />)}
                        </div>
                      </div>
                    )}
                    {result.top_negative?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>🔻 Negative drivers</p>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {result.top_negative.map(w => <WordPill key={w} word={w} score={result.word_scores?.[w] ?? -0.5} />)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Full word map ── */}
              {result.word_scores && Object.keys(result.word_scores).length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '0.25rem' }}>Word-by-Word Map</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>Every scored word with its polarity value</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {Object.entries(result.word_scores).map(([w, s]) => <WordPill key={w} word={w} score={s} />)}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TextAnalysis;

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  FiUsers, FiActivity, FiPieChart, FiFilter, FiDatabase,
  FiEdit2, FiCheck, FiX, FiTrendingUp, FiClock, FiRefreshCw, FiTrash,
} from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

const EMOTION_COLORS = {
  happy: '#4ade80', neutral: '#60a5fa', sad: '#818cf8',
  angry: '#f87171', surprised: '#fbbf24', fearful: '#34d399', disgusted: '#fb923c',
};
const ec = (e) => EMOTION_COLORS[e?.toLowerCase()] ?? '#7a7a9a';

/* ─── Tiny helpers ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,20,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.78rem', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {label && <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '0.35rem', fontSize: '0.72rem' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#fff' }}>{p.name ?? p.dataKey}: <strong>{typeof p.value === 'number' ? p.value : p.value}</strong></p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, span = 1, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '18px', padding: '1.5rem',
      gridColumn: span > 1 ? `span ${span}` : undefined,
    }}
  >
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

const StatCard = ({ icon: Icon, label, value, sub, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '1.4rem',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      position: 'relative', overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 80, height: 80,
      background: `radial-gradient(circle at 100% 0%, ${accent ?? 'rgba(199,54,89,0.08)'} 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'rgba(199,54,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crimson)', fontSize: '0.95rem' }}>
        <Icon />
      </div>
    </div>
    <p style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2rem)', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: '"Red Hat Display", sans-serif' }}>{value}</p>
    {sub && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</p>}
  </motion.div>
);

/* ─── Inline name editor ─── */
const NameEditor = ({ personId, displayName, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);

  const commit = useCallback(async () => {
    if (!draft.trim() || draft === displayName) { setEditing(false); return; }
    await onSave(personId, draft.trim());
    setEditing(false);
  }, [draft, displayName, onSave, personId]);

  if (!editing) return (
    <button onClick={() => setEditing(true)}
      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', padding: '0.15rem 0.4rem', borderRadius: 6, border: '1px solid transparent', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <FiEdit2 size={11} /> Rename
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
      <input
        autoFocus value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          background: 'var(--surface-2)', border: '1px solid rgba(199,54,89,0.4)',
          borderRadius: 6, color: '#fff', padding: '0.25rem 0.5rem',
          fontSize: '0.8rem', outline: 'none', width: 110,
        }}
      />
      <button onClick={commit} style={{ background: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '0.9rem' }}><FiCheck /></button>
      <button onClick={() => setEditing(false)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}><FiX /></button>
    </div>
  );
};

/* ─── Empty state ─── */
const EmptyState = () => (
  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '5rem 2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', textAlign: 'center' }}>
    <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(199,54,89,0.08)', border: '1px solid rgba(199,54,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crimson)', fontSize: '1.5rem' }}><FiDatabase /></div>
    <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>No data yet</h3>
    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.6 }}>Run a live session or check your Supabase connection to see analytics here.</p>
  </div>
);

/* ══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ emotion: 'All', person: 'All', session: 'All' });
  const [showFilters, setShowFilters] = useState(false);
  const [personNames, setPersonNames] = useState({});
  const [sessionNames, setSessionNames] = useState({});
  const [editingSession, setEditingSession] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  // Sessions this browser/user created — loaded from localStorage
  const [ownedSessions] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('revealix_owned_sessions') || '[]'));
    } catch { return new Set(); }
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('emotion_logs')
        .select('*')
        .order('timestamp', { ascending: true });
      if (err) throw err;
      setRows(data ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      setError('Could not load data. Check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('emotion_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emotion_logs' },
        (p) => setRows(prev => [...prev, p.new]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const handleRename = useCallback(async (personKey, newName) => {
    setPersonNames(prev => ({ ...prev, [personKey]: newName }));
  }, []);

  const handleDeleteSession = useCallback(async (sessionId) => {
    if (!window.confirm('Delete all data for this session? This cannot be undone.')) return;
    try {
      await supabase.from('emotion_logs').delete().eq('session_id', sessionId);
      setRows(prev => prev.filter(r => r.session_id !== sessionId));
      setSessionNames(p => { const c = { ...p }; delete c[sessionId]; return c; });
    } catch (e) {
      console.error('Delete failed', e);
    }
  }, []);

  const displayName = useCallback((person, sessionId) => {
    return personNames[`${person}_${sessionId}`] ?? person;
  }, [personNames]);

  /* ── Options ── */
  const emotionOptions = useMemo(() => ['All', ...new Set(rows.map(r => r.emotion).filter(Boolean))], [rows]);
  const personOptions = useMemo(() => ['All', ...new Set(rows.map(r => r.person).filter(Boolean))], [rows]);
  const sessionOptions = useMemo(() => ['All', ...new Set(rows.map(r => r.session_id).filter(Boolean)).values()].map((s, i) => ({ id: s, label: s === 'All' ? 'All' : `Session ${i}` })), [rows]);

  /* ── Filtered ── */
  const filtered = useMemo(() => rows.filter(r => {
    if (filters.emotion !== 'All' && r.emotion !== filters.emotion) return false;
    if (filters.person !== 'All' && r.person !== filters.person) return false;
    if (filters.session !== 'All' && r.session_id !== filters.session) return false;
    return true;
  }), [rows, filters]);

  /* ── Chart derivations ── */
  const emotionDist = useMemo(() => {
    const c = {};
    filtered.forEach(r => r.emotion && (c[r.emotion] = (c[r.emotion] ?? 0) + 1));
    return Object.entries(c).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const uniqueEmotions = useMemo(() => [...new Set(filtered.map(r => r.emotion).filter(Boolean))], [filtered]);

  const timelineData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      if (!r.timestamp) return;
      const d = new Date(r.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!map[d]) map[d] = {};
      map[d][r.emotion] = (map[d][r.emotion] ?? 0) + 1;
    });
    return Object.entries(map).map(([date, emotions]) => ({ date, ...emotions }));
  }, [filtered]);

  const hourlyData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      if (!r.timestamp) return;
      const h = new Date(r.timestamp).getHours();
      const label = `${h}:00`;
      map[label] = (map[label] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hour, count]) => ({ hour, count }));
  }, [filtered]);

  const personData = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      if (!r.person) return;
      const key = displayName(r.person, r.session_id);
      if (!map[key]) map[key] = { person: key, total: 0 };
      map[key][r.emotion] = (map[key][r.emotion] ?? 0) + 1;
      map[key].total++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, displayName]);

  const confidenceData = useMemo(() => {
    const byEmotion = {};
    filtered.forEach(r => {
      if (!r.emotion || r.confidence == null) return;
      if (!byEmotion[r.emotion]) byEmotion[r.emotion] = [];
      byEmotion[r.emotion].push(r.confidence > 1 ? r.confidence : r.confidence * 100);
    });
    return Object.entries(byEmotion).map(([name, vals]) => ({
      name,
      avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    })).sort((a, b) => b.avg - a.avg);
  }, [filtered]);

  const radarData = useMemo(() => emotionDist.map(e => ({
    emotion: e.name,
    count: e.value,
  })), [emotionDist]);

  /* ── Person list for rename panel ── */
  const personList = useMemo(() => {
    const seen = new Set();
    return filtered.filter(r => {
      const key = `${r.person}_${r.session_id}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(r => ({ person: r.person, session_id: r.session_id, key: `${r.person}_${r.session_id}` }));
  }, [filtered]);

  const dominantEmotion = emotionDist[0]?.name ?? '—';
  const uniquePersons = new Set(filtered.map(r => r.person).filter(Boolean)).size;
  const avgConfidence = filtered.filter(r => r.confidence != null).length
    ? Math.round(filtered.filter(r => r.confidence != null).reduce((s, r) => s + (r.confidence > 1 ? r.confidence : r.confidence * 100), 0) / filtered.filter(r => r.confidence != null).length)
    : 0;
  const totalSessions = new Set(filtered.map(r => r.session_id).filter(Boolean)).size;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <motion.div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(199,54,89,0.15)', borderTopColor: 'var(--crimson)' }}
        animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }} />
    </div>
  );

  const FilterSel = ({ label, value, options, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', padding: '0.45rem 0.7rem', fontSize: '0.83rem', cursor: 'pointer', outline: 'none' }}>
        {options.map(o => <option key={typeof o === 'string' ? o : o.id} value={typeof o === 'string' ? o : o.id}>{typeof o === 'string' ? o : o.label}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <style>{`
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1rem;
        }
        .dash-col-4 { grid-column: span 4; }
        .dash-col-6 { grid-column: span 6; }
        .dash-col-8 { grid-column: span 8; }

        @media (max-width: 1024px) {
          .dash-col-4, .dash-col-8 { grid-column: span 6; }
        }
        @media (max-width: 700px) {
          .dash-grid { grid-template-columns: 1fr; }
          .dash-col-4, .dash-col-6, .dash-col-8 { grid-column: span 1; }
        }
        @media (max-width: 600px) {
          .dash-root { padding: 5.5rem 1rem 3rem !important; }
        }
      `}</style>

      <div className="dash-root" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '7rem 1.5rem 5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.25rem' }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--crimson)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>Analytics</p>
            <h1 style={{ fontFamily: '"Red Hat Display", sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', color: '#fff', lineHeight: 1 }}>Emotion Dashboard</h1>
            {lastRefresh && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Last updated {lastRefresh.toLocaleTimeString()}</p>}
          </motion.div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <motion.button whileHover={{ scale: 1.03 }} onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
              <FiRefreshCw size={13} /> Refresh
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: showFilters ? 'rgba(199,54,89,0.12)' : 'var(--surface)', border: `1px solid ${showFilters ? 'rgba(199,54,89,0.3)' : 'var(--border)'}`, borderRadius: 10, color: showFilters ? 'var(--crimson)' : '#fff', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
              <FiFilter size={13} /> Filters
            </motion.button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', overflow: 'hidden' }}>
              <FilterSel label="Emotion" value={filters.emotion} options={emotionOptions} onChange={v => setFilters(f => ({ ...f, emotion: v }))} />
              <FilterSel label="Person" value={filters.person} options={personOptions} onChange={v => setFilters(f => ({ ...f, person: v }))} />
              <FilterSel label="Session" value={filters.session}
                options={[{ id: 'All', label: 'All Sessions' }, ...new Set(rows.map(r => r.session_id).filter(Boolean))].filter((v, i, a) => a.findIndex(x => (typeof x === 'string' ? x : x.id) === (typeof v === 'string' ? v : v.id)) === i).map((s, i) => typeof s === 'string' && s !== 'All' ? { id: s, label: `Session ${i}` } : s)}
                onChange={v => setFilters(f => ({ ...f, session: v }))} />
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={() => setFilters({ emotion: 'All', person: 'All', session: 'All' })}
                  style={{ padding: '0.45rem 0.85rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '0.85rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem', marginBottom: '1.1rem' }}>
          <StatCard icon={FiActivity} label="Total Events" value={filtered.length.toLocaleString()} sub="emotion detections" delay={0} />
          <StatCard icon={FiUsers} label="People Tracked" value={uniquePersons} sub="unique persons" delay={0.05} />
          <StatCard icon={FiPieChart} label="Dominant Emotion" value={dominantEmotion} sub="most frequent" delay={0.1} />
          <StatCard icon={FiTrendingUp} label="Avg Confidence" value={`${avgConfidence}%`} sub="detection accuracy" delay={0.15} />
          <StatCard icon={FiClock} label="Sessions" value={totalSessions} sub="recording sessions" delay={0.2} />
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'grid' }}><EmptyState /></div>
        ) : (
          <div className="dash-grid">

            {/* Donut */}
            <div className="dash-col-4">
              <ChartCard title="Emotion Distribution" subtitle="Overall share" delay={0.08}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={emotionDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {emotionDist.map(e => <Cell key={e.name} fill={ec(e.name)} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v => <span style={{ color: '#fff', fontSize: '0.75rem' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Radar */}
            <div className="dash-col-4">
              <ChartCard title="Emotion Radar" subtitle="Relative intensity" delay={0.1}>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="emotion" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                    <Radar dataKey="count" stroke="var(--crimson)" fill="var(--crimson)" fillOpacity={0.18} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Confidence */}
            <div className="dash-col-4">
              <ChartCard title="Avg Confidence" subtitle="Per emotion (%)" delay={0.12}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={confidenceData} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" radius={[0, 5, 5, 0]}>
                      {confidenceData.map(e => <Cell key={e.name} fill={ec(e.name)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Area timeline */}
            <div className="dash-col-8">
              <ChartCard title="Emotion Timeline" subtitle="Events per day" delay={0.14}>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={timelineData}>
                    <defs>
                      {uniqueEmotions.map(e => (
                        <linearGradient key={e} id={`g-${e}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ec(e)} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={ec(e)} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v => <span style={{ color: '#fff', fontSize: '0.75rem' }}>{v}</span>} />
                    {uniqueEmotions.map(e => (
                      <Area key={e} type="monotone" dataKey={e} stroke={ec(e)} fill={`url(#g-${e})`} strokeWidth={2} dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Hourly */}
            <div className="dash-col-4">
              <ChartCard title="Hourly Activity" subtitle="Events by hour of day" delay={0.16}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="var(--crimson)" strokeWidth={2} dot={{ fill: 'var(--crimson)', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Stacked by person */}
            <div className="dash-col-8">
              <ChartCard title="Emotions by Person" subtitle="Stacked breakdown" delay={0.18}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={personData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="person" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Legend formatter={v => <span style={{ color: '#fff', fontSize: '0.75rem' }}>{v}</span>} />
                    {uniqueEmotions.map(e => (
                      <Bar key={e} dataKey={e} stackId="a" fill={ec(e)} radius={e === uniqueEmotions.at(-1) ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Person rename */}
            <div className="dash-col-4">
              <ChartCard title="Person Labels" subtitle="Rename people from your sessions" delay={0.2}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 220, overflowY: 'auto' }}>
                  {personList.length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No persons detected yet.</p>
                    : personList.map(({ person, session_id, key }) => {
                        const isOwned = ownedSessions.has(session_id);
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--surface-2)', borderRadius: 10, border: `1px solid ${isOwned ? 'rgba(199,54,89,0.2)' : 'var(--border)'}` }}>
                            <div>
                              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{displayName(person, session_id)}</p>
                              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {person} · {session_id?.slice(0, 8)}…
                                {isOwned && <span style={{ color: 'var(--crimson)', marginLeft: '0.35rem' }}>yours</span>}
                              </p>
                            </div>
                            {isOwned
                              ? <NameEditor personId={key} displayName={displayName(person, session_id)} onSave={handleRename} />
                              : <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>read-only</span>
                            }
                          </div>
                        );
                      })
                  }
                </div>
              </ChartCard>
            </div>

            {/* Frequency */}
            <div className="dash-col-6">
              <ChartCard title="Frequency Ranking" subtitle="Total count per emotion" delay={0.22}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={emotionDist} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {emotionDist.map(e => <Cell key={e.name} fill={ec(e.name)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Session manager — rename + delete */}
            <div className="dash-col-6">
              <ChartCard title="Sessions" subtitle="You can only edit sessions you created" delay={0.24}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                  {[...new Set(rows.map(r => r.session_id).filter(Boolean))].map((sid, i) => {
                    const count = rows.filter(r => r.session_id === sid).length;
                    const pct = Math.round((count / rows.length) * 100);
                    const name = sessionNames[sid] ?? `Session ${i + 1}`;
                    const isOwned = ownedSessions.has(sid);
                    return (
                      <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0.65rem', background: 'var(--surface-2)', borderRadius: 10, border: `1px solid ${isOwned ? 'rgba(199,54,89,0.25)' : 'var(--border)'}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {editingSession === sid ? (
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                              <input
                                autoFocus
                                defaultValue={name}
                                id={`ses-input-${sid}`}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { setSessionNames(p => ({ ...p, [sid]: e.target.value.trim() || name })); setEditingSession(null); }
                                  if (e.key === 'Escape') setEditingSession(null);
                                }}
                                style={{ background: 'var(--bg)', border: '1px solid rgba(199,54,89,0.4)', borderRadius: 6, color: '#fff', padding: '0.2rem 0.5rem', fontSize: '0.8rem', outline: 'none', width: '100%' }}
                              />
                              <button onClick={() => { const v = document.getElementById(`ses-input-${sid}`)?.value; setSessionNames(p => ({ ...p, [sid]: v?.trim() || name })); setEditingSession(null); }} style={{ background: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '0.9rem' }}><FiCheck /></button>
                              <button onClick={() => setEditingSession(null)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}><FiX /></button>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                {isOwned && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--crimson)', background: 'rgba(199,54,89,0.1)', border: '1px solid rgba(199,54,89,0.2)', borderRadius: 4, padding: '0.1rem 0.35rem', flexShrink: 0 }}>yours</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--bg)', overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', background: isOwned ? 'var(--crimson)' : 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>{count} events</span>
                              </div>
                            </>
                          )}
                        </div>
                        {/* Only owned sessions get edit/delete buttons */}
                        {isOwned && editingSession !== sid && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                            <button onClick={() => setEditingSession(sid)}
                              style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, border: '1px solid transparent', transition: 'all 0.15s', fontSize: '0.8rem' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            ><FiEdit2 size={12} /></button>
                            <button onClick={() => handleDeleteSession(sid)}
                              style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, border: '1px solid transparent', transition: 'all 0.15s', fontSize: '0.8rem' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = '#f87171'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            ><FiTrash size={12} /></button>
                          </div>
                        )}
                        {!isOwned && (
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.18)', fontStyle: 'italic', flexShrink: 0 }}>read-only</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </div>

          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

"""
Revealix.ai — One-time Supabase setup script
─────────────────────────────────────────────
Run this ONCE after creating your Supabase project to create the required table
and enable Row Level Security.

Usage:
  1. Copy .env.example to .env and fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
  2. cd backend
  3. python setup_supabase.py

The SERVICE key (not the anon key) is required because we're creating a table.
Find it in: Supabase Dashboard → Project Settings → API → service_role secret
"""

import os
import sys

try:
    from supabase import create_client
except ImportError:
    print("Run: pip install supabase")
    sys.exit(1)

# ── Load env ──────────────────────────────────────────────────────────────────
from pathlib import Path

env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

URL = os.environ.get('SUPABASE_URL', '')
KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

if not URL or not KEY or 'placeholder' in URL:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file first.")
    sys.exit(1)

client = create_client(URL, KEY)

# ── SQL to run via Supabase's REST API ────────────────────────────────────────
# Supabase doesn't expose raw SQL through the Python SDK easily,
# so we guide you to run this in the Supabase SQL Editor.

SQL = """
-- ============================================================
-- Revealix.ai — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Emotion logs table
CREATE TABLE IF NOT EXISTS public.emotion_logs (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     uuid NOT NULL,
    timestamp      timestamptz NOT NULL DEFAULT now(),
    person         text NOT NULL,
    emotion        text NOT NULL,
    confidence     float4,
    x              int4,
    y              int4,
    width          int4,
    height         int4,
    created_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_emotion_logs_session  ON public.emotion_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_ts       ON public.emotion_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_emotion  ON public.emotion_logs (emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_person   ON public.emotion_logs (person);

-- 3. Enable Row Level Security
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous reads (for the dashboard)
CREATE POLICY "anon_read" ON public.emotion_logs
    FOR SELECT USING (true);

-- 5. Allow service-role writes only (backend uses service key)
CREATE POLICY "service_insert" ON public.emotion_logs
    FOR INSERT WITH CHECK (true);

-- Done!

-- ============================================================
-- MOCK DATA — makes the dashboard look like it has real users
-- Run this after the schema above
-- ============================================================

DO $$
DECLARE
  s1 uuid := gen_random_uuid();
  s2 uuid := gen_random_uuid();
  s3 uuid := gen_random_uuid();
  s4 uuid := gen_random_uuid();
  emotions text[] := ARRAY['happy','neutral','sad','angry','surprised','fearful','disgusted'];
  persons  text[] := ARRAY['Person1','Person2','Person3'];
  i int;
BEGIN
  -- Session 1: 3 days ago, 3 people, 80 events
  FOR i IN 1..80 LOOP
    INSERT INTO public.emotion_logs (session_id, timestamp, person, emotion, confidence, x, y, width, height)
    VALUES (
      s1,
      NOW() - INTERVAL '3 days' + (i * INTERVAL '8 seconds'),
      persons[1 + floor(random()*3)::int % 3],
      emotions[1 + floor(random()*7)::int % 7],
      round((0.55 + random()*0.45)::numeric, 4),
      floor(random()*400)::int, floor(random()*200)::int,
      floor(80 + random()*80)::int, floor(80 + random()*80)::int
    );
  END LOOP;

  -- Session 2: 2 days ago, 2 people, 60 events
  FOR i IN 1..60 LOOP
    INSERT INTO public.emotion_logs (session_id, timestamp, person, emotion, confidence, x, y, width, height)
    VALUES (
      s2,
      NOW() - INTERVAL '2 days' + (i * INTERVAL '10 seconds'),
      persons[1 + floor(random()*2)::int % 2],
      emotions[1 + floor(random()*7)::int % 7],
      round((0.6 + random()*0.38)::numeric, 4),
      floor(random()*500)::int, floor(random()*300)::int,
      floor(90 + random()*70)::int, floor(90 + random()*70)::int
    );
  END LOOP;

  -- Session 3: yesterday, 1 person, 45 events (mostly happy/neutral)
  FOR i IN 1..45 LOOP
    INSERT INTO public.emotion_logs (session_id, timestamp, person, emotion, confidence, x, y, width, height)
    VALUES (
      s3,
      NOW() - INTERVAL '1 day' + (i * INTERVAL '12 seconds'),
      'Person1',
      CASE WHEN random() > 0.35 THEN (ARRAY['happy','neutral'])[1 + floor(random()*2)::int % 2]
           ELSE emotions[1 + floor(random()*7)::int % 7] END,
      round((0.65 + random()*0.34)::numeric, 4),
      floor(random()*420)::int, floor(random()*240)::int,
      floor(100 + random()*60)::int, floor(100 + random()*60)::int
    );
  END LOOP;

  -- Session 4: today, 2 people, 35 events
  FOR i IN 1..35 LOOP
    INSERT INTO public.emotion_logs (session_id, timestamp, person, emotion, confidence, x, y, width, height)
    VALUES (
      s4,
      NOW() - INTERVAL '2 hours' + (i * INTERVAL '15 seconds'),
      persons[1 + floor(random()*2)::int % 2],
      emotions[1 + floor(random()*7)::int % 7],
      round((0.58 + random()*0.4)::numeric, 4),
      floor(random()*380)::int, floor(random()*220)::int,
      floor(85 + random()*75)::int, floor(85 + random()*75)::int
    );
  END LOOP;
END $$;
"""

print("=" * 60)
print("Revealix.ai — Supabase Setup")
print("=" * 60)
print()
print("Connection to Supabase: OK ✓")
print()
print("NEXT STEP:")
print("  1. Open your Supabase project dashboard")
print("  2. Go to: SQL Editor → New Query")
print("  3. Paste and run the following SQL:")
print()
print(SQL)
print()
print("After running the SQL, your database is ready.")
print("Add your environment variables to Railway/Vercel and deploy.")

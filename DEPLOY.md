# Revealix.ai — Deployment Guide

This guide walks you through deploying the full stack:
- **Frontend** (React/Vite) → [Vercel](https://vercel.com)
- **Backend** (Flask/Python) → [Railway](https://railway.app)
- **Database** → [Supabase](https://supabase.com)

---

## 1. Supabase — Set up the database

### 1.1 Create a project
1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New Project**, give it a name (e.g. `revealix`), choose a region close to your users.
3. Wait for the project to finish provisioning (~1 min).

### 1.2 Create the schema
1. In your project dashboard, go to **SQL Editor → New Query**.
2. Paste the SQL output from running `python backend/setup_supabase.py` locally (or find it below).
3. Click **Run**.

```sql
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

CREATE INDEX IF NOT EXISTS idx_emotion_logs_session  ON public.emotion_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_ts       ON public.emotion_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_emotion  ON public.emotion_logs (emotion);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_person   ON public.emotion_logs (person);

ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read"      ON public.emotion_logs FOR SELECT USING (true);
CREATE POLICY "service_insert" ON public.emotion_logs FOR INSERT WITH CHECK (true);
```

### 1.3 Collect your keys
Go to **Project Settings → API**:
- `URL` → your `VITE_SUPABASE_URL` / `SUPABASE_URL`
- `anon public` key → your `VITE_SUPABASE_ANON_KEY`
- `service_role` key → your `SUPABASE_SERVICE_KEY` (**keep this secret, backend only**)

---

## 2. Backend — Deploy to Railway

### 2.1 Push backend to GitHub
Railway deploys from a GitHub repo. Either push the whole monorepo or just the `backend/` folder.

> **Tip:** If pushing the whole repo, tell Railway to deploy from the `backend/` subdirectory (see step 2.3).

```bash
git add .
git commit -m "feat: revealix v2 rebuild"
git push origin main
```

### 2.2 Create a Railway project
1. Go to [railway.app](https://railway.app) and sign up with GitHub.
2. Click **New Project → Deploy from GitHub repo**.
3. Select your repository.

### 2.3 Configure the service
In your Railway service settings:
- **Root directory**: `backend`
- **Build command**: `pip install -r requirements.txt`
- **Start command**: `gunicorn app:app --workers 1 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT`

### 2.4 Add environment variables
In Railway → **Variables**, add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://yourproject.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `your-service-role-key` |
| `PYTHON_VERSION` | `3.11` |

### 2.5 Get your backend URL
Once deployed, Railway gives you a URL like:
`https://revealix-backend-production.up.railway.app`

Keep this — you'll need it for the frontend.

> **Note on webcam:** The live video feed requires a webcam, which cloud servers don't have. The webcam feature works locally. For cloud deployment, consider switching to video file upload analysis instead. The sentiment analysis, dashboard, and all API routes work perfectly on Railway.

---

## 3. Frontend — Deploy to Vercel

### 3.1 Create a Vercel project
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New → Project**, import your repository.
3. Set **Framework Preset** to `Vite`.
4. Set **Root Directory** to `.` (the project root, where `package.json` is).

### 3.2 Add environment variables
In Vercel → **Settings → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://yourproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-public-key` |

### 3.3 Set the API proxy URL
The Vite dev proxy (`/api → localhost:5000`) works locally. For production, you need to tell the frontend where the backend lives.

Add one more env variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://revealix-backend-production.up.railway.app` |

Then update `src/lib/api.js` (create this file) with:

```js
export const API_BASE = import.meta.env.VITE_API_URL ?? '';
```

And replace `/api/...` calls in `LiveFeed.jsx` and `TextAnalysis.jsx` with:
```js
import { API_BASE } from '../lib/api';
// ...
await axios.post(`${API_BASE}/start_recording`);
```

### 3.4 Deploy
Click **Deploy**. Vercel will build and publish automatically on every push to `main`.

---

## 4. Local Development

### Frontend
```bash
# Install dependencies
npm install

# Start dev server (proxies /api to localhost:5000)
npm run dev
```

### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Set environment variables
copy ..\\.env.example .env   # then edit .env with your keys

# Run
python app.py
```

The app will be at `http://localhost:5173` (Vite) with API at `http://localhost:5000`.

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│   React (Vite) — Vercel CDN                        │
│   - / Home                                         │
│   - /live-feed  ──────────────────┐                │
│   - /text-analysis  ──────────┐   │                │
│   - /dashboard ──── Supabase  │   │                │
└──────────────────────┬────────┘   │                │
                       │ REST       │                 │
                       ▼            ▼                 │
              ┌─────────────────────────┐             │
              │   Flask — Railway       │             │
              │   /video_feed (MJPEG)   │             │
              │   /start_recording      │             │
              │   /stop_recording ──────┼──► Supabase │
              │   /analyze_sentiment    │             │
              └─────────────────────────┘             │
```

---

## 6. Checklist before going live

- [ ] Supabase schema created and policies set
- [ ] `.env` **never** committed to git (check `.gitignore`)
- [ ] Railway env vars set (SUPABASE_URL, SUPABASE_SERVICE_KEY)
- [ ] Vercel env vars set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] VITE_API_URL updated to Railway backend URL
- [ ] CORS on backend allows your Vercel domain (currently set to `*`, restrict for production)
- [ ] Test sentiment analysis end-to-end
- [ ] Test dashboard loads data from Supabase

---

*Built with React + Vite + Flask + DeepFace + Supabase*

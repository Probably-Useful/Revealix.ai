"""
Revealix.ai — Backend
Handles:
  - /video_feed           : MJPEG webcam stream with DeepFace emotion overlay
  - /start_recording      : Begin a new session
  - /stop_recording       : End session, persist to Supabase
  - /analyze_sentiment    : VADER text sentiment (JSON API)
"""

from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import time
import threading
import uuid
import os
from dotenv import load_dotenv

# Load .env — works whether run directly or via npm start from project root
_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_dir, '..', '.env'))  # project root .env
load_dotenv(os.path.join(_dir, '.env'))         # backend/.env as fallback

# Optional heavy deps — backend still boots without them
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("[Revealix] WARNING: cv2 not installed. Live feed will be unavailable.")
    print("[Revealix] Run: pip install opencv-python")

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("[Revealix] WARNING: deepface not installed. Emotion detection will be unavailable.")
    print("[Revealix] Run: pip install deepface tf-keras")

try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    import nltk
    from nltk.corpus import stopwords
    nltk.download('stopwords', quiet=True)
    VADER_AVAILABLE = True
except ImportError:
    VADER_AVAILABLE = False
    print("[Revealix] WARNING: vaderSentiment not installed. Text analysis will be unavailable.")
    print("[Revealix] Run: pip install vaderSentiment nltk")

try:
    from supabase import create_client, Client
    SUPABASE_LIB_AVAILABLE = True
except ImportError:
    SUPABASE_LIB_AVAILABLE = False
    print("[Revealix] WARNING: supabase not installed. Run: pip install supabase")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

# ── Supabase client ──────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "") or os.environ.get("SUPABASE_ANON_KEY", "")

supabase = None
if SUPABASE_LIB_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Revealix] Supabase connected.")
    except Exception as e:
        print(f"[Revealix] Supabase init failed: {e}")
        print("[Revealix] Emotion data will not be persisted.")
else:
    print("[Revealix] WARNING: SUPABASE_URL / SUPABASE_SERVICE_KEY not set. "
          "Emotion data will not be persisted.")

# ── State ────────────────────────────────────────────────────────────────────
_lock = threading.Lock()
_recording = False
_session_id: str | None = None
_emotion_buffer: list[dict] = []   # collected during a session
_person_name: str = 'Person1'      # set per session via start_recording

# ── Helpers ─────────────────────────────────────────────────────────────────

def _analyze_frame(frame):
    """Run DeepFace on a single frame, return list of results."""
    if not DEEPFACE_AVAILABLE:
        return []
    try:
        results = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        if isinstance(results, dict):
            return [results]
        return results
    except Exception as exc:
        print(f"[DeepFace] {exc}")
        return []


def _generate_frames():
    """MJPEG generator — yields annotated frames while recording is active."""
    global _recording, _emotion_buffer, _session_id

    if not CV2_AVAILABLE:
        print("[Revealix] cv2 not available — cannot open camera.")
        return

    # Try camera indices 2,1,3,0 — index 0 may be a virtual/broken device
    cap = None
    for idx in [2, 1, 3, 0]:
        test = cv2.VideoCapture(idx)
        if test.isOpened():
            ret, _ = test.read()
            if ret:
                cap = test
                print(f"[Revealix] Camera opened on index {idx}")
                break
        test.release()

    if cap is None:
        print("[Revealix] Could not open any webcam.")
        return

    previous_emotions: list[str | None] = []

    try:
        while True:
            with _lock:
                still_recording = _recording

            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            results = _analyze_frame(frame)
            face_count = len(results)

            # Extend previous-emotion tracker if new faces appear
            while len(previous_emotions) < face_count:
                previous_emotions.append(None)

            for idx, result in enumerate(results):
                region = result.get('region', {})
                x, y = region.get('x', 0), region.get('y', 0)
                w, h = region.get('w', 0), region.get('h', 0)
                emotion = result.get('dominant_emotion', 'unknown')
                confidence = result.get('emotion', {}).get(emotion, 0.0)

                # Draw bounding box + label
                cv2.rectangle(frame, (x, y), (x + w, y + h), (199, 54, 89), 2)
                cv2.putText(frame, emotion, (x, y - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (199, 54, 89), 2)

                # Only log when emotion changes to reduce noise
                if still_recording and emotion != previous_emotions[idx]:
                    ts = time.strftime('%Y-%m-%dT%H:%M:%S')
                    face_label = _person_name if idx == 0 else f'{_person_name}_{idx + 1}'
                    entry = {
                        'session_id': _session_id,
                        'timestamp': ts,
                        'person': face_label,
                        'emotion': emotion,
                        'confidence': round(float(confidence), 4),
                        'x': x, 'y': y, 'width': w, 'height': h,
                    }
                    with _lock:
                        _emotion_buffer.append(entry)
                    previous_emotions[idx] = emotion
                    print(f"[Revealix] Logged: {face_label} -> {emotion} ({entry['confidence']})")

            # Face count overlay
            cv2.putText(frame, f'Faces: {face_count}', (10, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

            # Encode and yield
            ok, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if ok:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n')

            if not still_recording:
                # Keep streaming even when not recording (preview mode)
                pass

    finally:
        cap.release()


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route('/video_feed')
def video_feed():
    if not CV2_AVAILABLE:
        return jsonify({'error': 'opencv-python not installed'}), 503
    return Response(_generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/start_recording', methods=['POST'])
def start_recording():
    global _recording, _session_id, _emotion_buffer, _person_name
    body = request.get_json(force=True) if request.is_json else {}
    with _lock:
        _recording = True
        _session_id = str(uuid.uuid4())
        _emotion_buffer = []
        _person_name = body.get('person_name', 'Person1')
    return jsonify({'message': 'Recording started', 'session_id': _session_id})


@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    global _recording

    with _lock:
        _recording = False
        snapshot = list(_emotion_buffer)
        sid = _session_id

    print(f"[Revealix] stop_recording called. Buffer had {len(snapshot)} entries.")

    saved = 0
    if snapshot:
        # Save to Supabase
        if supabase:
            try:
                supabase.table('emotion_logs').insert(snapshot).execute()
                saved = len(snapshot)
                print(f"[Revealix] Saved {saved} records to Supabase.")
            except Exception as exc:
                print(f"[Supabase] Insert error: {exc}")

        # Always write CSV backup
        import csv
        csv_path = os.path.join(os.path.dirname(__file__), 'emotion_log.csv')
        file_exists = os.path.isfile(csv_path)
        with open(csv_path, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=snapshot[0].keys())
            if not file_exists:
                writer.writeheader()
            writer.writerows(snapshot)
        print(f"[Revealix] {len(snapshot)} records written to emotion_log.csv")
        if not saved:
            saved = len(snapshot)
    else:
        print("[Revealix] No emotion data captured — was a face visible during recording?")

    return jsonify({
        'message': 'Recording stopped',
        'session_id': sid,
        'events_saved': saved,
    })


@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    """Receive a JPEG frame from the browser, run DeepFace, return emotion."""
    if not CV2_AVAILABLE or not DEEPFACE_AVAILABLE:
        return jsonify({'error': 'DeepFace not available'}), 503

    file = request.files.get('frame')
    session_id = request.form.get('session_id')
    person_name = request.form.get('person_name', 'Person1')

    if not file:
        return jsonify({'error': 'No frame provided'}), 400

    import numpy as np
    img_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(img_bytes, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({'error': 'Could not decode frame'}), 400

    results = _analyze_frame(frame)
    if not results:
        return jsonify({'emotion': None, 'logged': False})

    result = results[0]
    emotion = result.get('dominant_emotion', 'unknown')
    confidence = result.get('emotion', {}).get(emotion, 0.0)

    logged = False
    if _recording and session_id:
        entry = {
            'session_id': session_id,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'person': person_name,
            'emotion': emotion,
            'confidence': round(float(confidence), 4),
            'x': result.get('region', {}).get('x', 0),
            'y': result.get('region', {}).get('y', 0),
            'width': result.get('region', {}).get('w', 0),
            'height': result.get('region', {}).get('h', 0),
        }
        with _lock:
            _emotion_buffer.append(entry)
        logged = True
        print(f"[Revealix] Frame: {person_name} -> {emotion} ({confidence:.2f})")

    return jsonify({
        'emotion': emotion,
        'confidence': round(float(confidence), 4),
        'region': result.get('region', {}),
        'logged': logged,
    })
def analyze_sentiment():
    if not VADER_AVAILABLE:
        return jsonify({'error': 'vaderSentiment not installed. Run: pip install vaderSentiment nltk'}), 503

    body = request.get_json(force=True)
    raw_text = body.get('text', '').strip()
    if not raw_text:
        return jsonify({'error': 'No text provided'}), 400

    stop_words = set(stopwords.words('english')) if VADER_AVAILABLE else set()
    analyzer = SentimentIntensityAnalyzer()

    # Pre-process
    text_lower = raw_text.lower()
    text_no_digits = ''.join(c for c in text_lower if not c.isdigit())
    processed = ' '.join(w for w in text_no_digits.split() if w not in stop_words)

    # Overall scores
    scores = analyzer.polarity_scores(processed)
    compound = round((1 + scores['compound']) / 2, 4)

    # Per-word scores
    word_scores = {}
    positive_terms = []
    negative_terms = []

    for word in processed.split():
        score = round(analyzer.polarity_scores(word)['compound'], 4)
        word_scores[word] = score
        if score >= 0.5:
            positive_terms.append(word)
        elif score <= -0.5:
            negative_terms.append(word)

    return jsonify({
        'compound': compound,
        'pos': round(scores['pos'], 4),
        'neu': round(scores['neu'], 4),
        'neg': round(scores['neg'], 4),
        'top_positive': positive_terms[:5],
        'top_negative': negative_terms[:5],
        'word_scores': word_scores,
    })


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'supabase': supabase is not None})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)

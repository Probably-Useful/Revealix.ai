"""
Revealix.ai — Lightweight Backend (Render / free tier)
Only serves: /analyze_sentiment and /health
No camera, no DeepFace, no TensorFlow.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ── VADER sentiment ──────────────────────────────────────────────────────────
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    import nltk
    from nltk.corpus import stopwords
    nltk.download('stopwords', quiet=True)
    VADER_OK = True
except ImportError:
    VADER_OK = False

# ── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'vader': VADER_OK})


@app.route('/analyze_sentiment', methods=['POST'])
def analyze_sentiment():
    if not VADER_OK:
        return jsonify({'error': 'vaderSentiment not installed'}), 503

    body = request.get_json(force=True)
    raw_text = body.get('text', '').strip()
    if not raw_text:
        return jsonify({'error': 'No text provided'}), 400

    stop_words = set(stopwords.words('english'))
    analyzer = SentimentIntensityAnalyzer()

    text_lower = raw_text.lower()
    text_clean = ''.join(c for c in text_lower if not c.isdigit())
    processed = ' '.join(w for w in text_clean.split() if w not in stop_words)

    scores = analyzer.polarity_scores(processed)
    compound = round((1 + scores['compound']) / 2, 4)

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


# Stub endpoints so the frontend doesn't error on live feed page
@app.route('/start_recording', methods=['POST'])
def start_recording():
    return jsonify({'message': 'Live feed not available in cloud deployment', 'session_id': None}), 503

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    return jsonify({'message': 'Live feed not available in cloud deployment', 'events_saved': 0}), 503

@app.route('/video_feed')
def video_feed():
    return jsonify({'error': 'Live feed requires local deployment'}), 503


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

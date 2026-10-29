import json

from flask import Blueprint, jsonify, request

from app.models import AnalysisRun, Evidence
from app.services.gemini_service import GeminiError, gemini_service

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/ask', methods=['POST'])
def ask_about_evidence():
    body = request.get_json(silent=True) or {}
    question = body.get('message', '')
    if not isinstance(question, str) or not question.strip():
        return jsonify({'error': 'Enter a question about the evidence.'}), 400
    question = question.strip()[:4000]
    ids = body.get('evidence_ids')
    query = Evidence.query
    if isinstance(ids, list):
        safe_ids = [str(value) for value in ids[:100]]
        query = query.filter(Evidence.id.in_(safe_ids)) if safe_ids else query.filter(False)
    items = query.order_by(Evidence.upload_timestamp.desc()).limit(25).all()
    context = []
    for item in items:
        latest = AnalysisRun.query.filter_by(evidence_id=item.id, processing_status='completed').order_by(AnalysisRun.completion_timestamp.desc()).first()
        try:
            review = json.loads(latest.result_metadata or '{}') if latest else None
        except json.JSONDecodeError:
            review = None
        safe_review = None
        if isinstance(review, dict):
            safe_review = {
                key: str(review.get(key, ''))[:4000]
                for key in ('summary', 'transcript', 'disclaimer') if review.get(key)
            }
            observations = review.get('observations', [])
            if isinstance(observations, list):
                safe_review['observations'] = [str(value)[:500] for value in observations[:20]]
            review_events = review.get('events', [])
            if isinstance(review_events, list):
                safe_review['events'] = [
                    {'timestamp': str(value.get('timestamp', ''))[:60], 'description': str(value.get('description', ''))[:500]}
                    for value in review_events[:30] if isinstance(value, dict)
                ]
        context.append({
            'evidence_id': item.id, 'filename': item.original_filename,
            'media_type': item.media_type, 'sha256': item.file_hash,
            'upload_timestamp': item.upload_timestamp.isoformat() + 'Z',
            'saved_ai_review': safe_review,
        })
    if not context:
        return jsonify({'error': 'There is no evidence in the selected context. Upload or select evidence first.'}), 400
    try:
        answer = gemini_service.ask_about_evidence(question, context)
        return jsonify({'answer': answer, 'model': gemini_service.model, 'source_evidence': [item['evidence_id'] for item in context], 'disclaimer': 'AI-generated decision support; verify statements against original evidence.'})
    except GeminiError as exc:
        return jsonify({'error': str(exc)}), exc.status_code

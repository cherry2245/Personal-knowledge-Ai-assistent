import json
import mimetypes
import uuid
from datetime import datetime

from flask import Blueprint, jsonify

from app.extensions import db
from app.models import AnalysisRun, Evidence
from app.services.gemini_service import GeminiError, gemini_service

analysis_bp = Blueprint('analysis', __name__)
MIME_OVERRIDES = {
    'm4a': 'audio/mp4', 'mp3': 'audio/mpeg', 'oga': 'audio/ogg',
    'aac': 'audio/aac', 'mkv': 'video/x-matroska',
}


def _mime_type(filename, media_type):
    extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    guessed = MIME_OVERRIDES.get(extension) or mimetypes.guess_type(filename)[0]
    if not guessed or guessed.split('/', 1)[0] != media_type:
        raise GeminiError('Could not determine a supported media type for this file.', 415)
    return guessed


def _serialize_analysis(run):
    try:
        result = json.loads(run.result_metadata or '{}')
    except json.JSONDecodeError:
        result = {'summary': run.result_metadata or ''}
    return {
        'analysis_id': run.id,
        'evidence_id': run.evidence_id,
        'analysis_type': run.analysis_type,
        'model_identifier': run.model_identifier,
        'processing_status': run.processing_status,
        'creation_timestamp': run.creation_timestamp.isoformat() + 'Z',
        'completion_timestamp': run.completion_timestamp.isoformat() + 'Z' if run.completion_timestamp else None,
        'error_details': run.error_details,
        'result': result,
    }


def analyze_evidence(evidence_id, expected_media_type):
    evidence = Evidence.query.get_or_404(evidence_id)
    if evidence.media_type != expected_media_type:
        return jsonify({'error': f'Evidence is not {expected_media_type} media.'}), 400
    if not gemini_service.configured:
        return jsonify({'error': 'Gemini is not configured. Add GEMINI_API_KEY to backend/.env and restart the backend.'}), 503

    run = AnalysisRun(
        id=str(uuid.uuid4()), evidence_id=evidence.id,
        analysis_type=f'{expected_media_type}_review',
        model_identifier=gemini_service.model, model_version='Gemini API',
        processing_status='running',
    )
    db.session.add(run)
    db.session.commit()

    try:
        result = gemini_service.analyze(
            evidence.storage_path,
            _mime_type(evidence.original_filename, evidence.media_type),
            evidence.media_type,
            evidence.original_filename,
        )
        run.processing_status = 'completed'
        run.completion_timestamp = datetime.utcnow()
        run.result_metadata = json.dumps(result, ensure_ascii=False)
        evidence.processing_status = 'analyzed'
        db.session.commit()
        return jsonify(_serialize_analysis(run)), 200
    except GeminiError as exc:
        db.session.rollback()
        run = db.session.get(AnalysisRun, run.id)
        run.processing_status = 'failed'
        run.error_details = str(exc)
        run.completion_timestamp = datetime.utcnow()
        db.session.commit()
        return jsonify({'error': str(exc), 'analysis_id': run.id, 'status': 'failed'}), exc.status_code
    except Exception:
        db.session.rollback()
        current_run = db.session.get(AnalysisRun, run.id)
        if current_run:
            current_run.processing_status = 'failed'
            current_run.error_details = 'Unexpected analysis error. Check the backend log and retry.'
            current_run.completion_timestamp = datetime.utcnow()
            db.session.commit()
        from flask import current_app
        current_app.logger.exception('Gemini analysis failed for evidence %s', evidence.id)
        return jsonify({'error': 'Analysis failed unexpectedly. Check the backend log and retry.', 'analysis_id': run.id, 'status': 'failed'}), 502


@analysis_bp.route('/image/<evidence_id>', methods=['POST'])
def analyze_image(evidence_id):
    return analyze_evidence(evidence_id, 'image')


@analysis_bp.route('/audio/<evidence_id>', methods=['POST'])
def analyze_audio(evidence_id):
    return analyze_evidence(evidence_id, 'audio')


@analysis_bp.route('/video/<evidence_id>', methods=['POST'])
def analyze_video(evidence_id):
    return analyze_evidence(evidence_id, 'video')


@analysis_bp.route('/<analysis_id>', methods=['GET'])
def get_analysis(analysis_id):
    return jsonify(_serialize_analysis(AnalysisRun.query.get_or_404(analysis_id)))

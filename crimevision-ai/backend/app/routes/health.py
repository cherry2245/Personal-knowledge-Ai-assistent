from flask import Blueprint, jsonify
from app.config import settings

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'CrimeVision AI Backend',
        'version': '0.1.0',
        'environment': settings.FLASK_ENV
    }), 200


@health_bp.route('/capabilities', methods=['GET'])
def capabilities():
    """Return system capabilities and configuration status."""
    return jsonify({
        'status': 'operational',
        'modules': {
            'evidence_intake': 'available',
            'image_analysis': 'configured' if settings.GEMINI_API_KEY else 'needs_api_key',
            'video_review': 'configured' if settings.GEMINI_API_KEY else 'needs_api_key',
            'audio_transcription': 'configured' if settings.GEMINI_API_KEY else 'needs_api_key',
            'llm_reasoning': 'configured' if settings.GEMINI_API_KEY else 'needs_api_key',
            'report_generation': 'unavailable',
            'timeline': 'available'
        },
        'models': {
            'gemini': settings.GEMINI_MODEL if settings.GEMINI_API_KEY else None,
        },
        'supported_formats': {
            'images': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
            'videos': ['mp4', 'avi', 'mov', 'mkv', 'webm'],
            'audio': ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'aac']
        },
        'limits': {
            'max_upload_size_mb': settings.MAX_UPLOAD_SIZE // (1024 * 1024),
            'max_video_duration_seconds': settings.MAX_VIDEO_DURATION,
            'max_concurrent_jobs': settings.MAX_CONCURRENT_JOBS
        }
    }), 200

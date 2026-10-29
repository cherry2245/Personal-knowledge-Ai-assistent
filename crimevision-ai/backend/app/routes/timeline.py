import json

from flask import Blueprint, jsonify

from app.models import AnalysisRun, Evidence

timeline_bp = Blueprint('timeline', __name__)


@timeline_bp.route('', methods=['GET'])
@timeline_bp.route('/', methods=['GET'])
def get_timeline():
    events = []
    for item in Evidence.query.order_by(Evidence.upload_timestamp.desc()).all():
        events.append({
            'id': f'upload-{item.id}', 'event_type': 'evidence_upload',
            'timestamp': item.upload_timestamp.isoformat() + 'Z',
            'title': item.original_filename,
            'description': f'{item.media_type.title()} evidence received · SHA-256 {item.file_hash}',
            'evidence_id': item.id, 'source': 'system_record', 'is_estimate': False,
        })

    for run in AnalysisRun.query.filter_by(processing_status='completed').order_by(AnalysisRun.completion_timestamp.desc()).all():
        try:
            result = json.loads(run.result_metadata or '{}')
        except json.JSONDecodeError:
            result = {}
        completed_at = run.completion_timestamp.isoformat() + 'Z' if run.completion_timestamp else run.creation_timestamp.isoformat() + 'Z'
        media_type = run.analysis_type.split('_', 1)[0]
        events.append({
            'id': f'analysis-{run.id}', 'event_type': f'{media_type}_analysis',
            'timestamp': completed_at, 'title': f'{media_type.title()} review completed',
            'description': result.get('summary', 'Gemini analysis completed. See the analysis page for details.'),
            'evidence_id': run.evidence_id, 'source': 'ai_generated', 'is_estimate': False,
        })
        if media_type == 'video':
            for index, observed in enumerate(result.get('events', [])):
                if not isinstance(observed, dict) or not observed.get('description'):
                    continue
                events.append({
                    'id': f'video-{run.id}-{index}', 'event_type': 'video_observation',
                    'timestamp': completed_at, 'media_timestamp': str(observed.get('timestamp', 'Time not specified')),
                    'title': 'AI-described video segment', 'description': str(observed['description']),
                    'evidence_id': run.evidence_id, 'source': 'ai_generated', 'is_estimate': True,
                })

    events.sort(key=lambda event: event['timestamp'], reverse=True)
    return jsonify({'events': events, 'total': len(events)})

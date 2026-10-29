import os
import uuid

from flask import Blueprint, current_app, jsonify, request, send_file
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Evidence
from app.utils.file_utils import calculate_file_hash, generate_internal_filename, media_type_for

evidence_bp = Blueprint('evidence', __name__)


def serialize_evidence(item):
    return {
        'id': item.id,
        'evidence_id': item.id,
        'original_filename': item.original_filename,
        'media_type': item.media_type,
        'file_size': item.file_size,
        'file_hash': item.file_hash,
        'upload_timestamp': item.upload_timestamp.isoformat() + 'Z',
        'processing_status': item.processing_status,
    }


@evidence_bp.route('/upload', methods=['POST'])
def upload_evidence():
    file = request.files.get('file')
    if file is None:
        return jsonify({'error': 'Choose a file to upload.'}), 400
    if not file.filename:
        return jsonify({'error': 'Choose a file to upload.'}), 400

    media_type = media_type_for(file.filename)
    if media_type is None:
        return jsonify({'error': 'Supported formats: JPG, PNG, GIF, BMP, WebP, MP4, AVI, MOV, MKV, WebM, WAV, MP3, M4A, FLAC, OGG, AAC.'}), 415

    original_filename = secure_filename(file.filename)
    internal_filename = generate_internal_filename(original_filename)
    storage_path = os.path.join(current_app.config['UPLOAD_FOLDER'], internal_filename)
    file.save(storage_path)
    try:
        file_hash = calculate_file_hash(storage_path)
        existing = Evidence.query.filter_by(file_hash=file_hash).first()
        if existing:
            os.remove(storage_path)
            return jsonify({'error': 'This file is already in the evidence vault.', 'evidence_id': existing.id}), 409

        item = Evidence(
            id=str(uuid.uuid4()), original_filename=original_filename,
            internal_filename=internal_filename, storage_path=storage_path,
            media_type=media_type, file_size=os.path.getsize(storage_path),
            file_hash=file_hash, processing_status='pending',
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(serialize_evidence(item)), 201
    except Exception:
        db.session.rollback()
        if os.path.exists(storage_path):
            os.remove(storage_path)
        current_app.logger.exception('Evidence upload failed')
        return jsonify({'error': 'The file could not be saved. Please try again.'}), 500


@evidence_bp.route('/', methods=['GET'], strict_slashes=False)
def list_evidence():
    page = max(request.args.get('page', 1, type=int), 1)
    per_page = min(max(request.args.get('per_page', 20, type=int), 1), 100)
    pagination = Evidence.query.order_by(Evidence.upload_timestamp.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        'evidence': [serialize_evidence(item) for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    })


@evidence_bp.route('/<evidence_id>', methods=['GET'])
def get_evidence(evidence_id):
    return jsonify(serialize_evidence(Evidence.query.get_or_404(evidence_id)))


@evidence_bp.route('/<evidence_id>/file', methods=['GET'])
def get_evidence_file(evidence_id):
    item = Evidence.query.get_or_404(evidence_id)
    if not os.path.isfile(item.storage_path):
        return jsonify({'error': 'The stored evidence file is missing.'}), 404
    return send_file(item.storage_path, download_name=item.original_filename, as_attachment=False)


@evidence_bp.route('/<evidence_id>', methods=['DELETE'])
def delete_evidence(evidence_id):
    item = Evidence.query.get_or_404(evidence_id)
    path = item.storage_path
    db.session.delete(item)
    db.session.commit()
    if os.path.isfile(path):
        os.remove(path)
    return '', 204

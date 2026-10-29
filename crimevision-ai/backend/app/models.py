"""Persistence models for evidence and its analysis history."""
from datetime import datetime

from app.extensions import db


class Evidence(db.Model):
    __tablename__ = "evidence"

    id = db.Column(db.String(36), primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    internal_filename = db.Column(db.String(255), nullable=False, unique=True)
    storage_path = db.Column(db.String(1024), nullable=False)
    media_type = db.Column(db.String(16), nullable=False)
    file_size = db.Column(db.BigInteger, nullable=False)
    file_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)
    processing_status = db.Column(db.String(24), nullable=False, default="pending")
    upload_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    analyses = db.relationship("AnalysisRun", back_populates="evidence", cascade="all, delete-orphan")


class AnalysisRun(db.Model):
    __tablename__ = "analysis_runs"

    id = db.Column(db.String(36), primary_key=True)
    evidence_id = db.Column(db.String(36), db.ForeignKey("evidence.id"), nullable=False, index=True)
    analysis_type = db.Column(db.String(40), nullable=False)
    model_identifier = db.Column(db.String(255), nullable=False)
    model_version = db.Column(db.String(80), nullable=False)
    processing_status = db.Column(db.String(24), nullable=False, default="pending")
    creation_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completion_timestamp = db.Column(db.DateTime)
    error_details = db.Column(db.Text)
    result_metadata = db.Column(db.Text)
    evidence = db.relationship("Evidence", back_populates="analyses")
    detections = db.relationship("Detection", back_populates="analysis", cascade="all, delete-orphan")


class Detection(db.Model):
    __tablename__ = "detections"

    id = db.Column(db.String(36), primary_key=True)
    analysis_run_id = db.Column(db.String(36), db.ForeignKey("analysis_runs.id"), nullable=False, index=True)
    label = db.Column(db.String(100), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    bbox_x1 = db.Column(db.Float, nullable=False)
    bbox_y1 = db.Column(db.Float, nullable=False)
    bbox_x2 = db.Column(db.Float, nullable=False)
    bbox_y2 = db.Column(db.Float, nullable=False)
    analysis = db.relationship("AnalysisRun", back_populates="detections")

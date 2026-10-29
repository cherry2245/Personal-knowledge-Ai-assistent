import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application configuration using environment variables."""
    
    # Flask
    FLASK_APP: str = os.getenv("FLASK_APP", "run.py")
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Server
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "5000"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///crimevision.db")
    
    # Storage
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "storage/uploads")
    EVIDENCE_FOLDER: str = os.getenv("EVIDENCE_FOLDER", "storage/evidence")
    REPORTS_FOLDER: str = os.getenv("REPORTS_FOLDER", "storage/reports")
    THUMBNAILS_FOLDER: str = os.getenv("THUMBNAILS_FOLDER", "storage/thumbnails")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", str(500 * 1024 * 1024)))  # 500MB
    
    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    
    # Gemini multimodal AI. The key is read by the backend only and is never
    # returned to the frontend or written to application logs.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    # Object Detection
    DETECTION_MODEL: str = os.getenv("DETECTION_MODEL", "facebook/detr-resnet-50")
    DETECTION_CONFIDENCE_THRESHOLD: float = float(os.getenv("DETECTION_CONFIDENCE_THRESHOLD", "0.5"))
    
    # Audio Transcription
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "auto")
    
    # Image Captioning
    CAPTIONING_MODEL: str = os.getenv("CAPTIONING_MODEL", "Salesforce/blip-image-captioning-base")
    
    # Video Processing
    VIDEO_FRAME_SAMPLE_INTERVAL: int = int(os.getenv("VIDEO_FRAME_SAMPLE_INTERVAL", "30"))  # Sample every 30 frames
    MAX_VIDEO_DURATION: int = int(os.getenv("MAX_VIDEO_DURATION", "3600"))  # 1 hour in seconds
    
    # Job Processing
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))


settings = Settings()

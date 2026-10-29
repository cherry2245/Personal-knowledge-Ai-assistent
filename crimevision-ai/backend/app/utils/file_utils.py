import hashlib
import uuid

MEDIA_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'},
    'video': {'mp4', 'avi', 'mov', 'mkv', 'webm'},
    'audio': {'wav', 'mp3', 'm4a', 'flac', 'ogg', 'aac'},
}

def media_type_for(filename):
    if '.' not in filename:
        return None
    extension = filename.rsplit('.', 1)[1].lower()
    return next((kind for kind, extensions in MEDIA_EXTENSIONS.items() if extension in extensions), None)


def allowed_file(filename):
    return media_type_for(filename) is not None

def calculate_file_hash(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for byte_block in iter(lambda: f.read(4096), b''):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def generate_internal_filename(original_filename):
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    return f'{uuid.uuid4()}.{ext}' if ext else str(uuid.uuid4())

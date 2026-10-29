"""Object detection adapter.

No detector is bundled with the prototype. Returning invented boxes would be
misleading in a forensic workflow, so this adapter fails explicitly until a
validated model is configured.
"""


class DetectionService:
    def __init__(self):
        self.model_loaded = False
        self.model_name = 'unconfigured'

    def detect_objects(self, image_path, confidence_threshold=0.5):
        del image_path, confidence_threshold
        return [], 'Object detection is not configured. Add and validate a detector before analyzing evidence.'

    def annotate_image(self, image_path, detections, output_path):
        del image_path, detections, output_path
        return False, 'Object detection is not configured; no annotated image was created.'


detection_service = DetectionService()

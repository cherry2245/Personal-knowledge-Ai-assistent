"""Streamlit Community Cloud demo for CrimeVision AI.

It reuses the existing Flask API and keeps Gemini credentials in Streamlit
Secrets (cloud) or backend/.env (local). Evidence uploaded to a hosted demo is
stored only in that app's ephemeral local filesystem.
"""
import os
import sys
from io import BytesIO
from pathlib import Path
from tempfile import mkdtemp
from uuid import uuid4

import streamlit as st


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / 'backend'
sys.path.insert(0, str(BACKEND))

try:
    cloud_key = st.secrets.get('GEMINI_API_KEY', '')
except Exception:
    cloud_key = ''
if cloud_key:
    os.environ['GEMINI_API_KEY'] = str(cloud_key)
try:
    cloud_model = st.secrets.get('GEMINI_MODEL', '')
except Exception:
    cloud_model = ''
if cloud_model:
    os.environ['GEMINI_MODEL'] = str(cloud_model)

from run import create_app  # noqa: E402

st.set_page_config(page_title='CrimeVision AI', page_icon='🔎', layout='wide')

@st.cache_resource
def get_flask_app(workspace_path):
    workspace = Path(workspace_path)
    storage = workspace / 'storage'
    return create_app({
        'SQLALCHEMY_DATABASE_URI': f"sqlite:///{(workspace / 'crimevision.db').as_posix()}",
        'UPLOAD_FOLDER': str(storage / 'uploads'),
        'EVIDENCE_FOLDER': str(storage / 'evidence'),
        'REPORTS_FOLDER': str(storage / 'reports'),
        'THUMBNAILS_FOLDER': str(storage / 'thumbnails'),
    })


if 'cv_workspace' not in st.session_state:
    st.session_state.cv_workspace = mkdtemp(prefix=f'crimevision-{uuid4().hex[:8]}-')
flask_app = get_flask_app(st.session_state.cv_workspace)
API = '/api/v1'


def call_api(method, path, **kwargs):
    with flask_app.test_client() as client:
        response = getattr(client, method)(f'{API}{path}', **kwargs)
        payload = response.get_json(silent=True)
        if not response.is_json and response.status_code >= 400:
            raise RuntimeError(f'Request failed (HTTP {response.status_code}).')
        if response.status_code >= 400:
            message = (payload or {}).get('error', f'Request failed (HTTP {response.status_code}).')
            raise RuntimeError(message)
        return payload if payload is not None else response.data


def load_evidence():
    data = call_api('get', '/evidence/?per_page=100')
    return data.get('evidence', [])


def show_ai_result(result):
    st.success(f"Review complete · {result.get('model_identifier', 'Gemini')}")
    details = result.get('result') or {}
    if details.get('summary'):
        st.markdown('#### Summary')
        st.write(details['summary'])
    if details.get('transcript'):
        st.markdown('#### Transcript')
        st.text_area('Recognized speech', details['transcript'], height=220, disabled=True)
    observations = details.get('observations') or []
    if observations:
        st.markdown('#### Visual observations')
        for item in observations:
            st.markdown(f'- {item}')
    events = details.get('events') or []
    if events:
        st.markdown('#### Video segments · approximate timestamps')
        for event in events:
            st.markdown(f"**{event.get('timestamp', 'Time unavailable')}** — {event.get('description', '')}")
    limitations = details.get('limitations') or []
    if limitations:
        st.warning('Limitations: ' + ' · '.join(limitations))
    st.caption(details.get('disclaimer', 'AI-generated preliminary observations; verify against the original evidence.'))


st.markdown('''
<style>
.block-container {padding-top: 2rem; padding-bottom: 3rem; max-width: 1280px;}
[data-testid="stMetric"] {background: #101827; border: 1px solid #263348; padding: 1rem; border-radius: 12px;}
</style>
''', unsafe_allow_html=True)

st.title('🔎 CrimeVision AI')
st.caption('Evidence intake and multimodal forensic decision support')
st.info('Prototype only. AI output is preliminary, may be wrong, and is not a finding of fact. Verify every claim against the original evidence.', icon='⚠️')

with st.sidebar:
    st.header('Workspace')
    page = st.radio('Navigate', ['Overview', 'Evidence vault', 'Image review', 'Audio transcription', 'Video review', 'Forensic timeline', 'Investigation assistant', 'Reports'], label_visibility='collapsed')
    if os.environ.get('GEMINI_API_KEY'):
        st.success('Gemini key configured')
    else:
        st.warning('Gemini key not set. Configure GEMINI_API_KEY in Streamlit app Secrets (cloud) or backend/.env (local).')

try:
    evidence = load_evidence()
except Exception as error:
    evidence = []
    st.error(f'Could not load the evidence store: {error}')

if page == 'Overview':
    st.subheader('Workspace summary')
    media_counts = {kind: sum(item.get('media_type') == kind for item in evidence) for kind in ('image', 'video', 'audio')}
    metrics = st.columns(4)
    metrics[0].metric('Total evidence', len(evidence))
    metrics[1].metric('Images', media_counts['image'])
    metrics[2].metric('Videos', media_counts['video'])
    metrics[3].metric('Audio', media_counts['audio'])
    st.markdown('#### Recently added')
    for item in evidence[:8]:
        st.write(f"**{item['original_filename']}** · {item['media_type']} · {item['processing_status']}")
    if not evidence:
        st.write('No evidence in this workspace yet. Use Evidence vault to add a file.')

elif page == 'Evidence vault':
    st.subheader('Evidence vault')
    uploaded = st.file_uploader('Add image, audio, or video evidence', type=['jpg','jpeg','png','gif','bmp','webp','mp4','avi','mov','mkv','webm','wav','mp3','m4a','flac','ogg','aac'])
    if uploaded and st.button('Store evidence', type='primary'):
        try:
            with st.spinner('Hashing and saving file…'):
                call_api('post', '/evidence/upload', data={'file': (BytesIO(uploaded.getvalue()), uploaded.name, uploaded.type or 'application/octet-stream')}, content_type='multipart/form-data')
            st.success('Evidence stored and hashed.')
            st.rerun()
        except Exception as error:
            st.error(str(error))
    st.markdown('#### Stored files')
    if evidence:
        st.dataframe([{
            'Filename': item['original_filename'], 'Type': item['media_type'],
            'Size (bytes)': item['file_size'], 'SHA-256': item.get('file_hash', ''),
            'Received': item['upload_timestamp'], 'Status': item['processing_status'],
        } for item in evidence], use_container_width=True, hide_index=True)
    else:
        st.write('No evidence uploaded yet.')

elif page in ('Image review', 'Audio transcription', 'Video review'):
    media_type = {'Image review': 'image', 'Audio transcription': 'audio', 'Video review': 'video'}[page]
    matching = [item for item in evidence if item['media_type'] == media_type]
    st.subheader(page)
    st.caption('When you start a review, the selected media is sent to Google Gemini. Confirm you are authorized to share it.')
    if not matching:
        st.write(f'Upload {media_type} evidence in the Evidence vault to begin.')
    else:
        choices = {f"{item['original_filename']} · {item['id'][:8]}": item for item in matching}
        selection = st.selectbox('Choose evidence', list(choices))
        selected = choices[selection]
        try:
            media = call_api('get', f"/evidence/{selected['id']}/file")
            if media_type == 'image':
                st.image(media, caption=selected['original_filename'], use_container_width=True)
            elif media_type == 'video':
                st.video(media)
            else:
                st.audio(media)
        except Exception as error:
            st.error(f'Preview unavailable: {error}')
        if st.button('Run Gemini review', type='primary'):
            try:
                with st.spinner('Gemini is reviewing the evidence… this can take several minutes for large media.'):
                    result = call_api('post', f"/analysis/{media_type}/{selected['id']}")
                st.session_state[f"result_{selected['id']}"] = result
            except Exception as error:
                st.error(str(error))
        saved_result = st.session_state.get(f"result_{selected['id']}")
        if saved_result:
            show_ai_result(saved_result)
    if media_type == 'video':
        st.caption('Video segment times are approximate. The demo does not provide continuous object tracking or verified frame-by-frame annotations.')

elif page == 'Forensic timeline':
    st.subheader('Forensic timeline')
    try:
        events = call_api('get', '/timeline').get('events', [])
        for event in events:
            label = 'AI generated' if event.get('source') == 'ai_generated' else 'Recorded'
            title = event.get('title', 'Evidence activity')
            if event.get('media_timestamp'):
                title += f" · media time {event['media_timestamp']} (approx.)"
            with st.expander(f"{event['timestamp']} · {title} · {label}"):
                st.write(event.get('description', ''))
    except Exception as error:
        st.error(str(error))

elif page == 'Investigation assistant':
    st.subheader('Evidence-grounded assistant')
    st.caption('Questions use evidence metadata and saved analysis results. The assistant does not receive original files in chat.')
    selected = st.multiselect('Choose evidence context', [item['id'] for item in evidence], format_func=lambda item_id: next((item['original_filename'] for item in evidence if item['id'] == item_id), item_id), default=[item['id'] for item in evidence[:25]])
    question = st.text_area('Question', max_chars=4000, placeholder='What does the saved review say about…')
    if st.button('Ask Gemini', type='primary', disabled=not bool(question.strip() and selected)):
        try:
            with st.spinner('Checking the selected evidence context…'):
                answer = call_api('post', '/chat/ask', json={'message': question, 'evidence_ids': selected})
            st.markdown(answer['answer'])
            st.caption(answer['disclaimer'])
            st.caption('Context evidence: ' + ', '.join(item[:8] for item in answer['source_evidence']))
        except Exception as error:
            st.error(str(error))

elif page == 'Reports':
    st.subheader('Evidence inventory export')
    if evidence:
        import csv
        import io
        buffer = io.StringIO()
        fields = ['id', 'original_filename', 'media_type', 'file_size', 'file_hash', 'upload_timestamp', 'processing_status']
        writer = csv.DictWriter(buffer, fieldnames=fields, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(evidence)
        st.download_button('Download inventory CSV', buffer.getvalue(), 'crimevision-evidence-inventory.csv', 'text/csv')
    else:
        st.write('Upload evidence before exporting an inventory.')
    st.caption('CSV inventory only. PDF forensic reports and analysis summaries are not implemented in this demo.')

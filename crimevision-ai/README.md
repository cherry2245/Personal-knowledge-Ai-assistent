# CrimeVision AI

Local evidence intake and decision-support prototype

CrimeVision AI is a local prototype for evidence intake and forensic decision-support workflows. The implemented core securely catalogues image, video, and audio files, records SHA-256 hashes, previews stored evidence, and exports an inventory. Analysis interfaces are clearly marked when their required validated services are not configured.

## ⚠️ Important Disclaimer

**This is a prototype for investigative decision support. Model outputs are preliminary analytical findings, not established facts.**

- Never automatically declare a person guilty or identify a suspect solely from visual appearance
- Distinguish observed evidence from model-generated interpretations and hypotheses
- Never fabricate evidence, timestamps, quotations, confidence scores, or citations
- Record uncertainty and conflicting evidence explicitly
- Keep human investigators responsible for conclusions and decisions
- This system must be validated before operational forensic use

## Technology Stack

### Backend
- Python 3.9+
- Flask (REST API)
- SQLAlchemy (Database)
- SQLite (Local development)
- SHA-256 file integrity tracking
- SQLite local development database

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (Icons)
- React Router (Navigation)
- Fetch API (backend communication)

## Project Structure

```
crimevision-ai/
├── backend/
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── ai/             # AI model adapters
│   │   └── utils/          # Utilities
│   ├── storage/            # Evidence and reports
│   ├── tests/              # Automated tests
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # Documentation
├── .gitignore
└── README.md
```

## Setup Instructions (Windows)

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- PowerShell

### Backend Setup

1. Navigate to the backend directory:
```powershell
cd backend
```

2. Create a Python virtual environment:
```powershell
python -m venv .venv
```

3. Activate the virtual environment:
```powershell
.venv\Scripts\Activate.ps1
```

**Note:** If you encounter a PowerShell execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Then try activation again.

4. Upgrade pip:
```powershell
python -m pip install --upgrade pip
```

5. Install dependencies:
```powershell
pip install -r requirements.txt
```

6. Create environment configuration:
```powershell
Copy .env.example .env
```

7. Add your Google Gemini API key to `.env` to enable image, audio, video review, and grounded assistant questions:
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.8-flash
```
The key stays on the backend. Selected media is sent to Google Gemini only when an investigator starts a review.

8. Start the backend server:
```powershell
python run.py
```

The backend will start on `http://127.0.0.1:5000`

### Frontend Setup

1. Open a new PowerShell terminal and navigate to the frontend directory:
```powershell
cd frontend
```

2. Install dependencies:
```powershell
npm.cmd install
```

3. Create environment configuration:
```powershell
Copy .env.example .env
```

4. Start the development server:
```powershell
npm.cmd run dev
```

The frontend will start on `http://localhost:5173`

## Streamlit Demo

This repository includes a Python Streamlit demo (`streamlit_app.py`) that reuses the Flask evidence and analysis services. The React/Vite interface remains available separately. Streamlit Community Cloud requires a GitHub repository and a root-level dependency file; this repository provides `requirements.txt` for the demo.

Run the demo locally from the repository root:
```powershell
python -m pip install -r requirements.txt
python -m streamlit run streamlit_app.py
```

To publish it on Streamlit Community Cloud:
1. Push this repository to GitHub.
2. Sign in at [share.streamlit.io](https://share.streamlit.io) with GitHub and choose **Create app**.
3. Select this repository, branch `main`, and entrypoint `streamlit_app.py`.
4. Add `GEMINI_API_KEY` under the app's **Secrets** settings only if you want hosted Gemini analysis enabled. Never commit the key to GitHub.

The hosted demo stores evidence in its app filesystem, which is temporary. Do not use it as a production evidence repository.

### Verify Installation

1. Check backend health:
```powershell
curl http://127.0.0.1:5000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "CrimeVision AI Backend",
  "version": "0.1.0",
  "environment": "development"
}
```

2. Open your browser and navigate to `http://localhost:5173` to see the frontend dashboard.

## Features

### Overview Dashboard
- Evidence statistics
- Recent activity
- Quick actions

### Evidence Vault
- Upload images, videos, and audio
- File validation and hashing
- Evidence metadata management

### Image Analysis
- Image preview from the evidence vault
- Gemini visual review with observations and limitations; no bounding-box detection or person identification

### Video Analysis
- Video evidence intake and integrity tracking
- Gemini video event review with approximate media timestamps; continuous tracking is not implemented

### Audio Analysis
- Audio evidence intake and integrity tracking
- Gemini audio transcription and summary

### Forensic Timeline
- Chronological evidence intake and completed analysis events
- Video segment times are model estimates, not exact forensic timestamps

### AI Investigation Assistant
- Questions are grounded in selected evidence metadata and saved AI review results
- Conversation history lasts only for the browser session

### 3D Scene Viewer
- Placeholder with requirements described; no scene reconstruction is implemented

### Reports
- CSV export of the evidence inventory, including file hashes
- PDF report generation is not implemented

## API Endpoints

### Health
- `GET /api/v1/health` - Backend health check
- `GET /api/v1/capabilities` - System capabilities

### Evidence and image analysis
- `POST /api/v1/evidence/upload` - Upload image, video, or audio evidence
- `GET /api/v1/evidence` - List evidence (supports `page` and `per_page`)
- `GET /api/v1/evidence/{id}` - Get evidence metadata
- `GET /api/v1/evidence/{id}/file` - Preview or retrieve the stored file
- `DELETE /api/v1/evidence/{id}` - Delete evidence and its analysis history
- `POST /api/v1/analysis/image/{id}` - Review an image with Gemini
- `POST /api/v1/analysis/audio/{id}` - Transcribe and summarize audio with Gemini
- `POST /api/v1/analysis/video/{id}` - Summarize a video and return approximate described segments
- `GET /api/v1/analysis/{id}` - Get analysis run details
- `GET /api/v1/timeline` - Retrieve intake and completed analysis events
- `POST /api/v1/chat/ask` - Ask a question grounded in evidence metadata and saved analysis

## Development Milestones

- ✅ Milestone 1: Project Foundation
- ✅ Milestone 2: Gemini multimodal image/audio/video review
- ✅ Milestone 3: Evidence-grounded assistant and analysis timeline
- ⏳ Milestone 4: Validated object detection and continuous video tracking
- ⏳ Milestone 5: Persistent chat, PDF reporting, and scene visualization
- ⏳ Milestone 7: Authentication, validation, and deployment hardening

## Troubleshooting

### PowerShell Virtual Environment Activation
If activation fails with execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.venv\Scripts\Activate.ps1
```

Or use the Python executable directly:
```powershell
.venv\Scripts\python.exe run.py
```

### Port Already in Use
If port 5000 or 5173 is in use, change the port in:
- Backend: `backend/.env` (PORT variable)
- Frontend: `frontend/vite.config.ts` (server.port)

### Gemini analysis reports an error
Confirm `GEMINI_API_KEY` is set in `backend/.env`, restart the backend, and check Google AI Studio for API access and quota. Gemini outputs are advisory; video segment timestamps are approximate, and continuous object tracking is not provided.

## Security Considerations

- Never commit `.env` files or real API keys
- Validate all uploaded files
- Store evidence outside public directories
- Implement authentication before production use
- Treat all uploaded evidence as untrusted input
- Log analysis operations for audit trails

## License

This project is provided as a prototype for forensic analysis research and development.

## Support

For issues, questions, or contributions, please refer to the project documentation in the `docs/` directory.

# SahayAI

## Overview

SahayAI is an AI-assisted grievance platform that helps citizens submit issues and enables administrators to triage, analyze, and resolve them efficiently. It supports multilingual input, AI guidance for routing, automated spam filtering, and data-driven insights for administrators.

## Features

### Client capabilities
- Multilingual filing: users can submit grievances in Hindi which are standardized into clear English.
- AI helper: a chatbot guides people to the most relevant department and steps to take.
- Spam screening: incoming text is checked to reduce noise before it reaches the database.
- Status lookup: users can view the latest state of their submissions.

### Admin capabilities
- Performance insights: dashboards summarize volumes, states, and outcomes.
- Case workflow: items are grouped by their progress in the pipeline.
- AI support for responses: admins may review AI‑proposed actions and close cases accordingly.
- Document assistance: admins can upload a PDF and ask questions to extract key details (optional service).
- Updates and reports: send status updates and download a consolidated PDF report for a case.

## Tech Stack
- Frontend: React
- Backend: Express, FastAPI
- Database: MongoDB
- AI & NLP:
  - Gemini (text analysis and guidance)
  - AssemblyAI (speech‑to‑text for multilingual input)
- Cloud & Infrastructure: AWS

## Run the project locally

The project has four parts:
- Node.js API (Express) at `backend/`
- Citizen web app at `client/`
- Admin web app at `admin/`
- Python services at `scripts/` (FastAPI spam detector on port 8000, optional PDF‑QA service expected on port 8001)

### Prerequisites
- Node.js LTS and npm
- Python 3.10+ with pip
- A local MongoDB instance or a hosted MongoDB connection string
- API keys (optional but recommended):
  - AssemblyAI (client speech‑to‑text)
  - Google Generative Language API (Gemini, used in the client chatbot and admin reports)

### Environment variables

Create the following files:

- `backend/.env`
  - `MONGO_URI=mongodb://localhost:27017/sahayai`
  - `PORT=5000` (optional)

- `client/.env`
  - `VITE_ASSEMBLY_API_KEY=your_assemblyai_key`
  - `VITE_GEMINI_API_KEY=your_gemini_key`

- `admin/.env`
  - `VITE_GEMINI_API_KEY=your_gemini_key`

### Python dependencies

Install the Python requirements for the spam detector and optional models:

```powershell
# from the scripts/ folder
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Models used by the services are already included in `scripts/` (e.g., `model.pkl`, `vectorizer.pkl`, `label_encoder.pkl`).

### 1) Start the Node.js API (Express)

```powershell
# in backend/
npm install
npm run dev
```

The API defaults to port 5000 and expects `MONGO_URI` to be set.

### 2) Start the Spam Detection service (FastAPI, port 8000)

This powers the client‑side spam check at `http://localhost:8000/predict`.

```powershell
# in scripts/
.\.venv\Scripts\Activate.ps1
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3) (Optional) Start the PDF Q&A service (port 8001)

The admin’s AI PDF Analyzer expects an HTTP API at `http://127.0.0.1:8001` with endpoints `/init_rag` and `/ask_question`. This implementation isn’t included in this repo; you may plug in your own service that follows that contract.

### 4) Run the client (citizen app)

```powershell
# in client/
npm install
npm run dev
```

Vite serves the client on port 5173 by default.

### 5) Run the admin app

Run the admin app on a different port (the backend allows 5173 and 5174 by default):

```powershell
# in admin/
npm install
npx vite --port 5174
```

### Service matrix and ports
- Backend (Express): http://localhost:5000
- Spam Detection (FastAPI): http://127.0.0.1:8000
- Admin AI PDF Analyzer (optional): http://127.0.0.1:8001
- Client (Vite): http://localhost:5173
- Admin (Vite): http://localhost:5174

### Notes and tips
- If cookies don’t appear in the browser during local HTTP, the client also stores the token via JavaScript for navigation.
- The Python service `fastapi_app.py` references an XGBoost model file named `grievance_classifier.json`. The repository contains `grievance_classifier.pkl` instead. That service is not wired into the UI by default; use the spam service (`main.py`) which the UI calls, or adapt `fastapi_app.py` to your model file if you plan to use it.

## Contributing

Pull requests are welcome. Please include a summary of changes and any setup steps if they affect local development.



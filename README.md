# RedVector

An AI-security red-teaming framework that systematically probes LLM-based agents and models against adversarial attacks.

## Overview

RedVector runs **red-teaming campaigns** against target LLMs using curated adversarial payloads across multiple attack categories. Each campaign fires payloads at the target model, evaluates responses using a multi-signal evaluator, and produces a categorized vulnerability report via a web dashboard.

### Attack Categories

| Category | Description |
|---|---|
| **Prompt Injection** | Directs the model to ignore instructions and leak a marker string |
| **Jailbreak** | Role-play, hypothetical, fiction-wrapping, encoding — attempts to bypass safeguards |
| **RAG Poisoning** | Instruction hijacking and misinformation injection via RAG-style context |

### Evaluation Pipeline

1. **Attack Generation** — Modules load YAML payloads with adversarial prompts and target markers.
2. **Target Probing** — Each payload is sent to the target LLM via LiteLLM.
3. **Multi-Signal Evaluation** — Every response is scored on three axes:
   - Attack module's own verdict (marker/pattern detection)
   - Local evaluator (embedding similarity + refusal keyword matching)
   - LLM-as-Judge (optional — asks a judge model if the injection was actually followed)

Results are persisted to SQLite and surfaced in the React dashboard.

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, LiteLLM, SQLite |
| Frontend | React 19, Vite, Recharts |
| Embeddings | sentence-transformers (local, CPU) |
| LLM Providers | Groq, Gemini, OpenAI, Anthropic, Ollama (configurable) |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entrypoint & routes
│   ├── config.py            # Environment config
│   ├── models.py            # Pydantic schemas
│   ├── orchestrator.py      # Campaign execution engine
│   ├── evaluator.py         # Multi-signal response evaluator
│   ├── llm_client.py        # LiteLLM wrapper
│   ├── db.py                # SQLite storage
│   └── attacks/
│       ├── base.py          # Abstract attack base class
│       ├── prompt_injection.py
│       ├── jailbreak.py
│       └── rag_poisoning.py
├── payloads/                # YAML attack definitions
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── App.jsx              # Root component
│   ├── api.js               # API client
│   └── components/
│       ├── NewCampaignForm.jsx
│       ├── CampaignList.jsx
│       ├── ScoreChart.jsx
│       └── ResultsTable.jsx
├── package.json
└── vite.config.js
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- A free Groq API key (or any supported LLM provider key)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to access the dashboard.

### Running a Campaign

1. Enter a target model name (e.g., `groq/llama-3.1-8b-instant`).
2. Select attack categories to include.
3. Optionally toggle the LLM-Judge for deeper evaluation.
4. Click **Launch Campaign** — results appear in the sidebar and chart.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/campaigns` | Launch a new campaign |
| GET | `/campaigns` | List all campaigns |
| GET | `/campaigns/{id}` | Get campaign details with results |

## Configuration

Key environment variables (see `backend/.env.example`):

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | Groq API key (free tier available) |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `JUDGE_MODEL` | `groq/llama-3.1-8b-instant` | Model used for LLM-as-Judge |
| `USE_JUDGE_DEFAULT` | `true` | Whether to call the judge by default |
| `OLLAMA_API_BASE` | — | Base URL for local Ollama instances |

## License

Not yet licensed.

"""
Centralized config loading. Reads a .env file (if present) once, at import
time — every other module just imports the constants below or reads
os.environ directly, without needing to think about *when* .env gets loaded.
"""

import os
from dotenv import load_dotenv

load_dotenv(override=True)

JUDGE_MODEL = os.getenv("JUDGE_MODEL", "groq/openai/gpt-oss-20b")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
USE_JUDGE_DEFAULT = os.getenv("USE_JUDGE_DEFAULT", "true").lower() == "true"

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]
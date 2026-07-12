"""
Centralized config loading. Reads a .env file (if present) once, at import
time — every other module just imports the constants below or reads
os.environ directly, without needing to think about *when* .env gets loaded.
"""

import os
from dotenv import load_dotenv

load_dotenv()

JUDGE_MODEL = os.getenv("JUDGE_MODEL", "groq/llama-3.1-8b-instant")
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
USE_JUDGE_DEFAULT = os.getenv("USE_JUDGE_DEFAULT", "true").lower() == "true"
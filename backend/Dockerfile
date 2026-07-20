FROM python:3.12-slim

WORKDIR /app

# System deps for sentence-transformers/torch wheels to install cleanly
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Non-root user — good practice regardless of platform, and required by some.
RUN useradd -m -u 1000 redvector && chown -R redvector:redvector /app
USER redvector

ENV PORT=8000
EXPOSE $PORT

# Shell form so ${PORT} gets substituted at container start — this is what
# lets the same image work whether the platform injects PORT=10000 (Render),
# PORT=8080 (Cloud Run), or nothing at all (local docker run, falls back to 8000).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
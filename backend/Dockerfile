# AgentProbe backend — built for Hugging Face Spaces' Docker SDK, but runs
# anywhere Docker does (Railway, Render, Fly.io, your own VPS, etc).

FROM python:3.12-slim

WORKDIR /app

# System deps for sentence-transformers/torch wheels to install cleanly
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# HF Spaces builds/runs containers as a non-root user; this mirrors that
# locally too so file permissions behave the same in both places.
RUN useradd -m -u 1000 agentprobe && chown -R agentprobe:agentprobe /app
USER agentprobe

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
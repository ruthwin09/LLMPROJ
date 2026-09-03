FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run sets PORT env var; default to 8000 for local use
ENV PORT=8000

EXPOSE $PORT

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT

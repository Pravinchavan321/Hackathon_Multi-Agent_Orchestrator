FROM python:3.10-slim

WORKDIR /app

# Install system build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend codebase
COPY backend/ ./backend

# Environment configuration
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8080 \
    HOST=0.0.0.0

EXPOSE 8080

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]

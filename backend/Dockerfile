FROM python:3.11-slim

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends nmap && rm -rf /var/lib/apt/lists/*
COPY app/ ./app/
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy psycopg2-binary python-multipart python-nmap

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
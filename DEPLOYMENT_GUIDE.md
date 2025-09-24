# DiscoverIT Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Production Deployment](#production-deployment)
5. [Docker Configuration](#docker-configuration)
6. [Database Setup](#database-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB free space
- Network: Internet connectivity

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- Network: Gigabit connection

### Software Requirements

**Required Software:**
- Docker 24.0+
- Docker Compose 2.20+
- Git 2.40+
- OpenSSL (for SSL certificates)

**Operating Systems:**
- Ubuntu 20.04+ (recommended)
- CentOS 8+
- RHEL 8+
- Windows Server 2019+ (with WSL2)
- macOS 12+ (for development)

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/discoverit.git
cd discoverit
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Start Services
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 4. Initialize Database
```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create default admin user (optional)
docker-compose exec backend python -c "
from app.services.auth_service import AuthService
from app.database import SessionLocal
db = SessionLocal()
auth = AuthService(db)
auth.create_default_admin()
db.close()
"
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Default Login**: admin / admin

---

## Environment Configuration

### Environment Variables

**Backend Configuration (.env):**
```bash
# Database
DATABASE_URL=postgresql://discoverit:DiscoverIT4DB@postgres:5432/discoverit

# Security
SECRET_KEY=your-secure-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://frontend:5173

# Logging
LOG_LEVEL=INFO
SQL_DEBUG=false

# Scanner Configuration
DEFAULT_SCANNER_URL=http://scanner:8001
SCAN_TIMEOUT=300
MAX_CONCURRENT_SCANS=5
MAX_DISCOVERY_DEPTH=3

# Default Networks
DEFAULT_SUBNETS=172.18.0.0/16,172.17.0.0/16,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12
```

**Frontend Configuration:**
```bash
# API Base URL
VITE_API_BASE=http://localhost:8000/api/v2

# Environment
VITE_NODE_ENV=development
```

### Configuration Files

**Docker Compose Override:**
```yaml
# docker-compose.override.yml
version: '3.8'

services:
  backend:
    environment:
      - LOG_LEVEL=DEBUG
      - SQL_DEBUG=true
    volumes:
      - ./logs:/app/logs

  frontend:
    environment:
      - VITE_API_BASE=http://localhost:8000/api/v2
```

---

## Production Deployment

### 1. Production Environment Setup

**Create Production Environment:**
```bash
# Create production directory
mkdir -p /opt/discoverit
cd /opt/discoverit

# Clone repository
git clone https://github.com/your-org/discoverit.git .

# Create production environment
cp .env.example .env.production
```

**Production Environment Variables:**
```bash
# Database (use external PostgreSQL)
DATABASE_URL=postgresql://user:password@prod-db:5432/discoverit

# Security (generate secure keys)
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (production domains)
ALLOWED_ORIGINS=https://discoverit.yourdomain.com

# Logging
LOG_LEVEL=WARNING
SQL_DEBUG=false

# Production settings
NODE_ENV=production
```

### 2. SSL/TLS Configuration

**Generate SSL Certificates:**
```bash
# Create certificates directory
mkdir -p /opt/discoverit/certs

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/discoverit/certs/private.key \
  -out /opt/discoverit/certs/certificate.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=discoverit.yourdomain.com"

# Or use Let's Encrypt (recommended for production)
certbot certonly --standalone -d discoverit.yourdomain.com
```

**Nginx SSL Configuration:**
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name discoverit.yourdomain.com;

    ssl_certificate /etc/ssl/certs/certificate.crt;
    ssl_certificate_key /etc/ssl/private/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Production Docker Compose

**Production docker-compose.yml:**
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: discoverit
      POSTGRES_USER: discoverit
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U discoverit"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://discoverit:${POSTGRES_PASSWORD}@postgres:5432/discoverit
      - SECRET_KEY=${SECRET_KEY}
      - LOG_LEVEL=${LOG_LEVEL}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  frontend:
    build: 
      context: ./frontend
      args:
        - VITE_API_BASE=/api/v2
    restart: unless-stopped

  scanmanager:
    build: ./scanmanager
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - NET_RAW

  scanner:
    build: ./scanner
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - NET_RAW

volumes:
  postgres_data:
```

### 4. Start Production Services

```bash
# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check service health
docker-compose ps
docker-compose logs -f
```

---

## Docker Configuration

### Dockerfile Optimizations

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Multi-stage Builds

**Optimized Backend Build:**
```dockerfile
# Build stage
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Database Setup

### PostgreSQL Configuration

**Production PostgreSQL Settings:**
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

**Database Initialization:**
```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE discoverit;
CREATE USER discoverit WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE discoverit TO discoverit;
\q
EOF

# Run migrations
docker-compose exec backend alembic upgrade head
```

### Database Migrations

**Create New Migration:**
```bash
# Generate migration
docker-compose exec backend alembic revision --autogenerate -m "Add new table"

# Apply migration
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1
```

**Migration Best Practices:**
- Always backup before migrations
- Test migrations on staging first
- Use descriptive migration messages
- Avoid breaking changes in production

---

## SSL/TLS Configuration

### Let's Encrypt Setup

**Install Certbot:**
```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**Obtain Certificate:**
```bash
# Standalone mode
sudo certbot certonly --standalone -d discoverit.yourdomain.com

# Nginx mode
sudo certbot --nginx -d discoverit.yourdomain.com
```

**Auto-renewal:**
```bash
# Add to crontab
sudo crontab -e

# Add this line
0 12 * * * /usr/bin/certbot renew --quiet
```

### SSL Configuration

**Nginx SSL Settings:**
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

---

## Monitoring & Logging

### Application Monitoring

**Health Checks:**
```bash
# Application health
curl -f http://localhost:8000/health

# Database health
docker-compose exec postgres pg_isready -U discoverit

# Service status
docker-compose ps
```

**Log Monitoring:**
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Log rotation
docker-compose exec backend logrotate /etc/logrotate.conf
```

### Performance Monitoring

**Resource Usage:**
```bash
# Container stats
docker stats

# System resources
htop
iostat -x 1
```

**Database Monitoring:**
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('discoverit'));

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## Backup & Recovery

### Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/discoverit/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="discoverit_backup_$DATE.sql"

# Create backup
docker-compose exec -T postgres pg_dump -U discoverit discoverit > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Remove old backups (keep 30 days)
find "$BACKUP_DIR" -name "discoverit_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Restore Database:**
```bash
# Restore from backup
gunzip -c /opt/discoverit/backups/discoverit_backup_20240101_120000.sql.gz | \
docker-compose exec -T postgres psql -U discoverit discoverit
```

### Application Backup

**Full Application Backup:**
```bash
#!/bin/bash
# full_backup.sh

BACKUP_DIR="/opt/discoverit/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="discoverit_full_$DATE.tar.gz"

# Create full backup
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='backups' \
  /opt/discoverit

echo "Full backup completed: $BACKUP_FILE"
```

---

## Troubleshooting

### Common Issues

**Service Won't Start:**
```bash
# Check logs
docker-compose logs service_name

# Check configuration
docker-compose config

# Restart service
docker-compose restart service_name
```

**Database Connection Issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready -U discoverit

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

**Frontend Build Issues:**
```bash
# Clear build cache
docker-compose build --no-cache frontend

# Check build logs
docker-compose logs frontend
```

### Performance Issues

**High Memory Usage:**
```bash
# Check memory usage
docker stats

# Optimize PostgreSQL
docker-compose exec postgres psql -U discoverit -c "
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
SELECT pg_reload_conf();
"
```

**Slow API Responses:**
```bash
# Check backend logs
docker-compose logs backend | grep "ERROR"

# Monitor database queries
docker-compose exec postgres psql -U discoverit -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 5;
"
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Update environment
echo "LOG_LEVEL=DEBUG" >> .env
echo "SQL_DEBUG=true" >> .env

# Restart services
docker-compose restart backend
```

**Access Container Shell:**
```bash
# Backend container
docker-compose exec backend bash

# Database container
docker-compose exec postgres psql -U discoverit discoverit
```

---

## Security Considerations

### Network Security

**Firewall Configuration:**
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# iptables
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP
```

### Container Security

**Security Best Practices:**
- Use non-root users in containers
- Keep base images updated
- Scan images for vulnerabilities
- Use secrets management
- Enable container security scanning

**Docker Security:**
```bash
# Scan images
docker scan discoverit-backend
docker scan discoverit-frontend

# Update base images
docker-compose pull
docker-compose build --no-cache
```

---

## Maintenance

### Regular Maintenance Tasks

**Weekly Tasks:**
- Check service health
- Review logs for errors
- Update security patches
- Monitor disk space

**Monthly Tasks:**
- Update dependencies
- Review performance metrics
- Test backup/restore procedures
- Security audit

**Quarterly Tasks:**
- Full system update
- Performance optimization
- Capacity planning
- Disaster recovery testing

### Update Procedures

**Application Updates:**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head
```

**System Updates:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Restart services
sudo systemctl restart docker
docker-compose up -d
```

---

This deployment guide provides comprehensive instructions for deploying DiscoverIT in various environments, from development to production. Follow the appropriate sections based on your deployment needs and environment requirements.

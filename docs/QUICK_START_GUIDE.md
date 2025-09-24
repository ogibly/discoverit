# DiscoverIT - Quick Start Guide for Developers

## 🚀 What is DiscoverIT?

DiscoverIT is a network device discovery and management platform that helps IT teams:
- **Discover** network devices automatically
- **Manage** assets and device inventory
- **Automate** operations on network devices
- **Track** credentials and access management

## 🏗️ Architecture Overview

```
Frontend (React) ←→ Backend (FastAPI) ←→ Database (PostgreSQL)
     ↓                    ↓                    ↓
  Port 5173           Port 8000           Port 5432
```

**Services:**
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy
- **Database**: PostgreSQL 15
- **Scanner**: Network discovery service
- **Scan Manager**: Scan coordination service

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- Docker & Docker Compose
- Git

### Installation
```bash
# 1. Clone and setup
git clone <repository-url>
cd discoverit
cp .env.example .env

# 2. Start services
docker-compose up -d

# 3. Initialize database
docker-compose exec backend alembic upgrade head

# 4. Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:8000/docs
# Login: admin / admin
```

## 📁 Project Structure

```
DiscoverIT/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── models.py       # Database models
│   │   ├── routes_v2.py    # API endpoints
│   │   ├── services/       # Business logic
│   │   └── schemas.py      # Pydantic models
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # State management
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   └── package.json
├── scanmanager/            # Scan coordination service
├── scanner/                # Network scanner service
└── docker-compose.yml      # Multi-service setup
```

## 🔧 Key Technologies

### Backend Stack
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **Pydantic**: Data validation
- **JWT**: Authentication
- **Alembic**: Database migrations

### Frontend Stack
- **React 18**: UI framework with hooks
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Context API**: State management

## 🗄️ Database Schema (Core Tables)

```sql
-- Main entities
assets (id, name, ip_address, device_type, is_active, ...)
asset_groups (id, name, description, ...)
devices (id, ip_address, mac_address, device_type, ...)
credentials (id, name, credential_type, username, ...)
operations (id, name, operation_type, is_active, ...)
jobs (id, operation_id, status, target_assets, ...)
scan_tasks (id, name, target, status, ...)
users (id, username, email, role_id, ...)
labels (id, name, color, category, ...)

-- Relationships
asset_group_association (asset_id, asset_group_id)
asset_label_association (asset_id, label_id)
```

## 🔌 API Endpoints (Key Routes)

```bash
# Authentication
POST /api/v2/auth/login
GET  /api/v2/auth/me

# Assets
GET    /api/v2/assets
POST   /api/v2/assets
GET    /api/v2/assets/{id}
PUT    /api/v2/assets/{id}
DELETE /api/v2/assets/{id}

# Asset Groups
GET    /api/v2/asset-groups
POST   /api/v2/asset-groups
PUT    /api/v2/asset-groups/{id}
DELETE /api/v2/asset-groups/{id}

# Devices (Discovered)
GET    /api/v2/devices
POST   /api/v2/devices/{id}/convert  # Convert to asset
DELETE /api/v2/devices/{id}

# Credentials
GET    /api/v2/credentials
POST   /api/v2/credentials
PUT    /api/v2/credentials/{id}
DELETE /api/v2/credentials/{id}

# Scanning
POST   /api/v2/scan-tasks           # Start scan
GET    /api/v2/scan-tasks/{id}      # Get scan status
POST   /api/v2/scan-tasks/{id}/cancel

# Operations
GET    /api/v2/operations
POST   /api/v2/operations
POST   /api/v2/operations/{id}/run  # Execute operation
GET    /api/v2/jobs                 # Job status
```

## 🎯 Core Workflows

### 1. Network Discovery
```bash
# 1. Start scan
POST /api/v2/scan-tasks
{
  "name": "Network Scan",
  "target": "192.168.1.0/24",
  "intensity": "standard"
}

# 2. Monitor progress
GET /api/v2/scan-tasks/{id}

# 3. View discovered devices
GET /api/v2/devices?scan_task_id={id}

# 4. Convert to assets
POST /api/v2/devices/{device_id}/convert
```

### 2. Asset Management
```bash
# 1. Create asset
POST /api/v2/assets
{
  "name": "Web Server",
  "ip_address": "192.168.1.100",
  "device_type": "server"
}

# 2. Create asset group
POST /api/v2/asset-groups
{
  "name": "Web Servers",
  "asset_ids": [1, 2, 3]
}

# 3. Apply labels
POST /api/v2/labels
{
  "name": "Production",
  "color": "#ff0000"
}
```

### 3. Operations Automation
```bash
# 1. Create operation
POST /api/v2/operations
{
  "name": "System Update",
  "operation_type": "awx",
  "awx_playbook_id": 123
}

# 2. Run operation
POST /api/v2/operations/{id}/run
{
  "target_assets": [1, 2, 3],
  "credential_id": 1
}

# 3. Monitor job
GET /api/v2/jobs?operation_id={id}
```

## 🔐 Authentication

```python
# Login
POST /api/v2/auth/login
{
  "username": "admin",
  "password": "password"
}

# Response
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}

# Use token
Authorization: Bearer <token>
```

## 🛠️ Development Commands

### Backend
```bash
# Start dev server
uvicorn app.main:app --reload

# Run tests
pytest

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Format code
black app/
isort app/
```

### Frontend
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## 🔧 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://discoverit:DiscoverIT4DB@postgres:5432/discoverit
SECRET_KEY=your-secret-key
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```bash
VITE_API_BASE=http://localhost:8000/api/v2
VITE_NODE_ENV=development
```

## 🐛 Common Issues & Solutions

### Service Won't Start
```bash
# Check logs
docker-compose logs service_name

# Restart service
docker-compose restart service_name

# Rebuild
docker-compose build --no-cache service_name
```

### Database Issues
```bash
# Check database
docker-compose exec postgres pg_isready -U discoverit

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend Build Issues
```bash
# Clear cache
rm -rf frontend/node_modules
docker-compose build frontend
```

## 📝 Code Standards

### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings
- Use Black for formatting

### JavaScript/React (Frontend)
- Use functional components with hooks
- Follow ESLint rules
- Use meaningful variable names
- Implement proper error handling

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
pytest

# With coverage
pytest --cov=app

# Specific test
pytest tests/test_services.py::test_create_asset
```

### Frontend Tests
```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🚀 Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Use production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Enable SSL
# Configure nginx with certificates
# Set up monitoring
```

## 📚 Key Files to Know

### Backend
- `app/main.py` - FastAPI application
- `app/models.py` - Database models
- `app/routes_v2.py` - API endpoints
- `app/services/` - Business logic
- `app/config.py` - Configuration

### Frontend
- `src/App.jsx` - Main application
- `src/components/` - React components
- `src/contexts/` - State management
- `src/hooks/` - Custom hooks
- `src/utils/` - Utilities

## 🔍 Debugging

### Backend
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Use debugger
import pdb; pdb.set_trace()
```

### Frontend
```javascript
// Console debugging
console.log('Debug info:', data);

// React DevTools
// Install browser extension for component inspection
```

## 📞 Getting Help

1. **Check logs**: `docker-compose logs service_name`
2. **API docs**: http://localhost:8000/docs
3. **GitHub issues**: Report bugs and request features
4. **Code comments**: Inline documentation in code
5. **Team chat**: Ask questions in development channels

## 🎯 Next Steps

1. **Explore the codebase**: Start with `app/main.py` and `src/App.jsx`
2. **Run the application**: Follow the quick setup above
3. **Try the API**: Use the interactive docs at `/docs`
4. **Read the code**: Check service files and components
5. **Make a change**: Try adding a simple feature
6. **Ask questions**: Don't hesitate to ask for help

---

**Welcome to DiscoverIT development!** 🚀

This guide gives you everything you need to get started. For detailed information, check the comprehensive documentation files in this `docs/` folder, but this should get you up and running quickly.

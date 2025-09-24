# DiscoverIT - Network Device Discovery and Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18+](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

DiscoverIT is a comprehensive network device discovery and management platform designed for IT professionals, network administrators, and security teams.

## 🚀 Quick Start

**New to DiscoverIT?** Start here:

1. **[Quick Start Guide](docs/QUICK_START_GUIDE.md)** - Get up and running in 5 minutes
2. **[Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)** - Complete technical overview
3. **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

## 📚 Documentation

All documentation is organized in the [`docs/`](docs/) folder:

| Document | Purpose | Best For |
|----------|---------|----------|
| [**Quick Start Guide**](docs/QUICK_START_GUIDE.md) | Developer entry point | New developers |
| [**Technical Documentation**](docs/TECHNICAL_DOCUMENTATION.md) | Complete technical reference | Developers, DevOps, Architects |
| [**API Reference**](docs/API_REFERENCE.md) | Detailed API documentation | API consumers, Frontend developers |
| [**Deployment Guide**](docs/DEPLOYMENT_GUIDE.md) | Production deployment | DevOps, System administrators |
| [**Development Guide**](docs/DEVELOPMENT_GUIDE.md) | Development setup and guidelines | Developers, Contributors |
| [**Documentation Index**](docs/DOCUMENTATION_INDEX.md) | Navigation hub for all docs | Everyone |

## ⚡ Quick Setup

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

## 🏗️ Architecture

```
Frontend (React) ←→ Backend (FastAPI) ←→ Database (PostgreSQL)
     ↓                    ↓                    ↓
  Port 5173           Port 8000           Port 5432
```

## 🛠️ Technology Stack

- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Infrastructure**: Docker + Docker Compose
- **Authentication**: JWT-based with role-based access control

## 🎯 Core Features

- **Network Discovery**: Automated scanning of network subnets
- **Asset Management**: Comprehensive asset inventory with grouping
- **Device Management**: Track and manage discovered network devices
- **Credential Management**: Secure storage and management of credentials
- **Operations Automation**: Run automated operations on assets
- **Real-time Monitoring**: Live scanning progress and device status

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](docs/DEVELOPMENT_GUIDE.md) for:

- Development environment setup
- Code standards and guidelines
- Testing requirements
- Git workflow and pull request process

## 📞 Support

- **Documentation**: Check our comprehensive [documentation](docs/)
- **Issues**: Report bugs and request features on GitHub Issues
- **Security**: Report security issues privately

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**DiscoverIT** - Simplifying network device discovery and management for modern IT environments.

For detailed information, visit our [documentation](docs/) or start with the [Quick Start Guide](docs/QUICK_START_GUIDE.md).

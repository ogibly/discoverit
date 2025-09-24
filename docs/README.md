# DiscoverIT - Network Device Discovery and Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18+](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

DiscoverIT is a comprehensive network device discovery and management platform designed for IT professionals, network administrators, and security teams. It provides automated network scanning, device discovery, asset management, and operational automation capabilities.

## 🚀 Features

### Core Functionality
- **Network Discovery**: Automated scanning of network subnets to discover devices
- **Asset Management**: Comprehensive asset inventory with grouping and labeling
- **Device Management**: Track and manage discovered network devices
- **Credential Management**: Secure storage and management of authentication credentials
- **Operations Automation**: Run automated operations on assets and device groups
- **Real-time Monitoring**: Live scanning progress and device status tracking

### Advanced Features
- **Multi-scanner Support**: Support for multiple scanner instances with load balancing
- **User Management**: Role-based access control and user authentication
- **Modern UI**: Responsive React-based frontend with dark/light theme support
- **RESTful API**: Comprehensive API with OpenAPI documentation
- **Docker Support**: Containerized deployment with Docker Compose
- **Database Migrations**: Automated database schema management

## 🏗️ Architecture

DiscoverIT follows a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
│   Port: 5173    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Scan Manager  │    │   Scanner       │
│   (Reverse      │    │   Port: 8002    │    │   Port: 8001    │
│   Proxy)        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 15+** with SQLAlchemy ORM
- **Alembic** for database migrations
- **Pydantic** for data validation
- **JWT** for authentication

### Frontend
- **React 18+** with modern hooks
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication

### Infrastructure
- **Docker** and **Docker Compose**
- **Nginx** for reverse proxy
- **Git** for version control

## 🚀 Quick Start

### Prerequisites
- Docker 24.0+ and Docker Compose 2.20+
- Git 2.40+
- 4GB+ RAM and 20GB+ free disk space

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/discoverit.git
   cd discoverit
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Default Login**: admin / admin

## 📚 Documentation

### Comprehensive Documentation
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Complete technical overview
- **[API Reference](API_REFERENCE.md)** - Detailed API documentation
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Development setup and guidelines

### Quick Links
- [Architecture Overview](TECHNICAL_DOCUMENTATION.md#architecture--design)
- [API Endpoints](API_REFERENCE.md#api-documentation)
- [Database Schema](TECHNICAL_DOCUMENTATION.md#database-schema)
- [Security Considerations](TECHNICAL_DOCUMENTATION.md#security-considerations)
- [Troubleshooting](DEPLOYMENT_GUIDE.md#troubleshooting)

## 🔧 Configuration

### Environment Variables

**Backend Configuration:**
```bash
DATABASE_URL=postgresql://discoverit:DiscoverIT4DB@postgres:5432/discoverit
SECRET_KEY=your-secure-secret-key
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend Configuration:**
```bash
VITE_API_BASE=http://localhost:8000/api/v2
VITE_NODE_ENV=development
```

### Default Settings
- **Default Subnets**: 172.18.0.0/16, 192.168.0.0/16, 10.0.0.0/8
- **Scan Timeout**: 300 seconds
- **Max Concurrent Scans**: 5
- **Max Discovery Depth**: 3

## 🎯 Usage

### Network Discovery
1. Navigate to the **Discovery** page
2. Enter target subnet (e.g., 192.168.1.0/24)
3. Select scan intensity (light, standard, deep)
4. Start the scan and monitor progress
5. Review discovered devices

### Asset Management
1. Go to **Assets** page
2. Convert discovered devices to managed assets
3. Organize assets into groups
4. Apply labels for categorization
5. Track asset information and status

### Operations Automation
1. Create operations in **Operations** page
2. Define targets (assets or asset groups)
3. Select credentials for authentication
4. Run operations and monitor job status
5. Review operation results

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with token expiration
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Session management and token refresh

### Data Protection
- HTTPS for all communications
- Encrypted credential storage
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Network Security
- Isolated scanner containers
- Limited network privileges
- Secure inter-service communication
- Audit logging for all operations

## 🧪 Testing

### Backend Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_services.py
```

### Frontend Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🚀 Deployment

### Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Enable SSL/TLS
# Configure nginx with SSL certificates
# Set up monitoring and logging
```

For detailed deployment instructions, see the [Deployment Guide](DEPLOYMENT_GUIDE.md).

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](DEVELOPMENT_GUIDE.md) for:

- Development environment setup
- Code standards and guidelines
- Testing requirements
- Git workflow and pull request process
- Security guidelines

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📊 Monitoring & Maintenance

### Health Checks
- Application health endpoint: `/health`
- Database connectivity monitoring
- Service status tracking
- Performance metrics collection

### Logging
- Structured JSON logging
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging
- Error tracking and reporting

### Backup & Recovery
- Automated database backups
- Application state backup
- Disaster recovery procedures
- Data migration tools

## 🐛 Troubleshooting

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
```

**Frontend Build Issues:**
```bash
# Clear build cache
docker-compose build --no-cache frontend

# Check build logs
docker-compose logs frontend
```

For more troubleshooting information, see the [Troubleshooting section](DEPLOYMENT_GUIDE.md#troubleshooting).

## 📈 Performance

### Optimization Features
- Database connection pooling
- Query optimization and indexing
- Frontend code splitting and lazy loading
- Caching strategies
- Resource monitoring

### Scalability
- Horizontal scaling support
- Load balancing capabilities
- Microservices architecture
- Container orchestration ready

## 🔮 Roadmap

### Planned Features
- **Enhanced Discovery**: Advanced network topology mapping
- **Automation Improvements**: Workflow automation engine
- **User Experience**: Mobile application and offline capability
- **Security Enhancements**: Multi-factor authentication and SSO
- **Performance**: GraphQL API and real-time updates

### Technical Improvements
- **Scalability**: Horizontal scaling and load balancing
- **Monitoring**: Advanced APM and infrastructure monitoring
- **Integration**: External tool integrations and webhooks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- React team for the powerful UI library
- PostgreSQL team for the robust database
- Docker team for containerization technology
- All contributors and users of DiscoverIT

## 📞 Support

- **Documentation**: Check our comprehensive documentation
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Security**: Report security issues privately to security@yourdomain.com

## 📊 Project Status

- **Version**: 2.0.0
- **Status**: Active Development
- **Last Updated**: January 2024
- **Maintainer**: Development Team

---

**DiscoverIT** - Simplifying network device discovery and management for modern IT environments.

For more information, visit our [documentation](TECHNICAL_DOCUMENTATION.md) or [API reference](API_REFERENCE.md).

# DiscoverIT - Comprehensive Technical Documentation

## Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture & Design](#architecture--design)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend Documentation](#backend-documentation)
6. [Frontend Documentation](#frontend-documentation)
7. [Database Schema](#database-schema)
8. [API Documentation](#api-documentation)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Development Guidelines](#development-guidelines)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)
13. [Future Enhancements](#future-enhancements)

---

## Application Overview

### What is DiscoverIT?

DiscoverIT is a comprehensive network device discovery and management platform designed for IT professionals, network administrators, and security teams. It provides automated network scanning, device discovery, asset management, and operational automation capabilities.

### Core Features

- **Network Discovery**: Automated scanning of network subnets to discover devices
- **Asset Management**: Comprehensive asset inventory with grouping and labeling
- **Device Management**: Track and manage discovered network devices
- **Credential Management**: Secure storage and management of authentication credentials
- **Operations Automation**: Run automated operations on assets and device groups
- **Real-time Monitoring**: Live scanning progress and device status tracking
- **Multi-scanner Support**: Support for multiple scanner instances with load balancing
- **User Management**: Role-based access control and user authentication

### Target Users

- **Network Administrators**: Manage network infrastructure and devices
- **IT Security Teams**: Monitor network assets and security posture
- **DevOps Engineers**: Automate network operations and device management
- **System Administrators**: Maintain asset inventory and operational procedures

---

## Architecture & Design

### High-Level Architecture

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

### Design Principles

1. **Microservices Architecture**: Separate services for different concerns
2. **Container-First**: All services run in Docker containers
3. **API-First Design**: RESTful APIs with OpenAPI documentation
4. **Responsive UI**: Modern React-based frontend with mobile support
5. **Scalable Backend**: FastAPI with async support and connection pooling
6. **Secure by Default**: Authentication, authorization, and data encryption

### Service Communication

- **Frontend ↔ Backend**: HTTP/HTTPS REST API calls
- **Backend ↔ Database**: SQLAlchemy ORM with connection pooling
- **Backend ↔ Scanner**: HTTP API calls for scan operations
- **Backend ↔ Scan Manager**: HTTP API calls for scan coordination

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Core programming language |
| **FastAPI** | 0.104+ | Web framework and API |
| **SQLAlchemy** | 2.0+ | ORM and database abstraction |
| **PostgreSQL** | 15+ | Primary database |
| **Alembic** | 1.12+ | Database migrations |
| **Pydantic** | 2.4+ | Data validation and settings |
| **Uvicorn** | 0.24+ | ASGI server |
| **JWT** | PyJWT | Authentication tokens |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework |
| **Vite** | 4.4+ | Build tool and dev server |
| **React Router** | 6.15+ | Client-side routing |
| **Axios** | 1.5+ | HTTP client |
| **Tailwind CSS** | 3.3+ | CSS framework |
| **Lucide React** | 0.263+ | Icon library |

### Infrastructure & DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| **Docker** | 24+ | Containerization |
| **Docker Compose** | 2.20+ | Multi-container orchestration |
| **Nginx** | 1.24+ | Reverse proxy and static files |
| **Git** | 2.40+ | Version control |

### Development Tools

| Technology | Purpose |
|------------|---------|
| **ESLint** | JavaScript/React linting |
| **Prettier** | Code formatting |
| **Black** | Python code formatting |
| **isort** | Python import sorting |

---

## Project Structure

```
DiscoverIT/
├── backend/                    # Backend API service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI application entry point
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database connection and session
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routes_v2.py       # API routes
│   │   ├── auth.py            # Authentication logic
│   │   ├── db_utils.py        # Database utilities
│   │   ├── exceptions.py      # Custom exceptions
│   │   ├── utils.py           # Utility functions
│   │   └── services/          # Business logic services
│   │       ├── __init__.py
│   │       ├── base_service.py    # Base service class
│   │       ├── auth_service.py    # Authentication service
│   │       ├── asset_service.py   # Asset management
│   │       ├── credential_service.py # Credential management
│   │       ├── operation_service.py # Operations management
│   │       ├── scan_service.py     # Scanning service
│   │       ├── scan_service_v2.py  # Enhanced scanning
│   │       ├── scanner_service.py  # Scanner management
│   │       ├── awx_service.py      # AWX integration
│   │       └── ldap_service.py     # LDAP integration
│   ├── migrations/            # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── common/        # Reusable components
│   │   │   ├── discovery/     # Discovery-specific components
│   │   │   ├── ui/            # UI component library
│   │   │   └── [other components]
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx            # Main application component
│   │   └── main.jsx           # Application entry point
│   ├── public/                # Static assets
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── scanmanager/               # Scan management service
│   ├── app/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── scanner/                   # Network scanner service
│   ├── app/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml         # Multi-service orchestration
└── README.md
```

---

## Backend Documentation

### Core Architecture

The backend follows a layered architecture pattern:

1. **API Layer** (`routes_v2.py`): HTTP endpoints and request/response handling
2. **Service Layer** (`services/`): Business logic and data processing
3. **Data Layer** (`models.py`): Database models and relationships
4. **Infrastructure Layer** (`database.py`, `config.py`): Configuration and database setup

### Configuration Management

The application uses Pydantic BaseSettings for configuration:

```python
# backend/app/config.py
class Settings(BaseSettings):
    database_url: str = "postgresql://..."
    secret_key: str = "your-secret-key"
    allowed_origins: List[str] = ["http://localhost:5173"]
    # ... other settings
```

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key
- `ALLOWED_ORIGINS`: CORS allowed origins
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `SQL_DEBUG`: Enable SQL query logging

### Database Layer

**Connection Management:**
- SQLAlchemy with connection pooling
- Automatic connection health checks
- Connection recycling every 5 minutes
- Proper session management with dependency injection

**Models:**
- **Asset**: Network devices converted to managed assets
- **AssetGroup**: Collections of assets for organization
- **Credential**: Authentication credentials for devices
- **Device**: Discovered network devices
- **Label**: Categorization system for assets and groups
- **Operation**: Automated operations to run on assets
- **Job**: Individual execution instances of operations
- **ScanTask**: Network scanning operations
- **User**: Application users with role-based access
- **Role**: User roles and permissions
- **Settings**: Application configuration

### Service Layer

**Base Service Pattern:**
All services inherit from `BaseService` which provides:
- CRUD operations (Create, Read, Update, Delete)
- Error handling and logging
- Type safety with generics
- Consistent database session management

**Key Services:**

1. **AuthService**: User authentication and authorization
2. **AssetService**: Asset management and operations
3. **CredentialService**: Credential storage and management
4. **OperationService**: Operation execution and job management
5. **ScanService**: Network scanning coordination
6. **ScannerService**: Scanner instance management

### API Design

**RESTful Endpoints:**
- `GET /api/v2/assets` - List assets
- `POST /api/v2/assets` - Create asset
- `GET /api/v2/assets/{id}` - Get asset details
- `PUT /api/v2/assets/{id}` - Update asset
- `DELETE /api/v2/assets/{id}` - Delete asset

**Authentication:**
- JWT-based authentication
- Role-based access control
- Token expiration and refresh

**Error Handling:**
- Custom exception classes
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

---

## Frontend Documentation

### Architecture Overview

The frontend is built with React 18 using modern patterns:

- **Component-Based Architecture**: Reusable, composable components
- **Context API**: Global state management
- **Custom Hooks**: Reusable logic and side effects
- **Error Boundaries**: Graceful error handling
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Component Structure

**Component Categories:**

1. **UI Components** (`components/ui/`): Basic UI elements
   - Button, Input, Modal, Card, Badge, etc.
   - Consistent styling and behavior
   - Accessibility features

2. **Common Components** (`components/common/`): Reusable business components
   - StandardList: Unified list display component
   - ErrorBoundary: Error handling wrapper
   - LoadingSpinner: Loading state indicator
   - FormModal: Modal form wrapper

3. **Feature Components**: Specific feature implementations
   - AssetsInterface: Asset management interface
   - DevicesInterface: Device management interface
   - CredentialsManager: Credential management
   - Discovery: Network discovery interface

### State Management

**Context-Based State:**
- **AppContext**: Global application state
- **AuthContext**: Authentication state
- **ThemeContext**: UI theme management

**State Structure:**
```javascript
const initialState = {
  // Data
  assets: [],
  devices: [],
  credentials: [],
  
  // UI State
  loading: { assets: false, devices: false },
  error: null,
  modals: { assetManager: false }
};
```

### Custom Hooks

**useApi**: API calls with loading states
```javascript
const { loading, error, get, post } = useApi();
```

**useLocalStorage**: Persistent local storage
```javascript
const [value, setValue] = useLocalStorage('key', defaultValue);
```

**useDebounce**: Debounced values for search
```javascript
const debouncedSearch = useDebounce(searchTerm, 300);
```

**useAsync**: Async operation management
```javascript
const { loading, data, error, execute } = useAsync(asyncFunction);
```

### Routing

**React Router Setup:**
- Protected routes with authentication
- Nested routing for complex layouts
- Route-based code splitting
- History management

**Route Structure:**
- `/` - Dashboard
- `/assets` - Asset management
- `/devices` - Device management
- `/discovery` - Network discovery
- `/credentials` - Credential management
- `/operations` - Operations management
- `/admin` - Admin settings

### Styling

**Tailwind CSS:**
- Utility-first CSS framework
- Custom design system tokens
- Dark/light theme support
- Responsive design patterns

**Design System:**
- Consistent color palette
- Typography scale
- Spacing system
- Component variants

---

## Database Schema

### Core Tables

**Assets Table:**
```sql
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ip_address INET,
    mac_address MACADDR,
    device_type VARCHAR(50),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Asset Groups Table:**
```sql
CREATE TABLE asset_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Credentials Table:**
```sql
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credential_type VARCHAR(50) NOT NULL,
    username VARCHAR(255),
    password TEXT,
    ssh_private_key TEXT,
    domain VARCHAR(255),
    port INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships

**Many-to-Many Relationships:**
- Assets ↔ Asset Groups (via asset_group_association)
- Assets ↔ Labels (via asset_label_association)
- Asset Groups ↔ Labels (via asset_group_label_association)

**One-to-Many Relationships:**
- Users → Assets (created_by)
- Users → Asset Groups (created_by)
- Operations → Jobs (operation_id)
- Scan Tasks → Devices (scan_task_id)

### Indexes

**Performance Indexes:**
- Primary keys (automatic)
- Foreign key columns
- Frequently queried columns (name, ip_address, device_type)
- Composite indexes for complex queries

---

## API Documentation

### Authentication

**Login Endpoint:**
```http
POST /api/v2/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Asset Management

**List Assets:**
```http
GET /api/v2/assets?skip=0&limit=100&is_active=true
Authorization: Bearer <token>
```

**Create Asset:**
```http
POST /api/v2/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Web Server 01",
  "ip_address": "192.168.1.100",
  "device_type": "server",
  "description": "Production web server"
}
```

### Device Discovery

**Start Scan:**
```http
POST /api/v2/scan-tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Network Scan",
  "target": "192.168.1.0/24",
  "intensity": "standard"
}
```

**Get Scan Results:**
```http
GET /api/v2/devices?scan_task_id=123
Authorization: Bearer <token>
```

### Error Responses

**Standard Error Format:**
```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

---

## Deployment & Infrastructure

### Docker Configuration

**Multi-Container Setup:**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: discoverit
      POSTGRES_USER: discoverit
      POSTGRES_PASSWORD: DiscoverIT4DB
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://discoverit:DiscoverIT4DB@postgres:5432/discoverit
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    environment:
      VITE_API_BASE: /api/v2
    depends_on:
      - backend
```

### Environment Configuration

**Development Environment:**
```bash
# Backend
DATABASE_URL=postgresql://discoverit:DiscoverIT4DB@localhost:5432/discoverit
SECRET_KEY=dev-secret-key
LOG_LEVEL=DEBUG
SQL_DEBUG=true

# Frontend
VITE_API_BASE=http://localhost:8000/api/v2
```

**Production Environment:**
```bash
# Backend
DATABASE_URL=postgresql://user:pass@prod-db:5432/discoverit
SECRET_KEY=secure-production-key
LOG_LEVEL=INFO
SQL_DEBUG=false

# Frontend
VITE_API_BASE=/api/v2
```

### Deployment Steps

1. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd DiscoverIT
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and Start:**
   ```bash
   docker-compose up -d
   ```

4. **Database Migration:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Verify Deployment:**
   ```bash
   curl http://localhost:8000/health
   ```

### Monitoring & Logging

**Application Logs:**
- Structured JSON logging
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request/response logging
- Error tracking and reporting

**Health Checks:**
- Database connectivity
- External service availability
- Resource usage monitoring
- Performance metrics

---

## Development Guidelines

### Code Standards

**Backend (Python):**
- Follow PEP 8 style guide
- Use type hints for all functions
- Write comprehensive docstrings
- Implement proper error handling
- Use async/await for I/O operations

**Frontend (React/JavaScript):**
- Use functional components with hooks
- Implement proper prop validation
- Follow React best practices
- Use TypeScript for type safety
- Implement accessibility features

### Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature development
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

**Commit Messages:**
```
type(scope): description

feat(auth): add JWT token refresh
fix(api): resolve database connection issue
docs(readme): update installation instructions
```

### Testing Strategy

**Backend Testing:**
- Unit tests for services and utilities
- Integration tests for API endpoints
- Database migration tests
- Performance and load testing

**Frontend Testing:**
- Component unit tests
- Integration tests for user flows
- End-to-end testing
- Accessibility testing

### Code Review Process

1. **Self Review**: Check your own code before submitting
2. **Peer Review**: At least one other developer reviews
3. **Automated Checks**: CI/CD pipeline runs tests and linting
4. **Documentation**: Update docs for significant changes
5. **Testing**: Ensure all tests pass

---

## Security Considerations

### Authentication & Authorization

**JWT Implementation:**
- Secure token generation with expiration
- Token refresh mechanism
- Proper token storage and transmission
- Role-based access control (RBAC)

**Password Security:**
- Bcrypt hashing with salt
- Password complexity requirements
- Account lockout after failed attempts
- Password reset functionality

### Data Protection

**Encryption:**
- HTTPS for all communications
- Encrypted credential storage
- Database connection encryption
- Sensitive data encryption at rest

**Input Validation:**
- Server-side validation for all inputs
- SQL injection prevention
- XSS protection
- CSRF protection

### Network Security

**Firewall Configuration:**
- Restrict database access
- Limit scanner network access
- Secure inter-service communication
- VPN access for remote administration

**Scanner Security:**
- Isolated scanner containers
- Limited network privileges
- Secure credential handling
- Audit logging for all scans

---

## Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**Backend API Issues:**
```bash
# Check backend logs
docker-compose logs backend

# Test API connectivity
curl http://localhost:8000/health

# Restart backend service
docker-compose restart backend
```

**Frontend Build Issues:**
```bash
# Clear node modules
rm -rf frontend/node_modules
docker-compose build frontend

# Check build logs
docker-compose logs frontend
```

### Performance Issues

**Database Performance:**
- Check query execution plans
- Monitor connection pool usage
- Optimize slow queries
- Add appropriate indexes

**API Performance:**
- Monitor response times
- Check for N+1 query problems
- Implement caching where appropriate
- Use async operations

**Frontend Performance:**
- Bundle size analysis
- Code splitting implementation
- Image optimization
- Lazy loading for large lists

### Debugging Tools

**Backend Debugging:**
- SQLAlchemy query logging
- FastAPI debug mode
- Python debugger (pdb)
- Application performance monitoring

**Frontend Debugging:**
- React Developer Tools
- Browser DevTools
- Network request monitoring
- Console error tracking

---

## Future Enhancements

### Planned Features

**Enhanced Discovery:**
- Advanced network topology mapping
- Service discovery and fingerprinting
- Vulnerability scanning integration
- Asset relationship mapping

**Automation Improvements:**
- Workflow automation engine
- Scheduled operations
- Event-driven automation
- Integration with external tools

**User Experience:**
- Advanced search and filtering
- Customizable dashboards
- Mobile application
- Offline capability

**Security Enhancements:**
- Multi-factor authentication
- Single sign-on (SSO) integration
- Advanced audit logging
- Compliance reporting

### Technical Improvements

**Scalability:**
- Horizontal scaling support
- Load balancing implementation
- Database sharding
- Caching layer addition

**Performance:**
- GraphQL API implementation
- Real-time updates with WebSockets
- Advanced caching strategies
- CDN integration

**Monitoring:**
- Application performance monitoring
- Infrastructure monitoring
- Alerting system
- Metrics and analytics

---

## Conclusion

This documentation provides a comprehensive overview of the DiscoverIT application, covering all aspects from high-level architecture to implementation details. It serves as a foundation for:

- **New Developers**: Understanding the codebase and getting started
- **Maintenance**: Troubleshooting and fixing issues
- **Enhancement**: Adding new features and improvements
- **Deployment**: Setting up and managing the application

For questions or clarifications, please refer to the code comments, API documentation, or contact the development team.

---

**Last Updated**: January 2024
**Version**: 2.0.0
**Maintainer**: Development Team

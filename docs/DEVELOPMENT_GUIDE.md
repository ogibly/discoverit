# DiscoverIT Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Code Standards](#code-standards)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Testing](#testing)
6. [Git Workflow](#git-workflow)
7. [Debugging](#debugging)
8. [Performance Optimization](#performance-optimization)
9. [Security Guidelines](#security-guidelines)
10. [Contributing](#contributing)

---

## Getting Started

### Prerequisites

**Required Software:**
- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Git 2.40+
- VS Code (recommended) or your preferred IDE

**Recommended Extensions (VS Code):**
- Python
- Pylance
- ESLint
- Prettier
- Docker
- GitLens
- REST Client

### Initial Setup

**1. Clone Repository:**
```bash
git clone https://github.com/your-org/discoverit.git
cd discoverit
```

**2. Environment Setup:**
```bash
# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Install dependencies
cd frontend && npm install && cd ..
pip install -r backend/requirements.txt
```

**3. Start Development Services:**
```bash
# Start all services
docker-compose up -d

# Or start individual services
docker-compose up -d postgres
npm run dev  # Frontend
python -m uvicorn backend.app.main:app --reload  # Backend
```

**4. Verify Setup:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Development Environment

### Backend Development

**Project Structure:**
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── routes_v2.py         # API routes
│   ├── services/            # Business logic
│   ├── utils.py             # Utility functions
│   └── exceptions.py        # Custom exceptions
├── migrations/              # Database migrations
├── tests/                   # Test files
└── requirements.txt         # Dependencies
```

**Development Commands:**
```bash
# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest tests/

# Run with coverage
pytest --cov=app tests/

# Format code
black app/
isort app/

# Lint code
flake8 app/
mypy app/

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

**Environment Variables:**
```bash
# Development settings
DATABASE_URL=postgresql://discoverit:DiscoverIT4DB@localhost:5432/discoverit
SECRET_KEY=dev-secret-key
LOG_LEVEL=DEBUG
SQL_DEBUG=true
```

### Frontend Development

**Project Structure:**
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── common/         # Reusable components
│   │   ├── ui/             # UI component library
│   │   └── [features]/     # Feature-specific components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main application
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── tests/                  # Test files
└── package.json            # Dependencies
```

**Development Commands:**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

**Environment Variables:**
```bash
# Development settings
VITE_API_BASE=http://localhost:8000/api/v2
VITE_NODE_ENV=development
```

---

## Code Standards

### Python (Backend)

**Style Guide:**
- Follow PEP 8
- Use Black for formatting
- Use isort for import sorting
- Maximum line length: 88 characters
- Use type hints for all functions

**Code Example:**
```python
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

class AssetCreate(BaseModel):
    """Schema for creating a new asset."""
    name: str
    ip_address: Optional[str] = None
    device_type: str = "other"
    is_active: bool = True

class AssetService:
    """Service for managing assets."""
    
    def __init__(self, db: Session) -> None:
        self.db = db
    
    def create_asset(self, asset_data: AssetCreate, user_id: int) -> Asset:
        """Create a new asset.
        
        Args:
            asset_data: Asset creation data
            user_id: ID of the user creating the asset
            
        Returns:
            Created asset instance
            
        Raises:
            ValidationError: If asset data is invalid
        """
        try:
            asset = Asset(
                **asset_data.dict(),
                created_by=user_id
            )
            self.db.add(asset)
            self.db.commit()
            self.db.refresh(asset)
            return asset
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating asset: {e}")
            raise ValidationError(f"Failed to create asset: {e}")
```

**Import Organization:**
```python
# Standard library imports
import os
from typing import List, Optional
from datetime import datetime

# Third-party imports
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Local imports
from ..database import get_db
from ..models import Asset
from ..schemas import AssetCreate, AssetResponse
from ..services.asset_service import AssetService
from ..exceptions import ValidationError
```

### JavaScript/React (Frontend)

**Style Guide:**
- Use ESLint and Prettier
- Use functional components with hooks
- Use TypeScript for type safety
- Follow React best practices
- Use meaningful variable names

**Component Example:**
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { cn } from '../utils/cn';

/**
 * AssetList component for displaying and managing assets
 * @param {Object} props - Component props
 * @param {boolean} props.showInactive - Whether to show inactive assets
 * @param {Function} props.onAssetSelect - Callback when asset is selected
 */
const AssetList = ({ showInactive = false, onAssetSelect }) => {
  const { assets, loading, fetchAssets } = useApp();
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Fetch assets on component mount
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Handle asset selection
  const handleAssetSelect = useCallback((asset) => {
    setSelectedAsset(asset);
    onAssetSelect?.(asset);
  }, [onAssetSelect]);

  // Filter assets based on active status
  const filteredAssets = useMemo(() => {
    return showInactive 
      ? assets 
      : assets.filter(asset => asset.is_active);
  }, [assets, showInactive]);

  if (loading.assets) {
    return <LoadingSpinner text="Loading assets..." />;
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-colors",
                selectedAsset?.id === asset.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleAssetSelect(asset)}
            >
              <h3 className="font-semibold">{asset.name}</h3>
              <p className="text-sm text-muted-foreground">
                {asset.ip_address} • {asset.device_type}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetList;
```

**Hook Example:**
```jsx
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

/**
 * Custom hook for managing assets
 * @returns {Object} Asset management functions and state
 */
export const useAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { get, post, put, delete: del } = useApi();

  // Fetch all assets
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await get('/assets');
      setAssets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [get]);

  // Create new asset
  const createAsset = useCallback(async (assetData) => {
    try {
      setLoading(true);
      setError(null);
      const newAsset = await post('/assets', assetData);
      setAssets(prev => [...prev, newAsset]);
      return newAsset;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [post]);

  // Update existing asset
  const updateAsset = useCallback(async (id, assetData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAsset = await put(`/assets/${id}`, assetData);
      setAssets(prev => 
        prev.map(asset => 
          asset.id === id ? updatedAsset : asset
        )
      );
      return updatedAsset;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [put]);

  // Delete asset
  const deleteAsset = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await del(`/assets/${id}`);
      setAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [del]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
  };
};
```

---

## Architecture Guidelines

### Backend Architecture

**Layered Architecture:**
```
┌─────────────────┐
│   API Layer     │ ← routes_v2.py
├─────────────────┤
│  Service Layer  │ ← services/
├─────────────────┤
│   Data Layer    │ ← models.py
├─────────────────┤
│ Infrastructure  │ ← database.py, config.py
└─────────────────┘
```

**Service Pattern:**
```python
class BaseService(Generic[T]):
    """Base service with common CRUD operations."""
    
    def __init__(self, db: Session, model_class: type):
        self.db = db
        self.model_class = model_class
    
    def create(self, data: Dict[str, Any], **kwargs) -> T:
        """Create a new record."""
        # Implementation
    
    def get_by_id(self, record_id: int) -> Optional[T]:
        """Get record by ID."""
        # Implementation
    
    def get_all(self, skip: int = 0, limit: int = 100, **filters) -> List[T]:
        """Get all records with filtering."""
        # Implementation
```

**Dependency Injection:**
```python
from fastapi import Depends
from sqlalchemy.orm import Session
from .database import get_db
from .services.asset_service import AssetService

@router.get("/assets")
def get_assets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    service = AssetService(db)
    return service.get_all(skip=skip, limit=limit)
```

### Frontend Architecture

**Component Hierarchy:**
```
App
├── Navigation
├── Routes
│   ├── Dashboard
│   ├── AssetsInterface
│   │   ├── StandardList
│   │   ├── AssetManager
│   │   └── AssetDetail
│   ├── DevicesInterface
│   └── CredentialsManager
└── ErrorBoundary
```

**State Management:**
```jsx
// Context-based state management
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Actions
  const fetchAssets = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { assets: true } });
    try {
      const assets = await api.get('/assets');
      dispatch({ type: 'SET_ASSETS', payload: assets });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { assets: false } });
    }
  }, []);

  return (
    <AppContext.Provider value={{ ...state, fetchAssets }}>
      {children}
    </AppContext.Provider>
  );
};
```

---

## Testing

### Backend Testing

**Test Structure:**
```
tests/
├── conftest.py              # Test configuration
├── test_models.py           # Model tests
├── test_services.py         # Service tests
├── test_routes.py           # API route tests
└── fixtures/                # Test fixtures
    ├── assets.json
    └── users.json
```

**Test Example:**
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import get_db
from app.models import Asset
from app.services.asset_service import AssetService

@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)

@pytest.fixture
def db_session():
    """Create test database session."""
    # Setup test database
    pass

@pytest.fixture
def sample_asset(db_session):
    """Create sample asset for testing."""
    asset = Asset(
        name="Test Asset",
        ip_address="192.168.1.100",
        device_type="server"
    )
    db_session.add(asset)
    db_session.commit()
    return asset

def test_create_asset(client, db_session):
    """Test asset creation."""
    asset_data = {
        "name": "New Asset",
        "ip_address": "192.168.1.101",
        "device_type": "server"
    }
    
    response = client.post("/api/v2/assets", json=asset_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == asset_data["name"]
    assert data["ip_address"] == asset_data["ip_address"]

def test_asset_service_create(db_session):
    """Test asset service creation."""
    service = AssetService(db_session)
    asset_data = {
        "name": "Service Asset",
        "ip_address": "192.168.1.102",
        "device_type": "workstation"
    }
    
    asset = service.create(asset_data, user_id=1)
    
    assert asset.name == asset_data["name"]
    assert asset.ip_address == asset_data["ip_address"]
    assert asset.id is not None
```

**Running Tests:**
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_services.py

# Run with coverage
pytest --cov=app --cov-report=html

# Run with verbose output
pytest -v

# Run specific test
pytest tests/test_services.py::test_asset_service_create
```

### Frontend Testing

**Test Structure:**
```
tests/
├── components/              # Component tests
│   ├── AssetList.test.jsx
│   └── StandardList.test.jsx
├── hooks/                   # Hook tests
│   └── useAssets.test.js
├── utils/                   # Utility tests
│   └── formatters.test.js
└── __mocks__/               # Mock files
    └── api.js
```

**Test Example:**
```jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../contexts/AppContext';
import AssetList from '../components/AssetList';

// Mock the API
jest.mock('../hooks/useApi', () => ({
  useApi: () => ({
    get: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Asset',
        ip_address: '192.168.1.100',
        device_type: 'server'
      }
    ]),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
}));

const renderWithProvider = (component) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('AssetList', () => {
  test('renders asset list', async () => {
    renderWithProvider(<AssetList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Asset')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100 • server')).toBeInTheDocument();
    });
  });

  test('handles asset selection', async () => {
    const onAssetSelect = jest.fn();
    renderWithProvider(<AssetList onAssetSelect={onAssetSelect} />);
    
    await waitFor(() => {
      const assetItem = screen.getByText('Test Asset');
      fireEvent.click(assetItem);
    });
    
    expect(onAssetSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Test Asset'
      })
    );
  });
});
```

**Running Tests:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test AssetList.test.jsx
```

---

## Git Workflow

### Branch Strategy

**Branch Types:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes
- `release/*`: Release preparation

**Branch Naming:**
```bash
feature/user-authentication
bugfix/asset-deletion-error
hotfix/security-vulnerability
release/v2.1.0
```

### Commit Messages

**Format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(auth): add JWT token refresh mechanism

fix(api): resolve database connection timeout issue

docs(readme): update installation instructions

refactor(services): extract common CRUD operations to base service

test(assets): add unit tests for asset service
```

### Pull Request Process

**1. Create Feature Branch:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-feature
```

**2. Make Changes:**
```bash
# Make your changes
git add .
git commit -m "feat(feature): implement new functionality"
```

**3. Push and Create PR:**
```bash
git push origin feature/new-feature
# Create pull request on GitHub
```

**4. Code Review:**
- At least one reviewer required
- All CI checks must pass
- Address review feedback
- Update documentation if needed

**5. Merge:**
```bash
# After approval, merge to develop
git checkout develop
git pull origin develop
git merge feature/new-feature
git push origin develop
```

---

## Debugging

### Backend Debugging

**Debug Mode:**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
export SQL_DEBUG=true

# Run with debugger
python -m pdb -m uvicorn app.main:app --reload
```

**Logging:**
```python
import logging

logger = logging.getLogger(__name__)

def some_function():
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")
```

**Database Debugging:**
```python
# Enable SQL query logging
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Use database session in shell
from app.database import SessionLocal
from app.models import Asset

db = SessionLocal()
assets = db.query(Asset).all()
print(assets)
```

### Frontend Debugging

**React Developer Tools:**
- Install React Developer Tools browser extension
- Use Components tab to inspect component state
- Use Profiler tab to analyze performance

**Console Debugging:**
```jsx
const MyComponent = () => {
  const [state, setState] = useState({});
  
  useEffect(() => {
    console.log('Component mounted');
    console.log('State:', state);
  }, [state]);
  
  const handleClick = () => {
    console.log('Button clicked');
    debugger; // Breakpoint
  };
  
  return <button onClick={handleClick}>Click me</button>;
};
```

**Network Debugging:**
```jsx
// Log API calls
const apiCall = async (url, options) => {
  console.log('API Call:', url, options);
  try {
    const response = await fetch(url, options);
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## Performance Optimization

### Backend Optimization

**Database Optimization:**
```python
# Use indexes for frequently queried columns
class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)  # Index for name searches
    ip_address = Column(String(45), index=True)  # Index for IP lookups
    device_type = Column(String(50), index=True)  # Index for filtering

# Use eager loading to avoid N+1 queries
def get_assets_with_labels(db: Session):
    return db.query(Asset).options(
        joinedload(Asset.labels)
    ).all()

# Use connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True
)
```

**Caching:**
```python
from functools import lru_cache
import redis

# In-memory caching
@lru_cache(maxsize=128)
def get_asset_type_info(device_type: str):
    # Expensive operation
    return expensive_calculation(device_type)

# Redis caching
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_assets():
    cached = redis_client.get('assets:all')
    if cached:
        return json.loads(cached)
    
    assets = expensive_db_query()
    redis_client.setex('assets:all', 300, json.dumps(assets))
    return assets
```

### Frontend Optimization

**Component Optimization:**
```jsx
import React, { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  // Expensive rendering logic
  return <div>{/* Complex UI */}</div>;
});

// Memoize expensive calculations
const MyComponent = ({ items }) => {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);
  
  const handleClick = useCallback((id) => {
    // Handle click
  }, []);
  
  return (
    <div>
      <ExpensiveComponent data={expensiveValue} onUpdate={handleClick} />
    </div>
  );
};
```

**Bundle Optimization:**
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
};
```

**Lazy Loading:**
```jsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
};
```

---

## Security Guidelines

### Backend Security

**Input Validation:**
```python
from pydantic import BaseModel, validator
import re

class AssetCreate(BaseModel):
    name: str
    ip_address: Optional[str] = None
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if not re.match(r'^[a-zA-Z0-9\s\-_]+$', v):
            raise ValueError('Name contains invalid characters')
        return v.strip()
    
    @validator('ip_address')
    def validate_ip(cls, v):
        if v and not re.match(r'^(\d{1,3}\.){3}\d{1,3}$', v):
            raise ValueError('Invalid IP address format')
        return v
```

**Authentication:**
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
```

**SQL Injection Prevention:**
```python
# Use parameterized queries
def get_assets_by_type(db: Session, device_type: str):
    return db.query(Asset).filter(Asset.device_type == device_type).all()

# Never use string formatting for queries
# BAD: db.execute(f"SELECT * FROM assets WHERE type = '{device_type}'")
# GOOD: db.query(Asset).filter(Asset.device_type == device_type)
```

### Frontend Security

**XSS Prevention:**
```jsx
// Sanitize user input
import DOMPurify from 'dompurify';

const UserContent = ({ content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};

// Use proper escaping
const UserName = ({ name }) => {
  return <span>{name}</span>; // React automatically escapes
};
```

**CSRF Protection:**
```jsx
// Include CSRF token in requests
const apiCall = async (url, options = {}) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token,
    },
  });
};
```

**Secure Storage:**
```jsx
// Don't store sensitive data in localStorage
// Use secure HTTP-only cookies for tokens
const useAuth = () => {
  const [user, setUser] = useState(null);
  
  const login = async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include', // Include cookies
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
    }
  };
  
  return { user, login };
};
```

---

## Contributing

### Development Process

**1. Fork and Clone:**
```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/discoverit.git
cd discoverit
git remote add upstream https://github.com/original-org/discoverit.git
```

**2. Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

**3. Make Changes:**
- Follow code standards
- Write tests for new functionality
- Update documentation
- Ensure all tests pass

**4. Submit Pull Request:**
- Provide clear description
- Reference related issues
- Include screenshots if UI changes
- Ensure CI passes

### Code Review Checklist

**Backend:**
- [ ] Code follows PEP 8 style guide
- [ ] Type hints are used for all functions
- [ ] Proper error handling and logging
- [ ] Database queries are optimized
- [ ] Security considerations addressed
- [ ] Tests cover new functionality
- [ ] Documentation updated

**Frontend:**
- [ ] Code follows ESLint rules
- [ ] Components are properly typed
- [ ] Accessibility features implemented
- [ ] Performance optimizations applied
- [ ] Tests cover new functionality
- [ ] Documentation updated

### Release Process

**1. Version Bumping:**
```bash
# Update version in package.json and setup.py
npm version patch  # or minor, major
git push --tags
```

**2. Release Notes:**
- Document new features
- List bug fixes
- Note breaking changes
- Include migration instructions

**3. Deployment:**
- Test in staging environment
- Deploy to production
- Monitor for issues
- Update documentation

---

This development guide provides comprehensive instructions for contributing to the DiscoverIT project. Follow these guidelines to ensure code quality, maintainability, and consistency across the codebase.

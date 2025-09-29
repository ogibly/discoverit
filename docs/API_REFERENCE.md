# DiscoverIT API Reference

## Base URL
```
http://localhost:8000/api/v2
```

## Authentication

All API endpoints require authentication using JWT tokens.

### Login
```http
POST /auth/login
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

### Using the Token
Include the token in the Authorization header:
```http
Authorization: Bearer <your-token>
```

## Assets API

### List Assets
```http
GET /assets?skip=0&limit=100&is_active=true
```

**Query Parameters:**
- `skip` (int): Number of records to skip (default: 0)
- `limit` (int): Maximum number of records to return (default: 100)
- `is_active` (bool): Filter by active status

**Response:**
```json
[
  {
    "id": 1,
    "name": "Web Server 01",
    "description": "Production web server",
    "ip_address": "192.168.1.100",
    "mac_address": "00:11:22:33:44:55",
    "device_type": "server",
    "manufacturer": "Dell",
    "model": "PowerEdge R740",
    "serial_number": "ABC123456",
    "location": "Data Center A",
    "is_active": true,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "labels": [
      {
        "id": 1,
        "name": "Production",
        "color": "#ff0000"
      }
    ]
  }
]
```

### Create Asset
```http
POST /assets
Content-Type: application/json

{
  "name": "New Server",
  "description": "Test server",
  "ip_address": "192.168.1.101",
  "mac_address": "00:11:22:33:44:66",
  "device_type": "server",
  "manufacturer": "HP",
  "model": "ProLiant DL380",
  "serial_number": "XYZ789012",
  "location": "Lab",
  "is_active": true
}
```

### Get Asset
```http
GET /assets/{id}
```

### Update Asset
```http
PUT /assets/{id}
Content-Type: application/json

{
  "name": "Updated Server Name",
  "description": "Updated description"
}
```

### Delete Asset
```http
DELETE /assets/{id}
```

## Asset Groups API

### List Asset Groups
```http
GET /asset-groups?skip=0&limit=100
```

### Create Asset Group
```http
POST /asset-groups
Content-Type: application/json

{
  "name": "Web Servers",
  "description": "All web servers",
  "asset_ids": [1, 2, 3]
}
```

### Get Asset Group
```http
GET /asset-groups/{id}
```

### Update Asset Group
```http
PUT /asset-groups/{id}
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

### Delete Asset Group
```http
DELETE /asset-groups/{id}
```

## Devices API

### List Devices
```http
GET /devices?skip=0&limit=100&scan_task_id=123
```

**Query Parameters:**
- `skip` (int): Number of records to skip
- `limit` (int): Maximum number of records to return
- `scan_task_id` (int): Filter by scan task ID

### Get Device
```http
GET /devices/{id}
```

### Convert Device to Asset
```http
POST /devices/{id}/convert
Content-Type: application/json

{
  "name": "Converted Asset",
  "description": "Converted from discovered device"
}
```

### Delete Device
```http
DELETE /devices/{id}
```

## Credentials API

### List Credentials
```http
GET /credentials?skip=0&limit=100
```

### Create Credential
```http
POST /credentials
Content-Type: application/json

{
  "name": "Admin Credentials",
  "description": "Administrative access",
  "credential_type": "username_password",
  "username": "admin",
  "password": "secretpassword",
  "domain": "corp.local",
  "port": 22,
  "is_active": true
}
```

**Credential Types:**
- `username_password`: Username and password
- `ssh_key`: SSH private key
- `api_key`: API key authentication
- `certificate`: Certificate-based authentication

### Get Credential
```http
GET /credentials/{id}
```

### Update Credential
```http
PUT /credentials/{id}
Content-Type: application/json

{
  "name": "Updated Credential Name",
  "description": "Updated description"
}
```

### Delete Credential
```http
DELETE /credentials/{id}
```

## Scan Tasks API

### List Scan Tasks
```http
GET /scan-tasks?skip=0&limit=100
```

### Create Scan Task
```http
POST /scan-tasks
Content-Type: application/json

{
  "name": "Network Discovery",
  "target": "192.168.1.0/24",
  "intensity": "standard",
  "scanner_type": "auto"
}
```

**Intensity Levels:**
- `light`: Quick scan, basic information
- `standard`: Balanced scan, good detail
- `deep`: Comprehensive scan, maximum detail

### Get Scan Task
```http
GET /scan-tasks/{id}
```

### Cancel Scan Task
```http
POST /scan-tasks/{id}/cancel
```

### Get Scan Results
```http
GET /scan-tasks/{id}/results
```

## Operations API

### List Operations
```http
GET /operations?skip=0&limit=100&is_active=true
```

### Create Operation
```http
POST /operations
Content-Type: application/json

{
  "name": "System Update",
  "description": "Update system packages",
  "operation_type": "awx",
  "awx_playbook_id": 123,
  "awx_playbook_name": "system-update.yml",
  "is_active": true
}
```

### Get Operation
```http
GET /operations/{id}
```

### Update Operation
```http
PUT /operations/{id}
Content-Type: application/json

{
  "name": "Updated Operation Name",
  "description": "Updated description"
}
```

### Delete Operation
```http
DELETE /operations/{id}
```

## Jobs API

### List Jobs
```http
GET /jobs?skip=0&limit=100&operation_id=123&status=running
```

**Query Parameters:**
- `skip` (int): Number of records to skip
- `limit` (int): Maximum number of records to return
- `operation_id` (int): Filter by operation ID
- `status` (string): Filter by job status

**Job Statuses:**
- `pending`: Job is queued
- `running`: Job is executing
- `completed`: Job finished successfully
- `failed`: Job failed
- `cancelled`: Job was cancelled

### Get Job
```http
GET /jobs/{id}
```

### Cancel Job
```http
POST /jobs/{id}/cancel
```

### Run Operation
```http
POST /operations/{id}/run
Content-Type: application/json

{
  "target_assets": [1, 2, 3],
  "target_asset_groups": [1, 2],
  "credential_id": 1,
  "parameters": {
    "package_name": "nginx",
    "version": "latest"
  }
}
```

## Labels API

### List Labels
```http
GET /labels?skip=0&limit=100
```

### Create Label
```http
POST /labels
Content-Type: application/json

{
  "name": "Production",
  "description": "Production environment",
  "color": "#ff0000",
  "label_type": "custom",
  "category": "environment"
}
```

### Get Label
```http
GET /labels/{id}
```

### Update Label
```http
PUT /labels/{id}
Content-Type: application/json

{
  "name": "Updated Label Name",
  "description": "Updated description"
}
```

### Delete Label
```http
DELETE /labels/{id}
```

## Users API

### List Users
```http
GET /users?skip=0&limit=100
```

### Create User
```http
POST /users
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "full_name": "New User",
  "password": "securepassword",
  "role_id": 2,
  "is_active": true
}
```

### Get User
```http
GET /users/{id}
```

### Update User
```http
PUT /users/{id}
Content-Type: application/json

{
  "full_name": "Updated User Name",
  "email": "updated@example.com"
}
```

### Delete User
```http
DELETE /users/{id}
```

## Settings API

### Get Settings
```http
GET /settings
```

### Update Settings
```http
PUT /settings
Content-Type: application/json

{
  "default_subnet": "192.168.1.0/24",
  "scan_timeout": 300,
  "max_concurrent_scans": 5,
  "auto_discovery_enabled": true,
}
```

## Error Responses

### Standard Error Format
```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication failed
- `FORBIDDEN`: Access denied
- `CONFLICT`: Resource conflict
- `INTERNAL_ERROR`: Internal server error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination using `skip` and `limit` parameters:

```http
GET /assets?skip=20&limit=10
```

**Response includes pagination metadata:**
```json
{
  "items": [...],
  "total": 100,
  "skip": 20,
  "limit": 10,
  "has_next": true,
  "has_prev": true
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

### Filtering
```http
GET /assets?is_active=true&device_type=server
```

### Sorting
```http
GET /assets?sort_by=name&sort_order=asc
```

### Search
```http
GET /assets?search=web server
```

## WebSocket Events

Real-time updates are available via WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

### Events
- `scan_progress`: Scan task progress updates
- `job_status`: Job status changes
- `device_discovered`: New device discovered
- `system_alert`: System alerts and notifications

### Event Format
```json
{
  "event": "scan_progress",
  "data": {
    "scan_task_id": 123,
    "progress": 75,
    "status": "running",
    "devices_found": 15
  }
}
```

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-09-23

### Added
- Enhanced scan service with comprehensive data collection
- Multiple scanner selection support in Local Network Discovery
- Discovery depth control (1-5 hops) for network scanning
- New unified `/scan` endpoint in scanner service
- Enhanced data categorization with confidence levels
- Comprehensive device type detection
- Fallback scanning mechanisms (local nmap if scanner service fails)
- Database migration for new scan task fields
- Enhanced error handling and logging throughout scan process
- New ScanResultsView component for better scan result display
- DynamicSidebar component with folding and resizing capabilities

### Changed
- **BREAKING**: Removed scan type display from Local Network Discovery form
- **BREAKING**: Updated scan task schema to include `scanner_ids`
- Enhanced scanner service with better data extraction
- Improved frontend scan UI with better validation
- Updated default view mode from 'grid' to 'table' across components
- Enhanced PageHeader component for consistent UI
- Improved error messages and user feedback

### Fixed
- Fixed login issues caused by missing imports in scan service
- Fixed scanner service integration and health checks
- Fixed "Loading credentials" static image issue
- Fixed frame alignment issues across application views
- Fixed scanner service offline detection
- Fixed redundant code and inefficient implementations
- Fixed method signature mismatches in scan service

### Removed
- **BREAKING**: Removed Scanner2 service (redundant)
- **BREAKING**: Removed legacy `routes.py` file
- Removed unused frontend components (DiscoveryDashboard, DiscoveryInterface, Operations, AssetManagement)
- Removed unused CSS files (modern.css)
- Removed unused database setup files
- Removed unused health check script
- Removed virtual environment files from repository
- Cleaned up orphaned containers and resources

### Security
- Enhanced input validation for scan targets
- Improved error handling to prevent information leakage
- Better timeout handling for scan operations

## [2.0.0] - Previous Release

### Added
- Initial application structure
- Basic scan functionality
- Authentication system
- Asset management
- Device discovery
- Scanner service integration

### Changed
- Migrated to modern React patterns
- Updated to FastAPI backend
- Implemented Docker containerization

## [1.0.0] - Initial Release

### Added
- Basic network discovery functionality
- Simple web interface
- Basic scan capabilities

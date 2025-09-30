/**
 * Application constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE || '/api/v2',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Device Types
export const DEVICE_TYPES = {
  ROUTER: 'router',
  SWITCH: 'switch',
  SERVER: 'server',
  WORKSTATION: 'workstation',
  PRINTER: 'printer',
  OTHER: 'other',
};

// Device Type Icons
export const DEVICE_TYPE_ICONS = {
  [DEVICE_TYPES.ROUTER]: '🌐',
  [DEVICE_TYPES.SWITCH]: '🔀',
  [DEVICE_TYPES.SERVER]: '🖥️',
  [DEVICE_TYPES.WORKSTATION]: '💻',
  [DEVICE_TYPES.PRINTER]: '🖨️',
  [DEVICE_TYPES.OTHER]: '📱',
};

// Device Type Colors
export const DEVICE_TYPE_COLORS = {
  [DEVICE_TYPES.ROUTER]: 'bg-blue-500/20 text-blue-600',
  [DEVICE_TYPES.SWITCH]: 'bg-green-500/20 text-green-600',
  [DEVICE_TYPES.SERVER]: 'bg-purple-500/20 text-purple-600',
  [DEVICE_TYPES.WORKSTATION]: 'bg-orange-500/20 text-orange-600',
  [DEVICE_TYPES.PRINTER]: 'bg-pink-500/20 text-pink-600',
  [DEVICE_TYPES.OTHER]: 'bg-gray-500/20 text-gray-600',
};

// Credential Types
export const CREDENTIAL_TYPES = {
  USERNAME_PASSWORD: 'username_password',
  SSH_KEY: 'ssh_key',
  API_KEY: 'api_key',
  CERTIFICATE: 'certificate',
};

// Credential Type Icons
export const CREDENTIAL_TYPE_ICONS = {
  [CREDENTIAL_TYPES.USERNAME_PASSWORD]: '🔑',
  [CREDENTIAL_TYPES.SSH_KEY]: '🔐',
  [CREDENTIAL_TYPES.API_KEY]: '🌐',
  [CREDENTIAL_TYPES.CERTIFICATE]: '📜',
};

// Credential Type Colors
export const CREDENTIAL_TYPE_COLORS = {
  [CREDENTIAL_TYPES.USERNAME_PASSWORD]: 'bg-blue-500/20 text-blue-600',
  [CREDENTIAL_TYPES.SSH_KEY]: 'bg-green-500/20 text-green-600',
  [CREDENTIAL_TYPES.API_KEY]: 'bg-purple-500/20 text-purple-600',
  [CREDENTIAL_TYPES.CERTIFICATE]: 'bg-orange-500/20 text-orange-600',
};

// Status Types
export const STATUS_TYPES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Status Colors
export const STATUS_COLORS = {
  [STATUS_TYPES.ACTIVE]: 'bg-success text-success-foreground',
  [STATUS_TYPES.INACTIVE]: 'bg-muted text-muted-foreground',
  [STATUS_TYPES.PENDING]: 'bg-warning text-warning-foreground',
  [STATUS_TYPES.RUNNING]: 'bg-primary text-primary-foreground',
  [STATUS_TYPES.COMPLETED]: 'bg-success text-success-foreground',
  [STATUS_TYPES.FAILED]: 'bg-error text-error-foreground',
  [STATUS_TYPES.CANCELLED]: 'bg-muted text-muted-foreground',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// View Modes
export const VIEW_MODES = {
  TABLE: 'table',
  GRID: 'grid',
};

// Sort Orders
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
};

// Default Networks
export const DEFAULT_NETWORKS = [
  '172.18.0.0/16',    // Docker Compose default network
  '172.17.0.0/16',    // Docker default bridge network
  '192.168.0.0/16',   // Common home/office networks
  '10.0.0.0/8',       // Common corporate networks
  '172.16.0.0/12'     // Private network range
];

// Scanner Configuration
export const SCANNER_CONFIG = {
  DEFAULT_TIMEOUT: 300,
  MAX_CONCURRENT_SCANS: 5,
};

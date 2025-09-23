import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v2';

// Initial state
const initialState = {
  // Assets
  assets: [],
  selectedAssets: [],
  selectedAsset: null,
  
  // Discovered Devices (from scans, not yet converted to assets)
  discoveredDevices: [],
  selectedDevices: [],
  selectedDevice: null,
  
  // Asset Groups
  assetGroups: [],
  selectedAssetGroups: [],
  selectedAssetGroup: null,
  
  
  // Credentials
  credentials: [],
  selectedCredentials: [],
  
  // Scan Tasks
  scanTasks: [],
  activeScanTask: null,
  
  // Operations & Jobs
  operations: [],
  jobs: [],
  
  // UI State
  loading: {
    assets: false,
    discoveredDevices: false,
    assetGroups: false,
    credentials: false,
    scanTasks: false,
    operations: false,
    jobs: false
  },
  error: null,
  statusMessage: null,
  
  // Modals
  modals: {
    assetManager: false,
    assetGroupManager: false,
    operationModal: false,
    settingsModal: false
  }
};

// Action types
const ActionTypes = {
  // Assets
  SET_ASSETS: 'SET_ASSETS',
  SET_SELECTED_ASSETS: 'SET_SELECTED_ASSETS',
  SET_SELECTED_ASSET: 'SET_SELECTED_ASSET',
  ADD_ASSET: 'ADD_ASSET',
  UPDATE_ASSET: 'UPDATE_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',
  
  // Discovered Devices
  SET_DISCOVERED_DEVICES: 'SET_DISCOVERED_DEVICES',
  SET_SELECTED_DEVICES: 'SET_SELECTED_DEVICES',
  SET_SELECTED_DEVICE: 'SET_SELECTED_DEVICE',
  REMOVE_DISCOVERED_DEVICE: 'REMOVE_DISCOVERED_DEVICE',
  
  // Asset Groups
  SET_ASSET_GROUPS: 'SET_ASSET_GROUPS',
  SET_SELECTED_ASSET_GROUPS: 'SET_SELECTED_ASSET_GROUPS',
  SET_SELECTED_ASSET_GROUP: 'SET_SELECTED_ASSET_GROUP',
  ADD_ASSET_GROUP: 'ADD_ASSET_GROUP',
  UPDATE_ASSET_GROUP: 'UPDATE_ASSET_GROUP',
  DELETE_ASSET_GROUP: 'DELETE_ASSET_GROUP',
  
  
  // Credentials
  SET_CREDENTIALS: 'SET_CREDENTIALS',
  SET_SELECTED_CREDENTIALS: 'SET_SELECTED_CREDENTIALS',
  ADD_CREDENTIAL: 'ADD_CREDENTIAL',
  UPDATE_CREDENTIAL: 'UPDATE_CREDENTIAL',
  DELETE_CREDENTIAL: 'DELETE_CREDENTIAL',
  
  // Scan Tasks
  SET_SCAN_TASKS: 'SET_SCAN_TASKS',
  SET_ACTIVE_SCAN_TASK: 'SET_ACTIVE_SCAN_TASK',
  UPDATE_SCAN_TASK: 'UPDATE_SCAN_TASK',
  
  // Operations & Jobs
  SET_OPERATIONS: 'SET_OPERATIONS',
  SET_JOBS: 'SET_JOBS',
  ADD_JOB: 'ADD_JOB',
  UPDATE_JOB: 'UPDATE_JOB',
  
  // UI State
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STATUS_MESSAGE: 'SET_STATUS_MESSAGE',
  CLEAR_STATUS_MESSAGE: 'CLEAR_STATUS_MESSAGE',
  
  // Modals
  SET_MODAL: 'SET_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    // Assets
    case ActionTypes.SET_ASSETS:
      return { ...state, assets: action.payload };
    case ActionTypes.SET_SELECTED_ASSETS:
      return { ...state, selectedAssets: action.payload };
    case ActionTypes.SET_SELECTED_ASSET:
      return { ...state, selectedAsset: action.payload };
    case ActionTypes.ADD_ASSET:
      return { ...state, assets: [...state.assets, action.payload] };
    case ActionTypes.UPDATE_ASSET:
      return {
        ...state,
        assets: state.assets.map(asset =>
          asset.id === action.payload.id ? action.payload : asset
        ),
        selectedAsset: state.selectedAsset?.id === action.payload.id ? action.payload : state.selectedAsset
      };
    case ActionTypes.DELETE_ASSET:
      return {
        ...state,
        assets: state.assets.filter(asset => asset.id !== action.payload),
        selectedAsset: state.selectedAsset?.id === action.payload ? null : state.selectedAsset,
        selectedAssets: state.selectedAssets.filter(id => id !== action.payload)
      };
    
    // Discovered Devices
    case ActionTypes.SET_DISCOVERED_DEVICES:
      return { ...state, discoveredDevices: action.payload };
    case ActionTypes.SET_SELECTED_DEVICES:
      return { ...state, selectedDevices: action.payload };
    case ActionTypes.SET_SELECTED_DEVICE:
      return { ...state, selectedDevice: action.payload };
    case ActionTypes.REMOVE_DISCOVERED_DEVICE:
      return {
        ...state,
        discoveredDevices: state.discoveredDevices.filter(device => device.id !== action.payload),
        selectedDevice: state.selectedDevice?.id === action.payload ? null : state.selectedDevice,
        selectedDevices: state.selectedDevices.filter(id => id !== action.payload)
      };
    
    // Asset Groups
    case ActionTypes.SET_ASSET_GROUPS:
      return { ...state, assetGroups: action.payload };
    case ActionTypes.SET_SELECTED_ASSET_GROUPS:
      return { ...state, selectedAssetGroups: action.payload };
    case ActionTypes.SET_SELECTED_ASSET_GROUP:
      return { ...state, selectedAssetGroup: action.payload };
    case ActionTypes.ADD_ASSET_GROUP:
      return { ...state, assetGroups: [...state.assetGroups, action.payload] };
    case ActionTypes.UPDATE_ASSET_GROUP:
      return {
        ...state,
        assetGroups: state.assetGroups.map(group =>
          group.id === action.payload.id ? action.payload : group
        ),
        selectedAssetGroup: state.selectedAssetGroup?.id === action.payload.id ? action.payload : state.selectedAssetGroup
      };
    case ActionTypes.DELETE_ASSET_GROUP:
      return {
        ...state,
        assetGroups: state.assetGroups.filter(group => group.id !== action.payload),
        selectedAssetGroup: state.selectedAssetGroup?.id === action.payload ? null : state.selectedAssetGroup,
        selectedAssetGroups: state.selectedAssetGroups.filter(id => id !== action.payload)
      };
    
    
    // Credentials
    case ActionTypes.SET_CREDENTIALS:
      return { ...state, credentials: action.payload };
    case ActionTypes.SET_SELECTED_CREDENTIALS:
      return { ...state, selectedCredentials: action.payload };
    case ActionTypes.ADD_CREDENTIAL:
      return { ...state, credentials: [...state.credentials, action.payload] };
    case ActionTypes.UPDATE_CREDENTIAL:
      return {
        ...state,
        credentials: state.credentials.map(credential =>
          credential.id === action.payload.id ? action.payload : credential
        )
      };
    case ActionTypes.DELETE_CREDENTIAL:
      return { ...state, credentials: state.credentials.filter(credential => credential.id !== action.payload) };
    
    // Scan Tasks
    case ActionTypes.SET_SCAN_TASKS:
      return { ...state, scanTasks: action.payload };
    case ActionTypes.SET_ACTIVE_SCAN_TASK:
      return { ...state, activeScanTask: action.payload };
    case ActionTypes.UPDATE_SCAN_TASK:
      return {
        ...state,
        scanTasks: state.scanTasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
        activeScanTask: state.activeScanTask?.id === action.payload.id ? action.payload : state.activeScanTask
      };
    
    // Operations & Jobs
    case ActionTypes.SET_OPERATIONS:
      return { ...state, operations: action.payload };
    case ActionTypes.SET_JOBS:
      return { ...state, jobs: action.payload };
    case ActionTypes.ADD_JOB:
      return { ...state, jobs: [action.payload, ...state.jobs] };
    case ActionTypes.UPDATE_JOB:
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload.id ? action.payload : job
        )
      };
    
    // UI State
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case ActionTypes.SET_STATUS_MESSAGE:
      return { ...state, statusMessage: action.payload };
    case ActionTypes.CLEAR_STATUS_MESSAGE:
      return { ...state, statusMessage: null };
    
    // Modals
    case ActionTypes.SET_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload.name]: action.payload.value }
      };
    case ActionTypes.CLOSE_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false }
      };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { token } = useAuth();

  // API helper functions
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Get token from localStorage to ensure it's always current
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    } else {
      console.warn('No authentication token found for API call to:', endpoint);
    }
    
    try {
      const response = await axios({
        url: `${API_BASE}${endpoint}`,
        headers,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('Request URL:', `${API_BASE}${endpoint}`);
      console.error('Request headers:', headers);
      
      if (error.response?.status === 401) {
        // Token expired or invalid
        console.warn('Token expired or invalid, redirecting to login');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.error('403 Forbidden - Check authentication token and permissions');
        // Try to refresh the token first
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          try {
            console.log('Attempting to refresh token...');
            const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {}, {
              headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (refreshResponse.data.access_token) {
              console.log('Token refreshed successfully');
              localStorage.setItem('token', refreshResponse.data.access_token);
              // Retry the original request with the new token
              const retryResponse = await axios({
                url: `${API_BASE}${endpoint}`,
                headers: {
                  ...headers,
                  'Authorization': `Bearer ${refreshResponse.data.access_token}`
                },
                ...options
              });
              return retryResponse.data;
            }
          } catch (refreshError) {
            console.warn('Token refresh failed, redirecting to login');
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
        }
      }
      
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.response?.data?.detail || error.message });
      throw error;
    }
  }, []);

  // Asset actions
  const fetchAssets = useCallback(async (filters = {}) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'assets', value: true } });
    try {
      const params = new URLSearchParams();
      if (filters.label_ids) params.append('label_ids', filters.label_ids.join(','));
      if (filters.search) params.append('search', filters.search);
      if (filters.is_managed !== undefined) params.append('is_managed', filters.is_managed);
      
      const assets = await apiCall(`/assets?${params.toString()}`);
      dispatch({ type: ActionTypes.SET_ASSETS, payload: assets });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'assets', value: false } });
    }
  }, [apiCall]);

  const createAsset = useCallback(async (assetData) => {
    try {
      const asset = await apiCall('/assets', {
        method: 'POST',
        data: assetData
      });
      dispatch({ type: ActionTypes.ADD_ASSET, payload: asset });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Asset created successfully' });
      return asset;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to create asset' });
      throw error;
    }
  }, [apiCall]);

  const updateAsset = useCallback(async (assetId, assetData) => {
    try {
      const asset = await apiCall(`/assets/${assetId}`, {
        method: 'PUT',
        data: assetData
      });
      dispatch({ type: ActionTypes.UPDATE_ASSET, payload: asset });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Asset updated successfully' });
      return asset;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to update asset' });
      throw error;
    }
  }, [apiCall]);

  const deleteAsset = useCallback(async (assetId) => {
    try {
      await apiCall(`/assets/${assetId}`, { method: 'DELETE' });
      dispatch({ type: ActionTypes.DELETE_ASSET, payload: assetId });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Asset deleted successfully' });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to delete asset' });
      throw error;
    }
  }, [apiCall]);

  const bulkDeleteAssets = useCallback(async (assetIds) => {
    try {
      // Delete assets one by one (backend doesn't have bulk delete endpoint yet)
      const deletePromises = assetIds.map(assetId => 
        apiCall(`/assets/${assetId}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      
      // Remove all deleted assets from state
      assetIds.forEach(assetId => {
        dispatch({ type: ActionTypes.DELETE_ASSET, payload: assetId });
      });
      
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: `${assetIds.length} assets deleted successfully` });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to delete some assets' });
      throw error;
    }
  }, [apiCall]);

  // Discovered Devices actions
  const fetchDiscoveredDevices = useCallback(async (filters = {}) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'discoveredDevices', value: true } });
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await apiCall(`/devices?${params.toString()}`);
      dispatch({ type: ActionTypes.SET_DISCOVERED_DEVICES, payload: response.devices || [] });
      return response;
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'discoveredDevices', value: false } });
    }
  }, [apiCall]);

  const convertDeviceToAsset = useCallback(async (deviceId, assetData) => {
    try {
      const asset = await apiCall(`/devices/${deviceId}/convert-to-asset`, {
        method: 'POST',
        data: assetData
      });
      
      // Remove the device from discovered devices and add to assets
      dispatch({ type: ActionTypes.REMOVE_DISCOVERED_DEVICE, payload: deviceId });
      dispatch({ type: ActionTypes.ADD_ASSET, payload: asset });
      
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Device converted to asset successfully' });
      return asset;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to convert device to asset' });
      throw error;
    }
  }, [apiCall]);

  const createAssetGroup = useCallback(async (groupData) => {
    try {
      const response = await apiCall('/asset-groups', {
        method: 'POST',
        data: groupData
      });
      
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Asset group created successfully' });
      return response;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to create asset group' });
      throw error;
    }
  }, [apiCall]);

  const deleteDevice = useCallback(async (deviceId) => {
    try {
      await apiCall(`/assets/${deviceId}`, { method: 'DELETE' });
      dispatch({ type: ActionTypes.DELETE_ASSET, payload: deviceId });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Device deleted successfully' });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to delete device' });
      throw error;
    }
  }, [apiCall]);

  const bulkDeleteDevices = useCallback(async (deviceIds) => {
    try {
      // Delete devices one by one (backend doesn't have bulk delete endpoint yet)
      const deletePromises = deviceIds.map(deviceId => 
        apiCall(`/assets/${deviceId}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      
      // Remove all deleted devices from state
      deviceIds.forEach(deviceId => {
        dispatch({ type: ActionTypes.DELETE_ASSET, payload: deviceId });
      });
      
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: `${deviceIds.length} devices deleted successfully` });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to delete some devices' });
      throw error;
    }
  }, [apiCall]);

  // Asset Group actions
  const fetchAssetGroups = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'assetGroups', value: true } });
    try {
      const assetGroups = await apiCall('/asset-groups');
      dispatch({ type: ActionTypes.SET_ASSET_GROUPS, payload: assetGroups });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'assetGroups', value: false } });
    }
  }, [apiCall]);

  const updateAssetGroup = useCallback(async (groupId, groupData) => {
    try {
      const updatedGroup = await apiCall(`/asset-groups/${groupId}`, { method: 'PUT', data: groupData });
      dispatch({ type: ActionTypes.UPDATE_ASSET_GROUP, payload: updatedGroup });
      return updatedGroup;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const deleteAssetGroup = useCallback(async (groupId) => {
    try {
      await apiCall(`/asset-groups/${groupId}`, { method: 'DELETE' });
      dispatch({ type: ActionTypes.DELETE_ASSET_GROUP, payload: groupId });
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  // Credential actions
  const fetchCredentials = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'credentials', value: true } });
    try {
      const credentials = await apiCall('/credentials');
      dispatch({ type: ActionTypes.SET_CREDENTIALS, payload: credentials });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'credentials', value: false } });
    }
  }, [apiCall]);

  const createCredential = useCallback(async (credentialData) => {
    try {
      const newCredential = await apiCall('/credentials', { method: 'POST', data: credentialData });
      dispatch({ type: ActionTypes.ADD_CREDENTIAL, payload: newCredential });
      return newCredential;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const updateCredential = useCallback(async (credentialId, credentialData) => {
    try {
      const updatedCredential = await apiCall(`/credentials/${credentialId}`, { method: 'PUT', data: credentialData });
      dispatch({ type: ActionTypes.UPDATE_CREDENTIAL, payload: updatedCredential });
      return updatedCredential;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const deleteCredential = useCallback(async (credentialId) => {
    try {
      await apiCall(`/credentials/${credentialId}`, { method: 'DELETE' });
      dispatch({ type: ActionTypes.DELETE_CREDENTIAL, payload: credentialId });
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  // LDAP Configuration actions
  const fetchLDAPConfigs = useCallback(async () => {
    try {
      const configs = await apiCall('/ldap/configs');
      return configs;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const createLDAPConfig = useCallback(async (configData) => {
    try {
      const config = await apiCall('/ldap/configs', { method: 'POST', data: configData });
      return config;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const updateLDAPConfig = useCallback(async (configId, configData) => {
    try {
      const config = await apiCall(`/ldap/configs/${configId}`, { method: 'PUT', data: configData });
      return config;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const deleteLDAPConfig = useCallback(async (configId) => {
    try {
      await apiCall(`/ldap/configs/${configId}`, { method: 'DELETE' });
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const testLDAPConnection = useCallback(async (configId) => {
    try {
      const result = await apiCall(`/ldap/configs/${configId}/test`, { method: 'POST' });
      return result;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const syncLDAPUsers = useCallback(async (configId) => {
    try {
      const result = await apiCall(`/ldap/configs/${configId}/sync`, { method: 'POST' });
      return result;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  // IP Range actions
  const fetchIPRanges = useCallback(async () => {
    try {
      const ranges = await apiCall('/ip-ranges');
      return ranges;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const createIPRange = useCallback(async (rangeData) => {
    try {
      const range = await apiCall('/ip-ranges', { method: 'POST', data: rangeData });
      return range;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const updateIPRange = useCallback(async (rangeId, rangeData) => {
    try {
      const range = await apiCall(`/ip-ranges/${rangeId}`, { method: 'PUT', data: rangeData });
      return range;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const deleteIPRange = useCallback(async (rangeId) => {
    try {
      await apiCall(`/ip-ranges/${rangeId}`, { method: 'DELETE' });
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  // Scan Task actions
  const fetchScanTasks = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'scanTasks', value: true } });
    try {
      const scanTasks = await apiCall('/scan-tasks');
      dispatch({ type: ActionTypes.SET_SCAN_TASKS, payload: scanTasks });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'scanTasks', value: false } });
    }
  }, [apiCall]);

  const fetchActiveScanTask = useCallback(async () => {
    try {
      const activeScanTask = await apiCall('/scan-tasks/active');
      dispatch({ type: ActionTypes.SET_ACTIVE_SCAN_TASK, payload: activeScanTask });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_ACTIVE_SCAN_TASK, payload: null });
    }
  }, [apiCall]);

  const createScanTask = useCallback(async (taskData) => {
    try {
      const task = await apiCall('/scan-tasks', {
        method: 'POST',
        data: taskData
      });
      dispatch({ type: ActionTypes.SET_ACTIVE_SCAN_TASK, payload: task });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Scan started successfully' });
      return task;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to start scan' });
      throw error;
    }
  }, [apiCall]);

  const cancelScanTask = useCallback(async (taskId) => {
    try {
      await apiCall(`/scan-tasks/${taskId}/cancel`, { method: 'POST' });
      dispatch({ type: ActionTypes.SET_ACTIVE_SCAN_TASK, payload: null });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Scan cancelled successfully' });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to cancel scan' });
      throw error;
    }
  }, [apiCall]);

  // Operation actions
  const fetchOperations = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'operations', value: true } });
    try {
      const operations = await apiCall('/operations');
      dispatch({ type: ActionTypes.SET_OPERATIONS, payload: operations });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'operations', value: false } });
    }
  }, [apiCall]);

  const fetchJobs = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'jobs', value: true } });
    try {
      const jobs = await apiCall('/jobs');
      dispatch({ type: ActionTypes.SET_JOBS, payload: jobs });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'jobs', value: false } });
    }
  }, [apiCall]);

  const runOperation = useCallback(async (operationData) => {
    try {
      const job = await apiCall('/operations/run', {
        method: 'POST',
        data: operationData
      });
      dispatch({ type: ActionTypes.ADD_JOB, payload: job });
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Operation started successfully' });
      return job;
    } catch (error) {
      dispatch({ type: ActionTypes.SET_STATUS_MESSAGE, payload: 'Failed to start operation' });
      throw error;
    }
  }, [apiCall]);

  // Admin/Settings API functions
  const fetchSettings = useCallback(async () => {
    try {
      const settings = await apiCall('/settings');
      return settings;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const updateSettings = useCallback(async (settingsData) => {
    try {
      const settings = await apiCall('/settings', {
        method: 'PUT',
        data: settingsData
      });
      return settings;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await apiCall('/users');
      return users;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const createUser = useCallback(async (userData) => {
    try {
      const user = await apiCall('/users', {
        method: 'POST',
        data: userData
      });
      return user;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const user = await apiCall(`/users/${userId}`, {
        method: 'PUT',
        data: userData
      });
      return user;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await apiCall(`/users/${userId}`, { method: 'DELETE' });
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const fetchRoles = useCallback(async () => {
    try {
      const roles = await apiCall('/roles');
      return roles;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const fetchScannerConfigs = useCallback(async () => {
    try {
      const configs = await apiCall('/scanners');
      return configs;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  const runLanDiscovery = useCallback(async (config) => {
    try {
      const result = await apiCall(`/discovery/lan?max_depth=${config.maxDepth}`, {
        method: 'POST',
        data: config
      });
      return result;
    } catch (error) {
      throw error;
    }
  }, [apiCall]);

  // UI actions
  const setModal = useCallback((name, value) => {
    dispatch({ type: ActionTypes.SET_MODAL, payload: { name, value } });
  }, []);

  const closeModal = useCallback((name) => {
    dispatch({ type: ActionTypes.CLOSE_MODAL, payload: name });
  }, []);

  const clearStatusMessage = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_STATUS_MESSAGE });
  }, []);

  const refreshAllData = useCallback(() => {
    // Refresh all data after authentication
    fetchAssets();
    fetchAssetGroups();
    fetchScanTasks();
    fetchOperations();
    fetchJobs();
    fetchActiveScanTask();
  }, [fetchAssets, fetchAssetGroups, fetchScanTasks, fetchOperations, fetchJobs, fetchActiveScanTask]);

  // Selection actions
  const toggleAssetSelection = useCallback((assetId) => {
    const newSelection = state.selectedAssets.includes(assetId)
      ? state.selectedAssets.filter(id => id !== assetId)
      : [...state.selectedAssets, assetId];
    dispatch({ type: ActionTypes.SET_SELECTED_ASSETS, payload: newSelection });
  }, [state.selectedAssets]);

  const selectAllAssets = useCallback((assetIds) => {
    const allSelected = assetIds.every(id => state.selectedAssets.includes(id));
    const newSelection = allSelected
      ? state.selectedAssets.filter(id => !assetIds.includes(id))
      : [...new Set([...state.selectedAssets, ...assetIds])];
    dispatch({ type: ActionTypes.SET_SELECTED_ASSETS, payload: newSelection });
  }, [state.selectedAssets]);

  // Device selection actions
  const toggleDeviceSelection = useCallback((deviceId) => {
    const newSelection = state.selectedDevices.includes(deviceId)
      ? state.selectedDevices.filter(id => id !== deviceId)
      : [...state.selectedDevices, deviceId];
    dispatch({ type: ActionTypes.SET_SELECTED_DEVICES, payload: newSelection });
  }, [state.selectedDevices]);

  const selectAllDevices = useCallback((deviceIds) => {
    const allSelected = deviceIds.every(id => state.selectedDevices.includes(id));
    const newSelection = allSelected
      ? state.selectedDevices.filter(id => !deviceIds.includes(id))
      : [...new Set([...state.selectedDevices, ...deviceIds])];
    dispatch({ type: ActionTypes.SET_SELECTED_DEVICES, payload: newSelection });
  }, [state.selectedDevices]);

  // Initial data fetch - only after authentication
  useEffect(() => {
    // Don't fetch data on initial load - wait for auth-changed event
    // This prevents race conditions with token validation
  }, [fetchAssets, fetchAssetGroups, fetchScanTasks, fetchOperations, fetchJobs, fetchActiveScanTask]);

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue) {
        // Token was added, refresh data
        refreshAllData();
      }
    };
    
    // Also listen for custom events
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Add a small delay to ensure token validation is complete
        setTimeout(() => {
          refreshAllData();
        }, 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [refreshAllData]);

  // Poll for active scan updates
  useEffect(() => {
    if (state.activeScanTask) {
      const interval = setInterval(() => {
        fetchActiveScanTask();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [state.activeScanTask, fetchActiveScanTask]);

  // Auto-clear status messages
  useEffect(() => {
    if (state.statusMessage) {
      const timer = setTimeout(() => {
        clearStatusMessage();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.statusMessage, clearStatusMessage]);

  const value = {
    // State
    ...state,
    
    // API
    api: {
      get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
      post: (endpoint, data) => apiCall(endpoint, { method: 'POST', data }),
      put: (endpoint, data) => apiCall(endpoint, { method: 'PUT', data }),
      delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' })
    },
    
    // Asset actions
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    bulkDeleteAssets,
    
    // Discovered Devices actions
    fetchDiscoveredDevices,
    convertDeviceToAsset,
    
    // Device actions
    deleteDevice,
    bulkDeleteDevices,
    
    // Asset Group actions
    fetchAssetGroups,
    createAssetGroup,
    updateAssetGroup,
    deleteAssetGroup,
    
    
    // Credential actions
    fetchCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    
    // LDAP Configuration actions
    fetchLDAPConfigs,
    createLDAPConfig,
    updateLDAPConfig,
    deleteLDAPConfig,
    testLDAPConnection,
    syncLDAPUsers,
    
    // IP Range actions
    fetchIPRanges,
    createIPRange,
    updateIPRange,
    deleteIPRange,
    
    // Scan Task actions
    fetchScanTasks,
    fetchActiveScanTask,
    createScanTask,
    startScan: createScanTask, // Alias for backward compatibility
    cancelScanTask,
    cancelScan: cancelScanTask, // Alias for backward compatibility
    
    // Operation actions
    fetchOperations,
    fetchJobs,
    runOperation,
    
    // Admin/Settings actions
    fetchSettings,
    updateSettings,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchRoles,
    fetchScannerConfigs,
    runLanDiscovery,
    
    // UI actions
    setModal,
    closeModal,
    clearStatusMessage,
    refreshAllData,
    
    // Selection actions
    toggleAssetSelection,
    selectAllAssets,
    toggleDeviceSelection,
    selectAllDevices,
    
    // Direct dispatch for complex actions
    dispatch
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export { ActionTypes };

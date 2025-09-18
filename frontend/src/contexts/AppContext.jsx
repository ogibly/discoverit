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
  
  // Asset Groups
  assetGroups: [],
  selectedAssetGroups: [],
  selectedAssetGroup: null,
  
  // Labels
  labels: [],
  selectedLabels: [],
  
  // Scan Tasks
  scanTasks: [],
  activeScanTask: null,
  
  // Operations & Jobs
  operations: [],
  jobs: [],
  
  // UI State
  loading: {
    assets: false,
    assetGroups: false,
    labels: false,
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
  
  // Asset Groups
  SET_ASSET_GROUPS: 'SET_ASSET_GROUPS',
  SET_SELECTED_ASSET_GROUPS: 'SET_SELECTED_ASSET_GROUPS',
  SET_SELECTED_ASSET_GROUP: 'SET_SELECTED_ASSET_GROUP',
  ADD_ASSET_GROUP: 'ADD_ASSET_GROUP',
  UPDATE_ASSET_GROUP: 'UPDATE_ASSET_GROUP',
  DELETE_ASSET_GROUP: 'DELETE_ASSET_GROUP',
  
  // Labels
  SET_LABELS: 'SET_LABELS',
  SET_SELECTED_LABELS: 'SET_SELECTED_LABELS',
  ADD_LABEL: 'ADD_LABEL',
  UPDATE_LABEL: 'UPDATE_LABEL',
  DELETE_LABEL: 'DELETE_LABEL',
  
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
    
    // Labels
    case ActionTypes.SET_LABELS:
      return { ...state, labels: action.payload };
    case ActionTypes.SET_SELECTED_LABELS:
      return { ...state, selectedLabels: action.payload };
    case ActionTypes.ADD_LABEL:
      return { ...state, labels: [...state.labels, action.payload] };
    case ActionTypes.UPDATE_LABEL:
      return {
        ...state,
        labels: state.labels.map(label =>
          label.id === action.payload.id ? action.payload : label
        )
      };
    case ActionTypes.DELETE_LABEL:
      return { ...state, labels: state.labels.filter(label => label.id !== action.payload) };
    
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
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios({
        url: `${API_BASE}${endpoint}`,
        headers,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.response?.data?.detail || error.message });
      throw error;
    }
  }, [token]);

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

  // Label actions
  const fetchLabels = useCallback(async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'labels', value: true } });
    try {
      const labels = await apiCall('/labels');
      dispatch({ type: ActionTypes.SET_LABELS, payload: labels });
    } catch (error) {
      // Error already handled in apiCall
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'labels', value: false } });
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

  // Initial data fetch
  useEffect(() => {
    fetchAssets();
    fetchAssetGroups();
    fetchLabels();
    fetchScanTasks();
    fetchOperations();
    fetchJobs();
    fetchActiveScanTask();
  }, [fetchAssets, fetchAssetGroups, fetchLabels, fetchScanTasks, fetchOperations, fetchJobs, fetchActiveScanTask]);

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
    
    // Asset Group actions
    fetchAssetGroups,
    
    // Label actions
    fetchLabels,
    
    // Scan Task actions
    fetchScanTasks,
    fetchActiveScanTask,
    createScanTask,
    cancelScanTask,
    
    // Operation actions
    fetchOperations,
    fetchJobs,
    runOperation,
    
    // UI actions
    setModal,
    closeModal,
    clearStatusMessage,
    
    // Selection actions
    toggleAssetSelection,
    selectAllAssets,
    
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

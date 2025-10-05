/**
 * Enterprise State Management Store
 * Modular, performant, and scalable state management
 */

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// Store Configuration
const createStore = (name, initialState, reducers, actions) => {
  const StoreContext = createContext();
  
  const StoreProvider = ({ children }) => {
    const [state, dispatch] = useReducer((state, action) => {
      const reducer = reducers[action.type];
      if (reducer) {
        return reducer(state, action);
      }
      return state;
    }, initialState);
    
    const storeActions = useMemo(() => {
      const boundActions = {};
      Object.keys(actions).forEach(key => {
        boundActions[key] = (...args) => {
          const action = actions[key](...args);
          dispatch(action);
        };
      });
      return boundActions;
    }, []);
    
    const value = useMemo(() => ({
      ...state,
      ...storeActions,
      dispatch,
    }), [state, storeActions]);
    
    return (
      <StoreContext.Provider value={value}>
        {children}
      </StoreContext.Provider>
    );
  };
  
  const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return context;
  };
  
  return { StoreProvider, useStore };
};

// Asset Store
const assetInitialState = {
  assets: [],
  selectedAssets: [],
  selectedAsset: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    type: 'all',
    location: 'all',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
  sort: {
    field: 'name',
    direction: 'asc',
  },
};

const assetReducers = {
  SET_ASSETS: (state, action) => ({
    ...state,
    assets: action.payload,
    loading: false,
    error: null,
  }),
  SET_LOADING: (state, action) => ({
    ...state,
    loading: action.payload,
  }),
  SET_ERROR: (state, action) => ({
    ...state,
    error: action.payload,
    loading: false,
  }),
  SET_SELECTED_ASSETS: (state, action) => ({
    ...state,
    selectedAssets: action.payload,
  }),
  SET_SELECTED_ASSET: (state, action) => ({
    ...state,
    selectedAsset: action.payload,
  }),
  ADD_ASSET: (state, action) => ({
    ...state,
    assets: [...state.assets, action.payload],
  }),
  UPDATE_ASSET: (state, action) => ({
    ...state,
    assets: state.assets.map(asset =>
      asset.id === action.payload.id ? action.payload : asset
    ),
    selectedAsset: state.selectedAsset?.id === action.payload.id 
      ? action.payload 
      : state.selectedAsset,
  }),
  DELETE_ASSET: (state, action) => ({
    ...state,
    assets: state.assets.filter(asset => asset.id !== action.payload),
    selectedAsset: state.selectedAsset?.id === action.payload ? null : state.selectedAsset,
    selectedAssets: state.selectedAssets.filter(id => id !== action.payload),
  }),
  SET_FILTERS: (state, action) => ({
    ...state,
    filters: { ...state.filters, ...action.payload },
  }),
  SET_PAGINATION: (state, action) => ({
    ...state,
    pagination: { ...state.pagination, ...action.payload },
  }),
  SET_SORT: (state, action) => ({
    ...state,
    sort: action.payload,
  }),
};

const assetActions = {
  fetchAssets: () => ({ type: 'SET_LOADING', payload: true }),
  setAssets: (assets) => ({ type: 'SET_ASSETS', payload: assets }),
  setError: (error) => ({ type: 'SET_ERROR', payload: error }),
  setSelectedAssets: (assets) => ({ type: 'SET_SELECTED_ASSETS', payload: assets }),
  setSelectedAsset: (asset) => ({ type: 'SET_SELECTED_ASSET', payload: asset }),
  addAsset: (asset) => ({ type: 'ADD_ASSET', payload: asset }),
  updateAsset: (asset) => ({ type: 'UPDATE_ASSET', payload: asset }),
  deleteAsset: (id) => ({ type: 'DELETE_ASSET', payload: id }),
  setFilters: (filters) => ({ type: 'SET_FILTERS', payload: filters }),
  setPagination: (pagination) => ({ type: 'SET_PAGINATION', payload: pagination }),
  setSort: (sort) => ({ type: 'SET_SORT', payload: sort }),
};

export const { StoreProvider: AssetProvider, useStore: useAssetStore } = createStore(
  'Asset',
  assetInitialState,
  assetReducers,
  assetActions
);

// Device Store
const deviceInitialState = {
  devices: [],
  selectedDevices: [],
  selectedDevice: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    type: 'all',
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
};

const deviceReducers = {
  SET_DEVICES: (state, action) => ({
    ...state,
    devices: action.payload,
    loading: false,
    error: null,
  }),
  SET_LOADING: (state, action) => ({
    ...state,
    loading: action.payload,
  }),
  SET_ERROR: (state, action) => ({
    ...state,
    error: action.payload,
    loading: false,
  }),
  SET_SELECTED_DEVICES: (state, action) => ({
    ...state,
    selectedDevices: action.payload,
  }),
  SET_SELECTED_DEVICE: (state, action) => ({
    ...state,
    selectedDevice: action.payload,
  }),
  REMOVE_DEVICE: (state, action) => ({
    ...state,
    devices: state.devices.filter(device => device.id !== action.payload),
    selectedDevice: state.selectedDevice?.id === action.payload ? null : state.selectedDevice,
    selectedDevices: state.selectedDevices.filter(id => id !== action.payload),
  }),
  SET_FILTERS: (state, action) => ({
    ...state,
    filters: { ...state.filters, ...action.payload },
  }),
  SET_PAGINATION: (state, action) => ({
    ...state,
    pagination: { ...state.pagination, ...action.payload },
  }),
};

const deviceActions = {
  fetchDevices: () => ({ type: 'SET_LOADING', payload: true }),
  setDevices: (devices) => ({ type: 'SET_DEVICES', payload: devices }),
  setError: (error) => ({ type: 'SET_ERROR', payload: error }),
  setSelectedDevices: (devices) => ({ type: 'SET_SELECTED_DEVICES', payload: devices }),
  setSelectedDevice: (device) => ({ type: 'SET_SELECTED_DEVICE', payload: device }),
  removeDevice: (id) => ({ type: 'REMOVE_DEVICE', payload: id }),
  setFilters: (filters) => ({ type: 'SET_FILTERS', payload: filters }),
  setPagination: (pagination) => ({ type: 'SET_PAGINATION', payload: pagination }),
};

export const { StoreProvider: DeviceProvider, useStore: useDeviceStore } = createStore(
  'Device',
  deviceInitialState,
  deviceReducers,
  deviceActions
);

// UI Store
const uiInitialState = {
  theme: 'dark',
  sidebar: {
    collapsed: false,
    width: 280,
  },
  modals: {
    assetManager: false,
    deviceManager: false,
    settings: false,
  },
  notifications: [],
  loading: {
    global: false,
    assets: false,
    devices: false,
  },
  error: null,
};

const uiReducers = {
  SET_THEME: (state, action) => ({
    ...state,
    theme: action.payload,
  }),
  SET_SIDEBAR: (state, action) => ({
    ...state,
    sidebar: { ...state.sidebar, ...action.payload },
  }),
  SET_MODAL: (state, action) => ({
    ...state,
    modals: { ...state.modals, [action.payload.name]: action.payload.value },
  }),
  ADD_NOTIFICATION: (state, action) => ({
    ...state,
    notifications: [...state.notifications, action.payload],
  }),
  REMOVE_NOTIFICATION: (state, action) => ({
    ...state,
    notifications: state.notifications.filter(n => n.id !== action.payload),
  }),
  SET_LOADING: (state, action) => ({
    ...state,
    loading: { ...state.loading, ...action.payload },
  }),
  SET_ERROR: (state, action) => ({
    ...state,
    error: action.payload,
  }),
  CLEAR_ERROR: (state) => ({
    ...state,
    error: null,
  }),
};

const uiActions = {
  setTheme: (theme) => ({ type: 'SET_THEME', payload: theme }),
  setSidebar: (sidebar) => ({ type: 'SET_SIDEBAR', payload: sidebar }),
  setModal: (name, value) => ({ type: 'SET_MODAL', payload: { name, value } }),
  addNotification: (notification) => ({ 
    type: 'ADD_NOTIFICATION', 
    payload: { ...notification, id: Date.now() }
  }),
  removeNotification: (id) => ({ type: 'REMOVE_NOTIFICATION', payload: id }),
  setLoading: (loading) => ({ type: 'SET_LOADING', payload: loading }),
  setError: (error) => ({ type: 'SET_ERROR', payload: error }),
  clearError: () => ({ type: 'CLEAR_ERROR' }),
};

export const { StoreProvider: UIProvider, useStore: useUIStore } = createStore(
  'UI',
  uiInitialState,
  uiReducers,
  uiActions
);

// Combined Store Provider
export const StoreProvider = ({ children }) => {
  return (
    <UIProvider>
      <AssetProvider>
        <DeviceProvider>
          {children}
        </DeviceProvider>
      </AssetProvider>
    </UIProvider>
  );
};

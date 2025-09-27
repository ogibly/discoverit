import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit, 
  Tag, 
  Users, 
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Filter,
  Search
} from 'lucide-react';

const BulkAssetManager = ({ onClose, onSuccess }) => {
  const {
    assets,
    assetGroups,
    labels,
    fetchAssets,
    fetchAssetGroups,
    fetchLabels,
    createAsset,
    updateAsset,
    deleteAsset,
    addLabelsToAsset,
    addGroupsToAsset
  } = useApp();

  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [bulkOperation, setBulkOperation] = useState(null);
  const [operationData, setOperationData] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterLabel, setFilterLabel] = useState('');

  useEffect(() => {
    fetchAssets();
    fetchAssetGroups();
    fetchLabels();
  }, [fetchAssets, fetchAssetGroups, fetchLabels]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.primary_ip?.includes(searchTerm) ||
                         asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = !filterGroup || asset.asset_groups?.some(group => group.id.toString() === filterGroup);
    const matchesLabel = !filterLabel || asset.labels?.some(label => label.id.toString() === filterLabel);
    
    return matchesSearch && matchesGroup && matchesLabel;
  });

  const handleSelectAsset = (assetId) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(asset => asset.id)));
    }
  };

  const handleBulkOperation = async (operation) => {
    if (selectedAssets.size === 0) {
      alert('Please select assets to perform bulk operations');
      return;
    }

    setBulkOperation(operation);
    setOperationData({});
    setResults(null);
  };

  const executeBulkOperation = async () => {
    if (selectedAssets.size === 0) return;

    setLoading(true);
    const operationResults = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      switch (bulkOperation) {
        case 'update':
          for (const assetId of selectedAssets) {
            try {
              await updateAsset(assetId, operationData);
              operationResults.success++;
            } catch (error) {
              operationResults.failed++;
              operationResults.errors.push({
                assetId,
                error: error.message
              });
            }
          }
          break;

        case 'add_labels':
          for (const assetId of selectedAssets) {
            try {
              await addLabelsToAsset(assetId, operationData.labels);
              operationResults.success++;
            } catch (error) {
              operationResults.failed++;
              operationResults.errors.push({
                assetId,
                error: error.message
              });
            }
          }
          break;

        case 'add_groups':
          for (const assetId of selectedAssets) {
            try {
              await addGroupsToAsset(assetId, operationData.groups);
              operationResults.success++;
            } catch (error) {
              operationResults.failed++;
              operationResults.errors.push({
                assetId,
                error: error.message
              });
            }
          }
          break;

        case 'delete':
          for (const assetId of selectedAssets) {
            try {
              await deleteAsset(assetId);
              operationResults.success++;
            } catch (error) {
              operationResults.failed++;
              operationResults.errors.push({
                assetId,
                error: error.message
              });
            }
          }
          break;
      }

      setResults(operationResults);
      if (operationResults.success > 0) {
        fetchAssets();
        onSuccess?.();
      }
    } catch (error) {
      setResults({
        success: 0,
        failed: selectedAssets.size,
        errors: [{ error: error.message }]
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBulkOperationForm = () => {
    switch (bulkOperation) {
      case 'update':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Bulk Update Assets</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Owner
                </label>
                <Input
                  value={operationData.owner || ''}
                  onChange={(e) => setOperationData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="Enter owner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location
                </label>
                <Input
                  value={operationData.location || ''}
                  onChange={(e) => setOperationData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Department
                </label>
                <Input
                  value={operationData.department || ''}
                  onChange={(e) => setOperationData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <Input
                  value={operationData.description || ''}
                  onChange={(e) => setOperationData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                />
              </div>
            </div>
          </div>
        );

      case 'add_labels':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Add Labels to Assets</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Labels
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {labels.map(label => (
                  <label key={label.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={operationData.labels?.includes(label.id) || false}
                      onChange={(e) => {
                        const labels = operationData.labels || [];
                        if (e.target.checked) {
                          setOperationData(prev => ({
                            ...prev,
                            labels: [...labels, label.id]
                          }));
                        } else {
                          setOperationData(prev => ({
                            ...prev,
                            labels: labels.filter(id => id !== label.id)
                          }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <span className="text-sm text-slate-300">{label.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'add_groups':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Add to Asset Groups</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Groups
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {assetGroups.map(group => (
                  <label key={group.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={operationData.groups?.includes(group.id) || false}
                      onChange={(e) => {
                        const groups = operationData.groups || [];
                        if (e.target.checked) {
                          setOperationData(prev => ({
                            ...prev,
                            groups: [...groups, group.id]
                          }));
                        } else {
                          setOperationData(prev => ({
                            ...prev,
                            groups: groups.filter(id => id !== group.id)
                          }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                    />
                    <span className="text-sm text-slate-300">{group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-400">Delete Assets</span>
              </div>
              <p className="text-sm text-slate-300">
                This will permanently delete {selectedAssets.size} selected assets. This action cannot be undone.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type "DELETE" to confirm
              </label>
              <Input
                value={operationData.confirmation || ''}
                onChange={(e) => setOperationData(prev => ({ ...prev, confirmation: e.target.value }))}
                placeholder="Type DELETE to confirm"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canExecuteOperation = () => {
    switch (bulkOperation) {
      case 'delete':
        return operationData.confirmation === 'DELETE';
      case 'add_labels':
        return operationData.labels && operationData.labels.length > 0;
      case 'add_groups':
        return operationData.groups && operationData.groups.length > 0;
      case 'update':
        return Object.keys(operationData).some(key => operationData[key]);
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Bulk Asset Manager</h2>
              <p className="text-slate-400 mt-1">
                {selectedAssets.size} of {filteredAssets.length} assets selected
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Asset List */}
          <div className="w-1/2 border-r border-slate-800 flex flex-col">
            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-800">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="">All Groups</option>
                    {assetGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="">All Labels</option>
                    {labels.map(label => (
                      <option key={label.id} value={label.id}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white"
                  >
                    {selectedAssets.size === filteredAssets.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span className="text-sm">Select All</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selectedAssets.has(asset.id)
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-700 hover:border-slate-600"
                      )}
                      onClick={() => handleSelectAsset(asset.id)}
                    >
                      {selectedAssets.has(asset.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {asset.name}
                        </div>
                        <div className="text-sm text-slate-400">
                          {asset.primary_ip} • {asset.hostname}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {asset.labels?.slice(0, 2).map(label => (
                          <Badge key={label.id} variant="outline" className="text-xs">
                            {label.name}
                          </Badge>
                        ))}
                        {asset.labels?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{asset.labels.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Operations */}
          <div className="w-1/2 flex flex-col">
            {!bulkOperation ? (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bulk Operations</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleBulkOperation('update')}
                    className="w-full justify-start"
                    disabled={selectedAssets.size === 0}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Properties
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkOperation('add_labels')}
                    className="w-full justify-start"
                    disabled={selectedAssets.size === 0}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Add Labels
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkOperation('add_groups')}
                    className="w-full justify-start"
                    disabled={selectedAssets.size === 0}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Add to Groups
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBulkOperation('delete')}
                    className="w-full justify-start text-red-400 border-red-500 hover:bg-red-500/10"
                    disabled={selectedAssets.size === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Assets
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="p-6 flex-1 overflow-y-auto">
                  {renderBulkOperationForm()}
                </div>
                
                <div className="border-t border-slate-800 p-6">
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBulkOperation(null);
                        setOperationData({});
                        setResults(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={executeBulkOperation}
                      disabled={!canExecuteOperation() || loading}
                      className="flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Execute</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="border-t border-slate-800 p-6">
                <h4 className="font-medium text-white mb-3">Operation Results</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-slate-300">
                      {results.success} successful
                    </span>
                  </div>
                  {results.failed > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-slate-300">
                        {results.failed} failed
                      </span>
                    </div>
                  )}
                </div>
                {results.errors.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-400 mb-1">
                        {error.assetId ? `Asset ${error.assetId}: ` : ''}{error.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAssetManager;

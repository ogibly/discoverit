import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';
import { 
  Brain, 
  Users, 
  Tag, 
  Network, 
  MapPin, 
  Building, 
  Server, 
  Monitor,
  Router,
  Smartphone,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Settings,
  Zap
} from 'lucide-react';

const SmartAssetGrouping = ({ onClose, onSuccess }) => {
  const {
    assets,
    assetGroups,
    fetchAssets,
    fetchAssetGroups,
    createAssetGroup,
    updateAssetGroup
  } = useApp();

  const [groupingMode, setGroupingMode] = useState('auto'); // 'auto', 'manual', 'template'
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [groupingRules, setGroupingRules] = useState({
    byLocation: true,
    byDepartment: true,
    byDeviceType: true,
    byNetwork: true,
    byOS: false,
    byManufacturer: false
  });
  const [suggestedGroups, setSuggestedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchAssets();
    fetchAssetGroups();
  }, [fetchAssets, fetchAssetGroups]);

  useEffect(() => {
    if (groupingMode === 'auto') {
      generateSuggestedGroups();
    }
  }, [groupingMode, groupingRules, assets]);

  const generateSuggestedGroups = () => {
    const groups = [];
    const processedAssets = new Set();

    // Group by location
    if (groupingRules.byLocation) {
      const locationGroups = {};
      assets.forEach(asset => {
        if (asset.location && !processedAssets.has(asset.id)) {
          const key = asset.location.toLowerCase();
          if (!locationGroups[key]) {
            locationGroups[key] = {
              name: `Location: ${asset.location}`,
              description: `Assets located in ${asset.location}`,
              assets: [],
              criteria: { location: asset.location },
              icon: MapPin,
              color: 'blue'
            };
          }
          locationGroups[key].assets.push(asset);
          processedAssets.add(asset.id);
        }
      });
      groups.push(...Object.values(locationGroups));
    }

    // Group by department
    if (groupingRules.byDepartment) {
      const departmentGroups = {};
      assets.forEach(asset => {
        if (asset.department && !processedAssets.has(asset.id)) {
          const key = asset.department.toLowerCase();
          if (!departmentGroups[key]) {
            departmentGroups[key] = {
              name: `Department: ${asset.department}`,
              description: `Assets belonging to ${asset.department} department`,
              assets: [],
              criteria: { department: asset.department },
              icon: Building,
              color: 'green'
            };
          }
          departmentGroups[key].assets.push(asset);
          processedAssets.add(asset.id);
        }
      });
      groups.push(...Object.values(departmentGroups));
    }

    // Group by device type
    if (groupingRules.byDeviceType) {
      const deviceTypeGroups = {};
      assets.forEach(asset => {
        if (asset.device_type && !processedAssets.has(asset.id)) {
          const key = asset.device_type.toLowerCase();
          if (!deviceTypeGroups[key]) {
            const iconMap = {
              server: Server,
              workstation: Monitor,
              switch: Network,
              router: Router,
              mobile: Smartphone
            };
            deviceTypeGroups[key] = {
              name: `${asset.device_type.charAt(0).toUpperCase() + asset.device_type.slice(1)}s`,
              description: `All ${asset.device_type} devices`,
              assets: [],
              criteria: { device_type: asset.device_type },
              icon: iconMap[asset.device_type] || Server,
              color: 'purple'
            };
          }
          deviceTypeGroups[key].assets.push(asset);
          processedAssets.add(asset.id);
        }
      });
      groups.push(...Object.values(deviceTypeGroups));
    }

    // Group by network subnet
    if (groupingRules.byNetwork) {
      const networkGroups = {};
      assets.forEach(asset => {
        if (asset.primary_ip && !processedAssets.has(asset.id)) {
          const subnet = asset.primary_ip.split('.').slice(0, 3).join('.') + '.0/24';
          if (!networkGroups[subnet]) {
            networkGroups[subnet] = {
              name: `Network: ${subnet}`,
              description: `Assets in ${subnet} network`,
              assets: [],
              criteria: { network: subnet },
              icon: Network,
              color: 'orange'
            };
          }
          networkGroups[subnet].assets.push(asset);
          processedAssets.add(asset.id);
        }
      });
      groups.push(...Object.values(networkGroups));
    }

    // Group by OS
    if (groupingRules.byOS) {
      const osGroups = {};
      assets.forEach(asset => {
        if (asset.os_family && !processedAssets.has(asset.id)) {
          const key = asset.os_family.toLowerCase();
          if (!osGroups[key]) {
            osGroups[key] = {
              name: `OS: ${asset.os_family}`,
              description: `Assets running ${asset.os_family}`,
              assets: [],
              criteria: { os_family: asset.os_family },
              icon: Monitor,
              color: 'indigo'
            };
          }
          osGroups[key].assets.push(asset);
          processedAssets.add(asset.id);
        }
      });
      groups.push(...Object.values(osGroups));
    }

    // Group by manufacturer
    if (groupingRules.byManufacturer) {
      const manufacturerGroups = {};
      assets.forEach(asset => {
        if (asset.manufacturer && !processedAssets.has(asset.id)) {
          const key = asset.manufacturer.toLowerCase();
          if (!manufacturerGroups[key]) {
            manufacturerGroups[key] = {
              name: `Manufacturer: ${asset.manufacturer}`,
              description: `Assets manufactured by ${asset.manufacturer}`,
              assets: [],
              criteria: { manufacturer: asset.manufacturer },
              icon: Server,
              color: 'teal'
            };
          }
          manufacturerGroups[key].assets.push(asset);
          processedAssets.add(asset.id);
        }
      });
      groups.push(...Object.values(manufacturerGroups));
    }

    // Filter out groups with less than 2 assets
    setSuggestedGroups(groups.filter(group => group.assets.length >= 2));
  };

  const handleCreateGroups = async () => {
    setLoading(true);
    const results = {
      created: 0,
      failed: 0,
      errors: []
    };

    try {
      for (const group of suggestedGroups) {
        try {
          await createAssetGroup({
            name: group.name,
            description: group.description,
            asset_ids: group.assets.map(asset => asset.id),
            criteria: group.criteria
          });
          results.created++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            group: group.name,
            error: error.message
          });
        }
      }

      setResults(results);
      if (results.created > 0) {
        fetchAssetGroups();
        onSuccess?.();
      }
    } catch (error) {
      setResults({
        created: 0,
        failed: suggestedGroups.length,
        errors: [{ error: error.message }]
      });
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'border-blue-500 bg-blue-500/10 text-blue-400',
      green: 'border-green-500 bg-green-500/10 text-green-400',
      purple: 'border-purple-500 bg-purple-500/10 text-purple-400',
      orange: 'border-orange-500 bg-orange-500/10 text-orange-400',
      indigo: 'border-indigo-500 bg-indigo-500/10 text-indigo-400',
      teal: 'border-teal-500 bg-teal-500/10 text-teal-400'
    };
    return colorMap[color] || 'border-slate-500 bg-slate-500/10 text-slate-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Brain className="w-6 h-6" />
                <span>Smart Asset Grouping</span>
              </h2>
              <p className="text-slate-400 mt-1">
                Automatically group assets based on common characteristics
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
          {/* Left Panel - Configuration */}
          <div className="w-1/3 border-r border-slate-800 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Grouping Mode</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="auto"
                      checked={groupingMode === 'auto'}
                      onChange={(e) => setGroupingMode(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600"
                    />
                    <span className="text-slate-300">Automatic Grouping</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="manual"
                      checked={groupingMode === 'manual'}
                      onChange={(e) => setGroupingMode(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600"
                    />
                    <span className="text-slate-300">Manual Selection</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="template"
                      checked={groupingMode === 'template'}
                      onChange={(e) => setGroupingMode(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600"
                    />
                    <span className="text-slate-300">Template-Based</span>
                  </label>
                </div>
              </div>

              {groupingMode === 'auto' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Grouping Rules</h3>
                  <div className="space-y-3">
                    {Object.entries(groupingRules).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setGroupingRules(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
                        />
                        <span className="text-slate-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Assets:</span>
                    <span className="text-white">{assets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Existing Groups:</span>
                    <span className="text-white">{assetGroups.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Suggested Groups:</span>
                    <span className="text-white">{suggestedGroups.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Suggested Groups */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Suggested Groups</h3>
              {suggestedGroups.length > 0 && (
                <Button
                  onClick={handleCreateGroups}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Create All Groups</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {suggestedGroups.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-300 mb-2">
                  No Groups Suggested
                </h4>
                <p className="text-slate-400">
                  Try adjusting the grouping rules or check if you have enough assets with common characteristics.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {suggestedGroups.map((group, index) => {
                  const Icon = group.icon;
                  return (
                    <Card key={index} className={cn("border-2", getColorClasses(group.color))}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <div>
                              <CardTitle className="text-lg">{group.name}</CardTitle>
                              <p className="text-sm text-slate-400">{group.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {group.assets.length} assets
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(group.criteria).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-slate-300 mb-2">
                              Assets in this group:
                            </h5>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                              {group.assets.slice(0, 10).map(asset => (
                                <div key={asset.id} className="text-xs text-slate-400">
                                  {asset.name} ({asset.primary_ip})
                                </div>
                              ))}
                              {group.assets.length > 10 && (
                                <div className="text-xs text-slate-500">
                                  +{group.assets.length - 10} more...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="border-t border-slate-800 p-6">
            <h4 className="font-medium text-white mb-3">Operation Results</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-slate-300">
                  {results.created} groups created successfully
                </span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-slate-300">
                    {results.failed} groups failed to create
                  </span>
                </div>
              )}
            </div>
            {results.errors.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-400 mb-1">
                    {error.group ? `${error.group}: ` : ''}{error.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAssetGrouping;

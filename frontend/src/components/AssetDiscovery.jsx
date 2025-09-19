import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, Modal, Badge, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from './ui';

const AssetDiscovery = () => {
  const { api, assets, activeScanTask, startScan, cancelScan } = useApp();
  const { user } = useAuth();
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryData, setDiscoveryData] = useState({
    target: '',
    scanType: 'comprehensive',
    name: '',
    description: '',
    autoCreateAssets: true,
    autoAssignLabels: [],
    autoAssignGroups: []
  });
  const [availableLabels, setAvailableLabels] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [discoveryHistory, setDiscoveryHistory] = useState([]);
  const [scanStatistics, setScanStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan', description: 'Fast port scan and basic OS detection', icon: '⚡' },
    { value: 'comprehensive', label: 'Comprehensive Scan', description: 'Full port scan, OS detection, and service enumeration', icon: '🔍' },
    { value: 'snmp', label: 'SNMP Scan', description: 'SNMP-based device discovery and information gathering', icon: '📡' },
    { value: 'arp', label: 'ARP Scan', description: 'ARP table discovery for local network devices', icon: '🌐' },
    { value: 'arp_table', label: 'ARP Table', description: 'Read existing ARP table from gateway', icon: '📋' }
  ];

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  const loadDiscoveryData = async () => {
    try {
      const [labelsResponse, groupsResponse, historyResponse, statsResponse] = await Promise.all([
        api.get('/labels'),
        api.get('/asset-groups'),
        api.get('/scan-tasks?limit=10'),
        api.get('/scan-tasks/statistics')
      ]);
      
      setAvailableLabels(labelsResponse.data);
      setAvailableGroups(groupsResponse.data);
      setDiscoveryHistory(historyResponse.data);
      setScanStatistics(statsResponse.data);
    } catch (error) {
      console.error('Failed to load discovery data:', error);
    }
  };

  const handleStartDiscovery = async () => {
    try {
      const scanData = {
        name: discoveryData.name || `Discovery: ${discoveryData.target}`,
        target: discoveryData.target,
        scan_type: discoveryData.scanType,
        created_by: user?.id?.toString() || "1"
      };

      await startScan(scanData);
      setShowDiscoveryModal(false);
      resetDiscoveryData();
      loadDiscoveryData();
    } catch (error) {
      console.error('Failed to start discovery:', error);
      alert('Failed to start discovery: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancelDiscovery = async () => {
    if (!confirm('Are you sure you want to cancel the current discovery?')) return;
    
    try {
      await cancelScan();
      loadDiscoveryData();
    } catch (error) {
      console.error('Failed to cancel discovery:', error);
    }
  };

  const resetDiscoveryData = () => {
    setDiscoveryData({
      target: '',
      scanType: 'comprehensive',
      name: '',
      description: '',
      autoCreateAssets: true,
      autoAssignLabels: [],
      autoAssignGroups: []
    });
  };

  const getScanTypeInfo = (type) => {
    return scanTypes.find(t => t.value === type) || { label: type, description: '', icon: '❓' };
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'running': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100',
      'cancelled': 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const formatTarget = (target) => {
    if (target.includes('/')) {
      return `Subnet: ${target}`;
    } else if (target.includes('-')) {
      return `Range: ${target}`;
    } else {
      return `IP: ${target}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Discovery</h1>
          <p className="text-slate-600">Discover and inventory network devices automatically</p>
        </div>
        <Button onClick={() => setShowDiscoveryModal(true)}>
          + Start Discovery
        </Button>
      </div>

      {/* Statistics */}
      {scanStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">{scanStatistics.total_scans}</div>
            <div className="text-sm text-slate-600">Total Discoveries</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">{scanStatistics.completed_scans}</div>
            <div className="text-sm text-slate-600">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{scanStatistics.running_scans}</div>
            <div className="text-sm text-slate-600">Running</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">{(assets || []).length}</div>
            <div className="text-sm text-slate-600">Discovered Assets</div>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="discover">Discovery</TabsTrigger>
          <TabsTrigger value="active">Active Scan</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="assets">Discovered Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Discovery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scanTypes.map(scanType => (
                  <Card key={scanType.value} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                    setDiscoveryData({...discoveryData, scanType: scanType.value});
                    setShowDiscoveryModal(true);
                  }}>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{scanType.icon}</span>
                      <div>
                        <h4 className="font-medium text-slate-900">{scanType.label}</h4>
                        <p className="text-sm text-slate-600">{scanType.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Common Discovery Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Local Networks</h4>
                  <div className="space-y-1">
                    {['192.168.1.0/24', '192.168.0.0/24', '10.0.0.0/24', '172.16.0.0/24'].map(subnet => (
                      <button
                        key={subnet}
                        onClick={() => {
                          setDiscoveryData({...discoveryData, target: subnet});
                          setShowDiscoveryModal(true);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
                      >
                        {subnet}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Office Networks</h4>
                  <div className="space-y-1">
                    {['192.168.10.0/24', '192.168.20.0/24', '10.10.0.0/16', '172.20.0.0/16'].map(subnet => (
                      <button
                        key={subnet}
                        onClick={() => {
                          setDiscoveryData({...discoveryData, target: subnet});
                          setShowDiscoveryModal(true);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md"
                      >
                        {subnet}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {activeScanTask ? (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{activeScanTask.name}</h3>
                    <p className="text-sm text-slate-600">{formatTarget(activeScanTask.target)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(activeScanTask.status)}>
                      {activeScanTask.status}
                    </Badge>
                    <Button variant="secondary" size="sm" onClick={handleCancelDiscovery}>
                      Cancel
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                      <span>Progress</span>
                      <span>{activeScanTask.progress || 0}%</span>
                    </div>
                    <Progress value={activeScanTask.progress || 0} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Current IP:</span>
                      <div className="font-mono">{activeScanTask.current_ip || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Completed:</span>
                      <div>{activeScanTask.completed_ips || 0} / {activeScanTask.total_ips || 0}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Scan Type:</span>
                      <div>{getScanTypeInfo(activeScanTask.scan_type).label}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Started:</span>
                      <div>{activeScanTask.start_time ? new Date(activeScanTask.start_time).toLocaleTimeString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Discovery</h3>
                <p className="text-slate-600 mb-4">Start a new discovery to begin scanning your network</p>
                <Button onClick={() => setShowDiscoveryModal(true)}>
                  Start Discovery
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Discovery History</h3>
              <div className="space-y-3">
                {(discoveryHistory || []).map(scan => (
                  <div key={scan.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getScanTypeInfo(scan.scan_type).icon}</span>
                      <div>
                        <div className="font-medium">{scan.name}</div>
                        <div className="text-sm text-slate-600">
                          {formatTarget(scan.target)} • {scan.completed_ips || 0} assets discovered
                        </div>
                        <div className="text-xs text-slate-500">
                          {scan.start_time ? new Date(scan.start_time).toLocaleString() : 'Unknown time'}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(scan.status)}>
                      {scan.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Discovered Assets ({(assets || []).length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(assets || []).slice(0, 12).map(asset => (
                  <Card key={asset.id} className="p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{asset.name}</h4>
                        <p className="text-sm text-slate-600">{asset.primary_ip}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-slate-500">
                      {asset.hostname && <div>Hostname: {asset.hostname}</div>}
                      {asset.os_name && <div>OS: {asset.os_name}</div>}
                      {asset.manufacturer && <div>Manufacturer: {asset.manufacturer}</div>}
                      <div>Last seen: {asset.last_seen ? new Date(asset.last_seen).toLocaleDateString() : 'Never'}</div>
                    </div>
                  </Card>
                ))}
              </div>
              {(assets || []).length > 12 && (
                <div className="text-center mt-4">
                  <Button variant="secondary">
                    View All Assets ({(assets || []).length})
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Discovery Modal */}
      <Modal
        isOpen={showDiscoveryModal}
        onClose={() => {
          setShowDiscoveryModal(false);
          resetDiscoveryData();
        }}
        title="Start Asset Discovery"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Discovery Target *
            </label>
            <Input
              value={discoveryData.target}
              onChange={(e) => setDiscoveryData({...discoveryData, target: e.target.value})}
              placeholder="192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter IP address, IP range (1.1.1.1-1.1.1.100), or subnet (1.1.1.0/24)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scan Type *
            </label>
            <div className="space-y-2">
              {scanTypes.map(scanType => (
                <label key={scanType.value} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="scanType"
                    value={scanType.value}
                    checked={discoveryData.scanType === scanType.value}
                    onChange={(e) => setDiscoveryData({...discoveryData, scanType: e.target.value})}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg">{scanType.icon}</span>
                  <div>
                    <div className="font-medium text-slate-900">{scanType.label}</div>
                    <div className="text-sm text-slate-600">{scanType.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discovery Name
              </label>
              <Input
                value={discoveryData.name}
                onChange={(e) => setDiscoveryData({...discoveryData, name: e.target.value})}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <Input
                value={discoveryData.description}
                onChange={(e) => setDiscoveryData({...discoveryData, description: e.target.value})}
                placeholder="Optional description"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Auto-Assignment</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoCreateAssets"
                checked={discoveryData.autoCreateAssets}
                onChange={(e) => setDiscoveryData({...discoveryData, autoCreateAssets: e.target.checked})}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoCreateAssets" className="text-sm font-medium text-slate-700">
                Automatically create assets from discovered devices
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Auto-assign Labels
              </label>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2">
                {(availableLabels || []).map(label => (
                  <label key={label.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={discoveryData.autoAssignLabels.includes(label.id)}
                      onChange={(e) => {
                        const newLabels = e.target.checked
                          ? [...discoveryData.autoAssignLabels, label.id]
                          : discoveryData.autoAssignLabels.filter(id => id !== label.id);
                        setDiscoveryData({...discoveryData, autoAssignLabels: newLabels});
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{label.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Auto-assign Groups
              </label>
              <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md p-2">
                {(availableGroups || []).map(group => (
                  <label key={group.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={discoveryData.autoAssignGroups.includes(group.id)}
                      onChange={(e) => {
                        const newGroups = e.target.checked
                          ? [...discoveryData.autoAssignGroups, group.id]
                          : discoveryData.autoAssignGroups.filter(id => id !== group.id);
                        setDiscoveryData({...discoveryData, autoAssignGroups: newGroups});
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{group.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowDiscoveryModal(false);
              resetDiscoveryData();
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartDiscovery}
            disabled={!discoveryData.target}
          >
            Start Discovery
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AssetDiscovery;

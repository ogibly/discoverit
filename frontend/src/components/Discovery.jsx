import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';
import ScansTracker from './discovery/ScansTracker';
import ScanResultsModal from './discovery/ScanResultsModal';
import ScanNotifications from './discovery/ScanNotifications';
import DiscoveryWizard from './discovery/DiscoveryWizard';
import SatelliteScannerDashboard from './scanners/SatelliteScannerDashboard';
import { 
  Plus, 
  Target, 
  Network, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Satellite,
  Play,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
// Removed useScanUpdates import - using AppContext polling instead

const Discovery = () => {
  const {
    scanTasks,
    activeScanTask,
    discoveredDevices,
    loading,
    fetchScanTasks,
    fetchActiveScanTask,
    fetchDiscoveredDevices,
    cancelScanTask
  } = useApp();

  // Simple state management
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedScanTask, setSelectedScanTask] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showSatelliteDashboard, setShowSatelliteDashboard] = useState(false);

  useEffect(() => {
    fetchScanTasks();
    fetchActiveScanTask();
    fetchDiscoveredDevices();
  }, [fetchScanTasks, fetchActiveScanTask, fetchDiscoveredDevices]);

  // Handle scan completion
  useEffect(() => {
    if (activeScanTask && (activeScanTask.status === 'completed' || activeScanTask.status === 'failed')) {
      // Refresh data when scan completes
      fetchScanTasks();
      fetchDiscoveredDevices();
    }
  }, [activeScanTask, fetchScanTasks, fetchDiscoveredDevices]);

  const handleWizardComplete = (result) => {
    setShowWizard(false);
    // Refresh data to show the new scan
    fetchScanTasks();
    fetchActiveScanTask();
  };

  const handleViewResults = async (scanId) => {
    const scanTask = scanTasks.find(task => task.id === scanId);
    if (scanTask) {
      setSelectedScanTask(scanTask);
      setResultsModalOpen(true);
    }
  };

  const handleDownloadResults = (scanId) => {
    // Download scan results - this will be handled by the modal
    console.log('Download results for scan:', scanId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Play className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title="Network Discovery"
        subtitle="Discover and analyze devices in your network"
      />

      {/* Action Bar */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {activeScanTask ? (
                  <span className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-blue-400" />
                    <span>Scan in progress: {activeScanTask.name}</span>
                  </span>
                ) : (
                  <span>Ready to discover devices</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSatelliteDashboard(true)}
                className="flex items-center space-x-2"
              >
                <Satellite className="w-4 h-4" />
                <span>Manage Scanners</span>
              </Button>
              <Button
                onClick={() => setShowWizard(true)}
                className="flex items-center space-x-2"
                disabled={!!activeScanTask}
              >
                <Plus className="w-4 h-4" />
                <span>Start New Discovery</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Active Scan Status */}
          {activeScanTask && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{activeScanTask.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Target: {activeScanTask.target} • 
                        {activeScanTask.progress !== null ? ` Progress: ${activeScanTask.progress}%` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeScanTask.progress !== null && (
                      <div className="w-32">
                        <Progress value={activeScanTask.progress} className="h-2" />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelScanTask(activeScanTask.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Scans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Scan Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Scans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scanTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Scans Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your first discovery scan to see results here.
                    </p>
                    <Button onClick={() => setShowWizard(true)}>
                      Start First Scan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scanTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn("flex items-center space-x-1", getStatusColor(task.status))}>
                            {getStatusIcon(task.status)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{task.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.target} • {new Date(task.start_time).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewResults(task.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadResults(task.id)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discovered Devices Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="w-5 h-5" />
                  <span>Discovered Devices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discoveredDevices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🖥️</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Devices Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Run a discovery scan to find devices on your network.
                    </p>
                    <Button onClick={() => setShowWizard(true)}>
                      Discover Devices
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Devices</span>
                      <Badge variant="secondary">{discoveredDevices.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {discoveredDevices.slice(0, 5).map((device, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border border-border rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm font-medium">
                              {device.hostname || device.ip_address || 'Unknown Device'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {device.ip_address}
                          </span>
                        </div>
                      ))}
                      {discoveredDevices.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{discoveredDevices.length - 5} more devices
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setShowWizard(true)}
                  disabled={!!activeScanTask}
                >
                  <Target className="w-6 h-6" />
                  <span>New Discovery Scan</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setShowSatelliteDashboard(true)}
                >
                  <Satellite className="w-6 h-6" />
                  <span>Manage Scanners</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => {
                    // Navigate to assets view
                    console.log('Navigate to assets');
                  }}
                >
                  <Network className="w-6 h-6" />
                  <span>View All Assets</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Modal */}
      <ScanResultsModal
        isOpen={resultsModalOpen}
        onClose={() => {
          setResultsModalOpen(false);
          setSelectedScanTask(null);
        }}
        scanTask={selectedScanTask}
        scanResults={discoveredDevices}
      />

      {/* Scan Notifications */}
      <ScanNotifications
        activeScanTask={activeScanTask}
        scanTasks={scanTasks}
        position="top-right"
      />

      {/* Discovery Wizard Modal */}
      {showWizard && (
        <DiscoveryWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* Satellite Scanner Dashboard Modal */}
      {showSatelliteDashboard && (
        <SatelliteScannerDashboard
          onClose={() => setShowSatelliteDashboard(false)}
        />
      )}
    </div>
  );
};

export default Discovery;


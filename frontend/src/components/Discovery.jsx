import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';
import ScanResultsModal from './discovery/ScanResultsModal';
import ScanNotifications from './discovery/ScanNotifications';
import DiscoveryWizard from './discovery/DiscoveryWizard';
import { 
  Plus, 
  Play,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronRight,
  Network,
  ExternalLink
} from 'lucide-react';

const Discovery = () => {
  const {
    scanTasks,
    activeScanTask,
    loading,
    fetchScanTasks,
    fetchActiveScanTask,
    cancelScanTask
  } = useApp();

  // Simple state management
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedScanTask, setSelectedScanTask] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [expandedScans, setExpandedScans] = useState(new Set());

  useEffect(() => {
    fetchScanTasks();
    fetchActiveScanTask();
  }, [fetchScanTasks, fetchActiveScanTask]);

  // Handle scan completion
  useEffect(() => {
    if (activeScanTask && (activeScanTask.status === 'completed' || activeScanTask.status === 'failed')) {
      // Refresh data when scan completes
      fetchScanTasks();
    }
  }, [activeScanTask, fetchScanTasks]);

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

  const handleDownloadResults = async (scanId) => {
    try {
      // Create download URL for scan results
      const downloadUrl = `/api/v2/scan-tasks/${scanId}/download`;
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `scan-results-${scanId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download scan results:', error);
      alert('Failed to download scan results. Please try again.');
    }
  };

  const toggleScanExpansion = (scanId) => {
    setExpandedScans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scanId)) {
        newSet.delete(scanId);
      } else {
        newSet.add(scanId);
      }
      return newSet;
    });
  };

  const handleViewDevices = (scanTask) => {
    // Navigate to devices page with scan filter
    const devicesUrl = `/devices?scan_task_id=${scanTask.id}&scan_name=${encodeURIComponent(scanTask.name)}`;
    window.open(devicesUrl, '_blank');
  };

  const formatScanDate = (startTime) => {
    // Handle null/undefined start_time
    if (!startTime) return 'Pending';
    
    const date = new Date(startTime);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* 1. Start New Discovery Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowWizard(true)}
              className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
              disabled={!!activeScanTask}
              size="lg"
            >
              <Plus className="w-5 h-5" />
              <span>Start New Discovery</span>
            </Button>
          </div>

          {/* 2. Current Running Scans */}
          {activeScanTask && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  <span>Current Running Scan</span>
                </CardTitle>
              </CardHeader>
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
                      {activeScanTask.current_ip && (
                        <p className="text-sm text-blue-400 font-mono">
                          Currently scanning: {activeScanTask.current_ip}
                        </p>
                      )}
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
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Scans History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Scans History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanTasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Scans Yet</h3>
                  <p className="text-muted-foreground">
                    Use the "Start New Discovery" button above to begin your first network scan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanTasks.map((task) => {
                    const isExpanded = expandedScans.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className="border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {/* Main scan entry - clickable */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => toggleScanExpansion(task.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div className={cn("flex items-center space-x-2", getStatusColor(task.status))}>
                                {getStatusIcon(task.status)}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{task.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.target} • {formatScanDate(task.start_time)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewResults(task.id);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadResults(task.id);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border">
                            <div className="pt-4 space-y-4">
                              {/* Scan Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <div className="mt-1">
                                    <Badge className={cn("text-xs", 
                                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                      task.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    )}>
                                      {task.status || 'unknown'}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Progress:</span>
                                  <p className="mt-1 font-mono">
                                    {task.progress !== null ? `${task.progress}%` : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Discovered:</span>
                                  <p className="mt-1 font-mono">
                                    {task.discovered_devices || 0} devices
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration:</span>
                                  <p className="mt-1 font-mono">
                                    {task.start_time && task.end_time 
                                      ? formatScanDate(task.start_time) 
                                      : 'In progress'
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-3 pt-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleViewDevices(task)}
                                  className="flex items-center space-x-2"
                                >
                                  <Network className="w-4 h-4" />
                                  <span>View Devices</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewResults(task.id)}
                                  className="flex items-center space-x-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View Results</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadResults(task.id)}
                                  className="flex items-center space-x-2"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
        scanResults={[]}
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
    </div>
  );
};

export default Discovery;
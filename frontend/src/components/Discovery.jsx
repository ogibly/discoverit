import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';
import { 
  TargetOption, 
  IntensityOption, 
  LiveProgressTracker, 
  ResultsView,
  SmartTargetInput
} from './discovery/DiscoveryComponents';
import ScansTracker from './discovery/ScansTracker';
import ScanResultsModal from './discovery/ScanResultsModal';
import ScanNotifications from './discovery/ScanNotifications';
import DiscoveryWizard from './discovery/DiscoveryWizard';
import SatelliteScannerDashboard from './scanners/SatelliteScannerDashboard';
import { 
  Zap, 
  Target, 
  Settings, 
  Network, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Satellite
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
    createScanTask,
    cancelScanTask,
    dispatch,
    api
  } = useApp();

  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [scanConfig, setScanConfig] = useState({
    name: '',
    target: '',
    intensity: 'standard',
    scannerType: 'auto'
  });
  const [availableScanners, setAvailableScanners] = useState([]);
  const [selectedScanner, setSelectedScanner] = useState(null);
  const [scannerSuggestion, setScannerSuggestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCheckingScanner, setIsCheckingScanner] = useState(false);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedScanTask, setSelectedScanTask] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showSatelliteDashboard, setShowSatelliteDashboard] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState('wizard'); // 'wizard' or 'quick'

  // Step definitions
  const steps = [
    { id: 1, title: 'Start Scan', description: 'Choose to run a new discovery scan' },
    { id: 2, title: 'Select Target', description: 'Choose what to scan from your IP scope' },
    { id: 3, title: 'Scanner Check', description: 'System checks for optimal scanner' },
    { id: 4, title: 'Set Intensity', description: 'Choose scan quality and data amount' },
    { id: 5, title: 'Submit Scan', description: 'Launch the discovery scan' },
    { id: 6, title: 'Live Progress', description: 'Monitor scan progress in real-time' },
    { id: 7, title: 'Results & Actions', description: 'Work with discovered devices' }
  ];

  useEffect(() => {
    fetchScanTasks();
    fetchActiveScanTask();
    fetchDiscoveredDevices();
    fetchAvailableScanners();
  }, [fetchScanTasks, fetchActiveScanTask, fetchDiscoveredDevices]);

  // Handle scan completion
  useEffect(() => {
    if (activeScanTask && (activeScanTask.status === 'completed' || activeScanTask.status === 'failed')) {
      // Refresh data when scan completes
      fetchScanTasks();
      fetchDiscoveredDevices();
    }
  }, [activeScanTask, fetchScanTasks, fetchDiscoveredDevices]);

  const fetchAvailableScanners = async () => {
    try {
      const response = await fetch('/api/v2/scanners');
      const scanners = await response.json();
      const activeScanners = scanners.filter(scanner => scanner.is_active);
      console.log('Fetched scanners:', scanners);
      console.log('Active scanners:', activeScanners);
      setAvailableScanners(activeScanners);
    } catch (error) {
      console.error('Failed to fetch scanners:', error);
      // Set empty array on error to trigger fallback
      setAvailableScanners([]);
    }
  };

  const checkScannerForTarget = async (target) => {
    console.log('Checking scanner for target:', target);
    
    if (!target) {
      return null;
    }

    try {
      // Use the authenticated API endpoint to get scanner recommendation
      const recommendation = await api.get(`/scanners/recommendation?target=${encodeURIComponent(target)}`);
      console.log('Scanner recommendation:', recommendation);
      
      if (recommendation.recommended_scanner) {
        setSelectedScanner(recommendation.recommended_scanner);
        
        // Set suggestion based on scanner type
        if (recommendation.scanner_type === 'default' && recommendation.suggestion) {
          setScannerSuggestion({
            type: recommendation.suggestion.type,
            message: recommendation.suggestion.message,
            action: 'Setup Scanner'
          });
        } else {
          setScannerSuggestion(null);
        }
        
        return recommendation.recommended_scanner;
      } else {
        // Fallback to local scanning
        const fallbackScanner = {
          id: 0,
          name: 'Local Scanner (Fallback)',
          is_default: true,
          is_active: true,
          subnets: [],
          url: 'local'
        };
        setSelectedScanner(fallbackScanner);
        setScannerSuggestion({
          type: 'warning',
          message: recommendation.message || 'No scanners available. Using local fallback.',
          action: 'Setup Scanner'
        });
        return fallbackScanner;
      }
    } catch (error) {
      console.error('Error getting scanner recommendation:', error);
      
      // Fallback to local scanning
      const fallbackScanner = {
        id: 0,
        name: 'Local Scanner (Fallback)',
        is_default: true,
        is_active: true,
        subnets: [],
        url: 'local'
      };
      setSelectedScanner(fallbackScanner);
      setScannerSuggestion({
        type: 'error',
        message: 'Failed to get scanner recommendation. Using local fallback.',
        action: 'Setup Scanner'
      });
      return fallbackScanner;
    }
  };

  const isIPInSubnet = (ip, subnet) => {
    // Simple CIDR check - in production, use a proper IP library
    const [subnetIP, prefix] = subnet.split('/');
    const ipParts = ip.split('.').map(Number);
    const subnetParts = subnetIP.split('.').map(Number);
    const prefixNum = parseInt(prefix);
    
    // Basic check - in production, implement proper CIDR logic
    return ipParts[0] === subnetParts[0] && ipParts[1] === subnetParts[1];
  };

  const handleStep1 = () => {
    setCurrentStep(2);
  };

  const handleStep2 = async (target) => {
    if (!target || !target.trim()) {
      alert('Please enter a valid target IP or range');
      return;
    }
    setScanConfig(prev => ({ ...prev, target }));
    setIsCheckingScanner(true);
    
    try {
      // Get scanner recommendation for the target
      const scanner = await checkScannerForTarget(target);
      setIsCheckingScanner(false);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error in handleStep2:', error);
      setIsCheckingScanner(false);
      // Still proceed to step 3 with fallback scanner
      setCurrentStep(3);
    }
  };

  const handleStep3 = () => {
    // Scanner should always be available due to fallback logic
    if (!selectedScanner) {
      console.error('No scanner selected - this should not happen');
      return;
    }
    setCurrentStep(4);
  };

  const handleStep4 = (intensity) => {
    setScanConfig(prev => ({ ...prev, intensity }));
    setCurrentStep(5);
  };

  // Navigation helpers
  const goToStep = (step) => {
    if (step >= 1 && step <= 7) {
      setCurrentStep(step);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWizardComplete = (result) => {
    setShowWizard(false);
    setShowResults(true);
    // Refresh data to show the new scan
    fetchScanTasks();
    fetchActiveScanTask();
  };

  const handleStep5 = async () => {
    if (!scanConfig.target || !selectedScanner) {
      alert('Please complete all required fields before submitting the scan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const scanTaskData = {
        name: scanConfig.name || `Discovery Scan - ${scanConfig.target}`,
        target: scanConfig.target,
        scan_type: scanConfig.intensity === 'quick' ? 'quick' : 'comprehensive',
        created_by: 'user',
        scanner_ids: selectedScanner && typeof selectedScanner.id === 'number' && selectedScanner.id > 0 ? [selectedScanner.id] : []
      };

      await createScanTask(scanTaskData);
      setCurrentStep(6);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to start scan:', error);
      alert(`Failed to start scan: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep6 = () => {
    setCurrentStep(7);
  };

  const handleStep7 = () => {
    // Reset for new scan
    setCurrentStep(1);
    setScanConfig({ name: '', target: '', intensity: 'standard', scannerType: 'auto' });
    setSelectedScanner(null);
    setScannerSuggestion(null);
    setShowResults(false);
  };

  // ScansTracker handlers
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

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-foreground">Start Discovery Scan</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Discover and analyze devices in your network. Our intelligent system will help you find the best scanning approach.
            </p>
            <Button onClick={handleStep1} size="lg" className="px-8">
              Start New Scan
            </Button>
          </div>
        );

      case 2:
  return (
          <SmartTargetInput 
            value={scanConfig.target}
            onChange={(value) => setScanConfig(prev => ({ ...prev, target: value }))}
            onContinue={() => handleStep2(scanConfig.target)}
            onBack={goBack}
            isChecking={isCheckingScanner}
            availableScanners={availableScanners}
          />
        );

      case 3:
        return (
          <div className="space-y-6">
            {isCheckingScanner ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Scanner Check</h2>
                  <p className="text-muted-foreground">System is checking for optimal scanner</p>
                    </div>
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Analyzing network topology...</span>
                </div>
              </>
            ) : selectedScanner ? (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Scanner Selected</h2>
                  <p className="text-muted-foreground">Optimal scanner found for your target</p>
            </div>
                
                <div className="space-y-4">
                  <Card className={cn(
                    "border-2",
                    selectedScanner.is_default ? "border-warning/50 bg-warning/5" : "border-success/50 bg-success/5"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {selectedScanner.is_default ? "🔄" : "🛰️"}
                    </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {selectedScanner.is_default ? "Default Scanner" : "Satellite Scanner"}
                      </h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedScanner.name} • {selectedScanner.subnets?.length || 0} networks
                          </p>
                        </div>
            </div>
          </CardContent>
        </Card>

                  {scannerSuggestion && (
                    <Card className="border-info/50 bg-info/5">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-info text-xl">💡</div>
                <div>
                            <h4 className="font-medium text-info">Improvement Suggestion</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {scannerSuggestion.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={goBack}>
                      ← Back
                    </Button>
                    <Button onClick={handleStep3} size="lg">
                      Continue with {selectedScanner.is_default ? "Default" : "Satellite"} Scanner →
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Scanner Available
                </h3>
                <p className="text-muted-foreground mb-4">
                  Please check your scanner configuration and try again.
                </p>
                <Button variant="outline" onClick={goBack}>
                  ← Back to Target Selection
                </Button>
              </div>
                    )}
                  </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Set Scan Intensity</h2>
              <p className="text-muted-foreground">Choose the quality and amount of data to gather</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <IntensityOption
                title="Quick"
                description="Fast ping and basic port detection"
                icon="⚡"
                value="quick"
                selected={scanConfig.intensity === 'quick'}
                onClick={() => handleStep4('quick')}
              />
              <IntensityOption
                title="Standard"
                description="OS detection and service enumeration"
                icon="🔍"
                value="standard"
                selected={scanConfig.intensity === 'standard'}
                onClick={() => handleStep4('standard')}
              />
              <IntensityOption
                title="Comprehensive"
                description="Deep analysis with vulnerability checks"
                icon="🛡️"
                value="comprehensive"
                selected={scanConfig.intensity === 'comprehensive'}
                onClick={() => handleStep4('comprehensive')}
              />
      </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                ← Back
              </Button>
              <Button 
                onClick={() => handleStep4(scanConfig.intensity)} 
                disabled={!scanConfig.intensity}
        size="lg"
      >
                Continue →
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Submit Scan</h2>
              <p className="text-muted-foreground">Review and launch your discovery scan</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">{scanConfig.target}</span>
                      </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scanner:</span>
                    <span className="font-medium">{selectedScanner?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intensity:</span>
                    <Badge variant="secondary" className="capitalize">
                      {scanConfig.intensity}
                    </Badge>
              </div>
            </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
                ← Back
              </Button>
              <Button 
                onClick={handleStep5} 
                size="lg" 
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? 'Starting Scan...' : 'Launch Discovery Scan →'}
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <LiveProgressTracker 
            activeScanTask={activeScanTask}
            onComplete={handleStep6}
            onCancel={() => cancelScanTask(activeScanTask?.id)}
          />
        );

      case 7:
        return (
          <ResultsView 
            discoveredDevices={discoveredDevices}
            onNewScan={handleStep7}
            onViewDevice={(device) => {
              // Handle device view
              console.log('View device:', device);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title="Network Discovery"
        subtitle="Discover and analyze devices in your network"
      />

      {/* Discovery Mode Selector */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={discoveryMode === 'wizard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscoveryMode('wizard')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Guided Wizard</span>
                </Button>
                <Button
                  variant={discoveryMode === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscoveryMode('quick')}
                  className="flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Quick Scan</span>
                </Button>
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
              >
                <Target className="w-4 h-4" />
                <span>Start New Discovery</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    getStepStatus(step.id) === 'completed' && "bg-primary border-primary text-primary-foreground",
                    getStepStatus(step.id) === 'current' && "bg-primary/10 border-primary text-primary",
                    getStepStatus(step.id) === 'upcoming' && "bg-muted border-border text-muted-foreground"
                  )}>
                    {getStepStatus(step.id) === 'completed' ? '✓' : step.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-4 transition-colors",
                      getStepStatus(step.id) === 'completed' ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {steps[currentStep - 1]?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep - 1]?.description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <Card className="min-h-[400px]">
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scans Tracker */}
      <ScansTracker
        activeScanTask={activeScanTask}
        scanTasks={scanTasks}
        onCancelScan={cancelScanTask}
        onViewResults={handleViewResults}
        onDownloadResults={handleDownloadResults}
      />

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


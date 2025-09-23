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
  ResultsView 
} from './discovery/DiscoveryComponents';

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
    cancelScanTask
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

  const fetchAvailableScanners = async () => {
    try {
      const response = await fetch('/api/v2/scanners');
      const scanners = await response.json();
      setAvailableScanners(scanners.filter(scanner => scanner.is_active));
    } catch (error) {
      console.error('Failed to fetch scanners:', error);
    }
  };

  const checkScannerForTarget = (target) => {
    if (!target || !availableScanners.length) return null;

    // Find satellite scanner for the target range
    const satelliteScanner = availableScanners.find(scanner => 
      scanner.subnets && scanner.subnets.some(subnet => 
        isIPInSubnet(target, subnet)
      ) && !scanner.is_default
    );

    if (satelliteScanner) {
      setSelectedScanner(satelliteScanner);
      setScannerSuggestion(null);
      return satelliteScanner;
    } else {
      // Use default scanner and show suggestion
      const defaultScanner = availableScanners.find(s => s.is_default) || availableScanners[0];
      setSelectedScanner(defaultScanner);
      setScannerSuggestion({
        type: 'info',
        message: 'Consider setting up a dedicated scanner for this IP range to improve scan results next time.',
        action: 'Setup Scanner'
      });
      return defaultScanner;
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

  const handleStep2 = (target) => {
    setScanConfig(prev => ({ ...prev, target }));
    const scanner = checkScannerForTarget(target);
    setCurrentStep(3);
  };

  const handleStep3 = () => {
    setCurrentStep(4);
  };

  const handleStep4 = (intensity) => {
    setScanConfig(prev => ({ ...prev, intensity }));
    setCurrentStep(5);
  };

  const handleStep5 = async () => {
    setIsSubmitting(true);
    try {
      const scanTaskData = {
        name: scanConfig.name || `Discovery Scan - ${scanConfig.target}`,
        target: scanConfig.target,
        scan_type: scanConfig.intensity === 'quick' ? 'quick' : 'comprehensive',
        created_by: 'user',
        scanner_ids: selectedScanner ? [selectedScanner.id] : []
      };

      await createScanTask(scanTaskData);
      setCurrentStep(6);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to start scan:', error);
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
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Select Target</h2>
              <p className="text-muted-foreground">Choose what to scan from your IP scope</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TargetOption
                title="Single IP"
                description="192.168.1.100"
                icon="🎯"
                onClick={() => handleStep2('192.168.1.100')}
              />
              <TargetOption
                title="Custom Range"
                description="192.168.1.1-192.168.1.50"
                icon="📊"
                onClick={() => handleStep2('192.168.1.1-192.168.1.50')}
              />
              <TargetOption
                title="Full Subnet"
                description="192.168.1.0/24"
                icon="🌐"
                onClick={() => handleStep2('192.168.1.0/24')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Or enter custom target:</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100"
                  value={scanConfig.target}
                  onChange={(e) => setScanConfig(prev => ({ ...prev, target: e.target.value }))}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleStep2(scanConfig.target)}
                  disabled={!scanConfig.target.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Scanner Check</h2>
              <p className="text-muted-foreground">System is checking for optimal scanner</p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Analyzing network topology...</span>
            </div>

            {selectedScanner && (
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
                          <h4 className="font-medium text-info">Suggestion</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {scannerSuggestion.message}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-center">
                  <Button onClick={handleStep3} size="lg">
                    Continue with {selectedScanner.is_default ? "Default" : "Satellite"} Scanner
                  </Button>
                </div>
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

            <div className="text-center">
              <Button 
                onClick={handleStep5} 
                size="lg" 
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? 'Starting Scan...' : 'Launch Discovery Scan'}
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
        actions={[
          {
            label: "New Scan",
            icon: "🔍",
            onClick: () => setCurrentStep(1),
            variant: "default"
          }
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
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
    </div>
  );
};

export default Discovery;

import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';
import { 
  ChevronLeft, 
  ChevronRight, 
  Target, 
  Settings, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Network,
  Clock,
  Shield
} from 'lucide-react';

const DiscoveryWizard = ({ onComplete, onCancel }) => {
  const {
    availableScanners,
    scanTemplates,
    assetTemplates,
    fetchScanTemplates,
    fetchAssetTemplates,
    createScanTask,
    api
  } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    // Step 1: Target Selection
    target: '',
    targetType: 'subnet', // subnet, range, single
    targetValidation: null,
    
    // Step 2: Scan Configuration
    scanTemplateId: null, // Primary scan configuration
    discoveryDepth: 2, // Can be overridden by template
    customConfig: {},
    
    // Step 3: Scanner Selection
    scannerId: null,
    scannerRecommendation: null,
    
    // Step 4: Advanced Options
    credentials: [],
    schedule: null,
    notifications: true,
    
    // Step 5: Review & Launch
    estimatedDuration: 0,
    estimatedDevices: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    {
      id: 1,
      title: 'Target Selection',
      description: 'Choose what to scan',
      icon: Target,
      component: TargetSelectionStep
    },
    {
      id: 2,
      title: 'Scan Configuration',
      description: 'Configure scan parameters',
      icon: Settings,
      component: ScanConfigurationStep
    },
    {
      id: 3,
      title: 'Scanner Selection',
      description: 'Choose optimal scanner',
      icon: Network,
      component: ScannerSelectionStep
    },
    {
      id: 4,
      title: 'Advanced Options',
      description: 'Set additional options',
      icon: Shield,
      component: AdvancedOptionsStep
    },
    {
      id: 5,
      title: 'Review & Launch',
      description: 'Review and start scan',
      icon: CheckCircle,
      component: ReviewLaunchStep
    }
  ];

  useEffect(() => {
    fetchScanTemplates();
    fetchAssetTemplates();
  }, [fetchScanTemplates, fetchAssetTemplates]);

  const updateWizardData = (updates) => {
    setWizardData(prev => ({ ...prev, ...updates }));
    // Clear errors when data changes
    setErrors({});
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!wizardData.target) {
          newErrors.target = 'Target is required';
        } else if (!validateTarget(wizardData.target)) {
          newErrors.target = 'Invalid target format';
        }
        break;
      case 2:
        if (!wizardData.scanTemplateId) {
          newErrors.scanTemplateId = 'Scan template is required';
        }
        break;
      case 3:
        // Scanner selection is optional - will use default scanner if none selected
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTarget = (target) => {
    // Basic validation for IP addresses, ranges, and subnets
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const subnetRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    const rangeRegex = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
    
    return ipRegex.test(target) || subnetRegex.test(target) || rangeRegex.test(target);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const scanConfig = {
        name: `Discovery Scan - ${wizardData.target}`,
        target: wizardData.target,
        scan_template_id: wizardData.scanTemplateId,
        discovery_depth: wizardData.discoveryDepth,
        scanner_ids: wizardData.scannerId ? [wizardData.scannerId] : [], // Convert to array format
        credentials: wizardData.credentials,
        schedule: wizardData.schedule
      };

      const result = await createScanTask(scanConfig);
      onComplete(result);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Discovery Wizard</h2>
              <p className="text-slate-400 mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="border-b border-slate-800 p-4">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                    isActive && "bg-blue-600 text-white",
                    isCompleted && "bg-green-600 text-white",
                    !isActive && !isCompleted && "text-slate-400 hover:text-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <CurrentStepComponent
            data={wizardData}
            updateData={updateWizardData}
            errors={errors}
            availableScanners={availableScanners}
            scanTemplates={scanTemplates}
            assetTemplates={assetTemplates}
            api={api}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              {currentStep === steps.length ? (
                <Button
                  onClick={handleLaunch}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Launch Scan</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const TargetSelectionStep = ({ data, updateData, errors, api }) => {
  const [targetSuggestions, setTargetSuggestions] = useState([]);

  const commonTargets = [
    '192.168.1.0/24',
    '192.168.0.0/24',
    '10.0.0.0/24',
    '172.16.0.0/24'
  ];

  const handleTargetChange = (value) => {
    updateData({ target: value });
    
    // Generate suggestions based on input
    if (value.length > 0) {
      const suggestions = commonTargets.filter(target => 
        target.toLowerCase().includes(value.toLowerCase())
      );
      setTargetSuggestions(suggestions);
    } else {
      setTargetSuggestions(commonTargets);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Select Target</h3>
        <p className="text-slate-400 mb-4">
          Enter the IP address, range, or subnet you want to scan
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Target
            </label>
            <Input
              value={data.target}
              onChange={(e) => handleTargetChange(e.target.value)}
              placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100"
              className={cn(
                "w-full",
                errors.target && "border-red-500"
              )}
            />
            {errors.target && (
              <p className="text-red-500 text-sm mt-1">{errors.target}</p>
            )}
          </div>

          {targetSuggestions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Common Targets
              </label>
              <div className="flex flex-wrap gap-2">
                {targetSuggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-600 hover:text-white"
                    onClick={() => updateData({ target: suggestion })}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-2">Target Types</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-slate-300">Single IP</div>
            <div className="text-slate-500">192.168.1.1</div>
          </div>
          <div>
            <div className="font-medium text-slate-300">IP Range</div>
            <div className="text-slate-500">192.168.1.1-192.168.1.100</div>
          </div>
          <div>
            <div className="font-medium text-slate-300">Subnet</div>
            <div className="text-slate-500">192.168.1.0/24</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScanConfigurationStep = ({ data, updateData, errors, scanTemplates, api }) => {
  // Get the selected template to show its details
  const selectedTemplate = scanTemplates?.find(t => t.id === data.scanTemplateId);
  
  // Auto-select the first template if none is selected
  useEffect(() => {
    if (!data.scanTemplateId && scanTemplates && scanTemplates.length > 0) {
      updateData({ scanTemplateId: scanTemplates[0].id });
    }
  }, [scanTemplates, data.scanTemplateId, updateData]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Scan Configuration</h3>
        <p className="text-slate-400 mb-4">
          Choose a scan template to configure your discovery parameters
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Scan Template
          </label>
          <div className="grid grid-cols-1 gap-3">
            {scanTemplates
              ?.filter(template => template.name && template.name.trim() !== '')
              .map((template) => {
                const isSelected = data.scanTemplateId === template.id;
                const scanConfig = template.scan_config || {};
                const duration = scanConfig.timeout ? `${Math.round(scanConfig.timeout / 60)}-${Math.round(scanConfig.timeout / 30)} min` : 'Unknown';
                
                return (
                  <div
                    key={template.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    )}
                    onClick={() => updateData({ scanTemplateId: template.id })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-white">{template.name}</div>
                        <div className="text-sm text-slate-400">{template.description}</div>
                      </div>
                      <Badge variant="outline">{duration}</Badge>
                    </div>
                  </div>
                );
              })}
          </div>
          {errors.scanTemplateId && (
            <p className="text-red-400 text-sm mt-1">{errors.scanTemplateId}</p>
          )}
        </div>

      </div>
    </div>
  );
};

const ScannerSelectionStep = ({ data, updateData, errors, availableScanners, api }) => {
  const [scannerRecommendation, setScannerRecommendation] = useState(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  const getScannerRecommendation = async () => {
    if (!data.target) return null;
    
    setIsLoadingRecommendation(true);
    try {
      const recommendation = await api.get(`/scanners/recommendation?target=${encodeURIComponent(data.target)}`);
      
      setScannerRecommendation(recommendation);
      
      if (recommendation.recommended_scanner && !data.scannerId) {
        updateData({ 
          scannerId: recommendation.recommended_scanner.id,
          scannerRecommendation: recommendation.recommended_scanner
        });
      }
      
      return recommendation;
    } catch (error) {
      console.error('Error getting scanner recommendation:', error);
      setScannerRecommendation({
        recommended_scanner: null,
        message: 'Using default scanner. Consider installing a satellite scanner for improved network scan performance.',
        scanner_type: 'default',
        suggestion: {
          type: 'info',
          message: 'Install a satellite scanner in your target network for faster and more accurate scans.'
        }
      });
      return null;
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  useEffect(() => {
    if (data.target) {
      getScannerRecommendation();
    }
  }, [data.target]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Scanner Selection</h3>
        <p className="text-slate-400 mb-4">
          Choose the optimal scanner for your target network
        </p>
      </div>

      {isLoadingRecommendation && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-slate-400">Analyzing target network...</span>
          </div>
        </div>
      )}

          {scannerRecommendation && !isLoadingRecommendation && (
            <div className={cn(
              "border rounded-lg p-4",
              scannerRecommendation.scanner_type === 'satellite' 
                ? "bg-green-500/10 border-green-500" 
                : scannerRecommendation.scanner_type === 'default'
                ? "bg-blue-500/10 border-blue-500"
                : "bg-yellow-500/10 border-yellow-500"
            )}>
              <div className="flex items-center space-x-2 mb-2">
                {scannerRecommendation.scanner_type === 'satellite' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : scannerRecommendation.scanner_type === 'default' ? (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className={cn(
                  "font-medium",
                  scannerRecommendation.scanner_type === 'satellite' 
                    ? "text-green-400" 
                    : scannerRecommendation.scanner_type === 'default'
                    ? "text-blue-400"
                    : "text-yellow-400"
                )}>
                  {scannerRecommendation.scanner_type === 'satellite' 
                    ? 'Optimal Satellite Scanner' 
                    : 'Default Scanner'}
                </span>
              </div>
              <div className="text-sm text-slate-300 mb-2">
                {scannerRecommendation.message}
              </div>
              {scannerRecommendation.recommended_scanner && (
                <div className="text-xs text-slate-400">
                  Scanner: {scannerRecommendation.recommended_scanner.name} 
                  {scannerRecommendation.recommended_scanner.is_satellite && (
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                      Satellite
                    </span>
                  )}
                </div>
              )}
              {scannerRecommendation.suggestion && (
                <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                  <div className="text-xs text-slate-400">
                    💡 {scannerRecommendation.suggestion.message}
                  </div>
                </div>
              )}
            </div>
          )}

      <div className="space-y-3">
        {availableScanners?.map((scanner) => (
          <div
            key={scanner.id}
            className={cn(
              "border rounded-lg p-4 cursor-pointer transition-colors",
              data.scannerId === scanner.id
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-700 hover:border-slate-600"
            )}
            onClick={() => updateData({ scannerId: scanner.id })}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{scanner.name}</div>
                <div className="text-sm text-slate-400">
                  {scanner.url} • {scanner.subnets?.length || 0} subnets
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={scanner.is_active ? "default" : "secondary"}>
                  {scanner.is_active ? "Active" : "Inactive"}
                </Badge>
                {data.scannerId === scanner.id && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors.scannerId && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{errors.scannerId}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const AdvancedOptionsStep = ({ data, updateData, api }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Advanced Options</h3>
        <p className="text-slate-400 mb-4">
          Configure additional scan options and notifications
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Notifications
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notifications"
              checked={data.notifications}
              onChange={(e) => updateData({ notifications: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="notifications" className="text-sm text-slate-300">
              Send notifications when scan completes
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Schedule (Optional)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Time</label>
              <Input
                type="datetime-local"
                className="w-full"
                onChange={(e) => updateData({ 
                  schedule: { ...data.schedule, start_time: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Recurrence</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white">
                <option value="">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewLaunchStep = ({ data, errors, scanTemplates, api }) => {
  // Get the selected template
  const selectedTemplate = scanTemplates?.find(t => t.id === data.scanTemplateId);
  const scanType = selectedTemplate?.scan_config?.scan_type || 'standard';
  
  // Calculate estimated duration based on template
  const getEstimatedDuration = () => {
    if (!selectedTemplate) return 10;
    const timeout = selectedTemplate.scan_config?.timeout || 300;
    return Math.round(timeout / 60);
  };
  
  const estimatedDuration = getEstimatedDuration();
  const estimatedDevices = data.target.includes('/24') ? 254 : data.target.includes('/16') ? 65534 : 1;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Review & Launch</h3>
        <p className="text-slate-400 mb-4">
          Review your scan configuration before launching
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{errors.general}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Scan Configuration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Target:</span>
                <span className="text-white">{data.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Template:</span>
                <span className="text-white">{selectedTemplate?.name || 'Default'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="text-white">{selectedTemplate?.description || 'Standard scan configuration'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Scanner</h4>
            <div className="text-sm">
              <div className="text-slate-400">Selected Scanner:</div>
              <div className="text-white">
                {data.scannerId ? `Scanner ${data.scannerId}` : 'Default Scanner'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Estimated Results</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white">{estimatedDuration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Devices:</span>
                <span className="text-white">{estimatedDevices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Notifications:</span>
                <span className="text-white">{data.notifications ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-blue-400">Ready to Launch</span>
            </div>
            <div className="text-sm text-slate-300">
              Your scan is configured and ready to start. Click "Launch Scan" to begin discovery.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryWizard;

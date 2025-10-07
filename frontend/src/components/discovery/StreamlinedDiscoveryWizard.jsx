import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
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
  Network,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Loader2
} from 'lucide-react';

const StreamlinedDiscoveryWizard = ({ onComplete, onCancel }) => {
  const {
    availableScanners = [],
    scanTemplates = [],
    fetchScanTemplates,
    fetchAvailableScanners,
    createScanTask,
    api
  } = useApp();
  
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Simplified wizard data structure
  const [wizardData, setWizardData] = useState({
    target: '',
    scanTemplateId: null,
    scannerId: null
  });

  const steps = [
    {
      id: 1,
      title: 'Target Selection',
      description: 'Choose what to scan',
      icon: Target,
      component: TargetStep
    },
    {
      id: 2,
      title: 'Configuration',
      description: 'Select scan template and scanner',
      icon: Settings,
      component: ConfigurationStep
    },
    {
      id: 3,
      title: 'Review & Launch',
      description: 'Review and start scan',
      icon: CheckCircle,
      component: ReviewStep
    }
  ];

  // Load data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchScanTemplates(),
          fetchAvailableScanners()
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading wizard data:', error);
        setErrors({ general: 'Failed to load required data. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchScanTemplates, fetchAvailableScanners]);

  const updateWizardData = useCallback((updates) => {
    setWizardData(prev => ({ ...prev, ...updates }));
    setErrors({});
  }, []);

  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!wizardData.target.trim()) {
          newErrors.target = 'Target is required';
        }
        break;
      case 2:
        if (!wizardData.scanTemplateId) {
          newErrors.scanTemplateId = 'Scan template is required';
        }
        if (!wizardData.scannerId) {
          newErrors.scannerId = 'Scanner is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [wizardData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  }, [currentStep, validateStep, steps.length]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    try {
      const scanConfig = {
        name: `Network Scan - ${wizardData.target}`,
        target: wizardData.target,
        scan_template_id: wizardData.scanTemplateId,
        scanner_ids: wizardData.scannerId ? [wizardData.scannerId] : [],
        created_by: user?.username || 'system'
      };

      const result = await createScanTask(scanConfig);
      onComplete(result);
    } catch (error) {
      setErrors({ general: error.message || 'Failed to start scan' });
    } finally {
      setLoading(false);
    }
  }, [wizardData, currentStep, validateStep, createScanTask, onComplete, user]);

  // Loading state
  if (loading && !dataLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-2xl p-8">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-slate-400">Loading scan configuration...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isLastStep = currentStep === steps.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Network Discovery</h2>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400">{errors.general}</span>
              </div>
            </div>
          )}

          <CurrentStepComponent
            data={wizardData}
            updateData={updateWizardData}
            errors={errors}
            availableScanners={availableScanners}
            scanTemplates={scanTemplates}
            api={api}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex space-x-3">
              {isLastStep ? (
                <Button
                  onClick={handleLaunch}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Start Scan</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
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

// Target Selection Step
const TargetStep = ({ data, updateData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Select Target</h3>
        <p className="text-slate-400 mb-4">
          Enter the network range, subnet, or specific IP address to scan
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Target
          </label>
          <Input
            type="text"
            placeholder="e.g., 192.168.1.0/24, 10.0.0.1, 172.16.0.0/16"
            value={data.target}
            onChange={(e) => updateData({ target: e.target.value })}
            className={cn(
              "w-full",
              errors.target && "border-red-500"
            )}
          />
          {errors.target && (
            <p className="text-red-400 text-sm mt-1">{errors.target}</p>
          )}
        </div>

        <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Target className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-blue-400 font-medium mb-1">Target Examples</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• <code className="bg-slate-800 px-2 py-1 rounded">192.168.1.0/24</code> - Scan entire subnet</li>
                <li>• <code className="bg-slate-800 px-2 py-1 rounded">10.0.0.1</code> - Scan single IP</li>
                <li>• <code className="bg-slate-800 px-2 py-1 rounded">172.16.0.0/16</code> - Scan large network</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Configuration Step
const ConfigurationStep = ({ data, updateData, errors, availableScanners, scanTemplates }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Scan Configuration</h3>
        <p className="text-slate-400 mb-4">
          Choose scan template and scanner for optimal performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scan Templates */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Scan Template
          </label>
          <div className="space-y-2">
            {scanTemplates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all duration-200",
                  data.scanTemplateId === template.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-600"
                )}
                onClick={() => updateData({ scanTemplateId: template.id })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{template.name}</div>
                    <div className="text-sm text-slate-400">
                      {template.description || 'Standard network discovery'}
                    </div>
                  </div>
                  {data.scanTemplateId === template.id && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.scanTemplateId && (
            <p className="text-red-400 text-sm mt-2">{errors.scanTemplateId}</p>
          )}
        </div>

        {/* Available Scanners */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Scanner
          </label>
          <div className="space-y-2">
            {availableScanners.map((scanner) => (
              <div
                key={scanner.id}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all duration-200",
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
                      {scanner.is_default ? 'Default Scanner' : 'Satellite Scanner'}
                      {scanner.is_active && (
                        <Badge variant="default" className="ml-2">Active</Badge>
                      )}
                    </div>
                  </div>
                  {data.scannerId === scanner.id && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {errors.scannerId && (
            <p className="text-red-400 text-sm mt-2">{errors.scannerId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Review Step
const ReviewStep = ({ data, availableScanners, scanTemplates }) => {
  const selectedTemplate = scanTemplates.find(t => t.id === data.scanTemplateId);
  const selectedScanner = availableScanners.find(s => s.id === data.scannerId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Review Configuration</h3>
        <p className="text-slate-400 mb-4">
          Review your scan configuration before launching
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-slate-300 font-medium mb-2">Target</h4>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-white font-mono">{data.target}</span>
              </div>
            </div>

            <div>
              <h4 className="text-slate-300 font-medium mb-2">Scan Template</h4>
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-green-500" />
                <span className="text-white">{selectedTemplate?.name || 'Standard'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-slate-300 font-medium mb-2">Scanner</h4>
              <div className="flex items-center space-x-2">
                <Network className="w-4 h-4 text-purple-500" />
                <span className="text-white">{selectedScanner?.name || 'Default Scanner'}</span>
                {selectedScanner?.is_active && (
                  <Badge variant="default" className="ml-2">Active</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-blue-400 font-medium">Estimated Duration</span>
              </div>
              <p className="text-white">2-5 minutes</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedDiscoveryWizard;

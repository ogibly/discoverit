import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

// Target Option Component
export const TargetOption = ({ title, description, icon, onClick }) => (
  <Card 
    className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
    onClick={onClick}
  >
    <CardContent className="p-6 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Intensity Option Component
export const IntensityOption = ({ title, description, icon, value, selected, onClick }) => (
  <Card 
    className={cn(
      "cursor-pointer transition-all duration-200 hover:shadow-md",
      selected && "ring-2 ring-primary border-primary",
      "hover:scale-105"
    )}
    onClick={onClick}
  >
    <CardContent className="p-6 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {selected && (
        <Badge className="mt-2" variant="default">Selected</Badge>
      )}
    </CardContent>
  </Card>
);

// Live Progress Tracker Component
export const LiveProgressTracker = ({ activeScanTask, onComplete, onCancel }) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Initializing...');

  useEffect(() => {
    if (!activeScanTask) return;

    const phases = [
      'Initializing scan...',
      'Discovering network topology...',
      'Scanning target range...',
      'Detecting devices...',
      'Analyzing services...',
      'Gathering device information...',
      'Finalizing results...'
    ];

    let currentPhaseIndex = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          onComplete();
          return 100;
        }
        return prev + Math.random() * 15;
      });

      if (currentPhaseIndex < phases.length - 1) {
        setCurrentPhase(phases[currentPhaseIndex]);
        currentPhaseIndex++;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeScanTask, onComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Live Progress</h2>
        <p className="text-muted-foreground">Monitoring scan progress in real-time</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">{activeScanTask?.name}</span>
              <Badge variant="secondary">Running</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{currentPhase}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel Scan
              </Button>
              <Button onClick={onComplete} disabled={progress < 100}>
                View Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Results View Component
export const ResultsView = ({ discoveredDevices, onNewScan, onViewDevice }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Discovery Results</h2>
        <p className="text-muted-foreground">Work with your discovered devices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {discoveredDevices.slice(0, 6).map((device) => (
          <Card key={device.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">
                  {device.hostname || device.primary_ip}
                </h4>
                <Badge variant={device.is_device ? "default" : "secondary"}>
                  {device.is_device ? "Device" : "IP"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {device.primary_ip}
              </p>
              {device.os_name && (
                <p className="text-xs text-muted-foreground">
                  OS: {device.os_name}
                </p>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 w-full"
                onClick={() => onViewDevice(device)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={onNewScan} size="lg" className="px-8">
          Start New Scan
        </Button>
      </div>
    </div>
  );
};

// Smart Target Input Component with autocomplete and intelligent parsing
export const SmartTargetInput = ({ 
  value, 
  onChange, 
  onContinue, 
  onBack, 
  isChecking, 
  availableScanners 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [targetType, setTargetType] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Common subnet patterns for autocomplete
  const commonSubnets = [
    '192.168.1.0/24',
    '192.168.0.0/24', 
    '10.0.0.0/24',
    '10.0.1.0/24',
    '172.16.0.0/24',
    '172.16.1.0/24'
  ];

  // Get user's allowed subnets from scanners
  const userSubnets = availableScanners.flatMap(scanner => 
    scanner.subnets || []
  );

  // Parse target type based on input format
  const parseTargetType = (input) => {
    if (!input) return null;
    
    // Single IP: 192.168.1.100
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(input)) {
      return { type: 'single_ip', icon: '🎯', label: 'Single IP' };
    }
    
    // CIDR subnet: 192.168.1.0/24
    if (/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(input)) {
      return { type: 'subnet', icon: '🌐', label: 'Subnet' };
    }
    
    // IP range: 192.168.1.1-192.168.1.50 or 192.168.1.1-50
    if (/^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/.test(input) || 
        /^(\d{1,3}\.){3}\d{1,3}-\d{1,3}$/.test(input)) {
      return { type: 'range', icon: '📊', label: 'IP Range' };
    }
    
    return null;
  };

  // Validate input
  const validateInput = (input) => {
    if (!input) return false;
    
    const patterns = [
      /^(\d{1,3}\.){3}\d{1,3}$/, // Single IP
      /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, // CIDR
      /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/, // Full range
      /^(\d{1,3}\.){3}\d{1,3}-\d{1,3}$/ // Short range
    ];
    
    return patterns.some(pattern => pattern.test(input));
  };

  // Generate suggestions based on input
  const generateSuggestions = (input) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    const allSuggestions = [
      ...userSubnets,
      ...commonSubnets
    ].filter(subnet => 
      subnet.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);

    setSuggestions(allSuggestions);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const type = parseTargetType(newValue);
    setTargetType(type);
    setIsValid(validateInput(newValue));
    
    generateSuggestions(newValue);
    setShowSuggestions(newValue.length > 0 && suggestions.length > 0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setTargetType(parseTargetType(suggestion));
    setIsValid(true);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle key navigation in suggestions
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter' && isValid) {
      onContinue();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Target</h2>
        <p className="text-muted-foreground">Enter an IP address, subnet, or range to scan</p>
      </div>

      <div className="relative" ref={suggestionsRef}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Target Network
          </label>
          <div className="relative">
            <Input
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 192.168.1.100, 192.168.1.0/24, 192.168.1.1-50"
              className={cn(
                "w-full pr-10",
                isValid && "border-success",
                value && !isValid && "border-error"
              )}
            />
            {targetType && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-lg">{targetType.icon}</span>
              </div>
            )}
          </div>
          
          {/* Target type indicator */}
          {targetType && (
            <div className="flex items-center space-x-2 text-sm">
              <Badge variant="secondary" className="text-xs">
                {targetType.label}
              </Badge>
              <span className="text-muted-foreground">
                {targetType.type === 'single_ip' && 'Scanning a single device'}
                {targetType.type === 'subnet' && 'Scanning entire subnet'}
                {targetType.type === 'range' && 'Scanning IP range'}
              </span>
            </div>
          )}

          {/* Validation message */}
          {value && !isValid && (
            <p className="text-sm text-error">
              Please enter a valid IP address, subnet (CIDR), or range
            </p>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">🌐</span>
                  <span>{suggestion}</span>
                  {userSubnets.includes(suggestion) && (
                    <Badge variant="secondary" className="text-xs">Your Network</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Examples:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-muted/30 rounded border">
            <div className="font-medium">Single IP</div>
            <div className="text-muted-foreground">192.168.1.100</div>
          </div>
          <div className="p-2 bg-muted/30 rounded border">
            <div className="font-medium">Subnet</div>
            <div className="text-muted-foreground">192.168.1.0/24</div>
          </div>
          <div className="p-2 bg-muted/30 rounded border">
            <div className="font-medium">Range</div>
            <div className="text-muted-foreground">192.168.1.1-50</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isChecking}>
          ← Back
        </Button>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-muted-foreground">
            Step 2 of 7
          </div>
          <Button 
            onClick={onContinue}
            disabled={!isValid || isChecking}
            size="lg"
          >
            {isChecking ? 'Checking...' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  );
};

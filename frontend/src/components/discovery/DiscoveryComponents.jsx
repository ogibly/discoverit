import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
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

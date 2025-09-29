import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

const WorkflowGuide = () => {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    {
      id: 'discovery',
      title: 'Network Scans',
      description: 'Scan devices on your network',
      icon: '🔍',
      details: [
        'Use Custom Scan to target specific IP ranges',
        'Use LAN Discovery for automatic network detection',
        'Monitor scan progress in real-time',
        'View discovered devices in organized tables'
      ]
    },
    {
      id: 'selection',
      title: 'Device Selection',
      description: 'Choose devices to add to your inventory',
      icon: '✅',
      details: [
        'Review discovered devices and their details',
        'Select devices you want to manage',
        'Filter and search through device lists',
        'Convert selected devices to assets'
      ]
    },
    {
      id: 'management',
      title: 'Asset Management',
      description: 'Organize and manage your assets',
      icon: '📋',
      details: [
        'Create asset groups for organization',
        'Add detailed asset information',
        'Track asset status and health',
        'Manage asset relationships'
      ]
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Maintenance',
      description: 'Monitor and maintain your network assets',
      icon: '📊',
      details: [
        'Track asset health and status',
        'Monitor network performance',
        'Schedule regular maintenance',
        'Generate reports and analytics'
      ]
    }
  ];


  const bestPractices = [
    {
      title: 'Regular Scanning',
      description: 'Run network scans regularly to keep your asset inventory up-to-date',
      tip: 'Schedule weekly automated scans'
    },
    {
      title: 'Organize Assets',
      description: 'Use asset groups to organize devices by department, location, or function',
      tip: 'Create meaningful group names'
    },
    {
      title: 'Monitor Assets',
      description: 'Keep track of all your network assets and their status',
      tip: 'Set up alerts for asset changes'
    },
    {
      title: 'Secure Credentials',
      description: 'Store and manage credentials securely for asset access',
      tip: 'Use strong passwords and rotate regularly'
    }
  ];

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Sophisticated Header */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-6 py-4">
          <div className="text-center">
            <h1 className="text-heading text-foreground">Workflow Guide</h1>
            <p className="text-caption text-muted-foreground mt-1 max-w-2xl mx-auto">
              Learn how to effectively use DiscoverIT to discover, manage, and automate operations on your network assets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Quick Start Guide */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-subheading text-foreground flex items-center space-x-2">
                <span>🚀</span>
                <span>Quick Start Guide</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      'p-4 rounded-lg border border-border transition-all cursor-pointer',
                      activeStep === index 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-card hover:bg-muted/50'
                    )}
                    onClick={() => setActiveStep(index)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{step.icon}</div>
                      <h3 className="text-subheading text-foreground font-medium mb-1">
                        {step.title}
                      </h3>
                      <p className="text-caption text-muted-foreground">
                        {step.description}
                      </p>
                      <div className="mt-2">
                        <Badge 
                          className={cn(
                            'text-xs',
                            activeStep === index 
                              ? 'badge-primary' 
                              : 'badge-default'
                          )}
                        >
                          Step {index + 1}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Details */}
              <div className="p-6 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-2xl">{workflowSteps[activeStep].icon}</div>
                  <div>
                    <h3 className="text-subheading text-foreground">
                      {workflowSteps[activeStep].title}
                    </h3>
                    <p className="text-body text-muted-foreground">
                      {workflowSteps[activeStep].description}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workflowSteps[activeStep].details.map((detail, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-body text-foreground">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Best Practices */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-subheading text-foreground flex items-center space-x-2">
                <span>💡</span>
                <span>Best Practices</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bestPractices.map((practice, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="text-subheading text-foreground font-medium mb-2">
                      {practice.title}
                    </h3>
                    <p className="text-body text-muted-foreground mb-3">
                      {practice.description}
                    </p>
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded text-caption text-primary">
                      💡 {practice.tip}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Actions */}
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle className="text-subheading text-foreground flex items-center space-x-2">
                <span>🎯</span>
                <span>Ready to Get Started?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => window.location.href = '/scans'}
                >
                  <span className="text-xl">🔍</span>
                  <span>Start Scan</span>
                  <span className="text-xs opacity-75">Begin network scanning</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => window.location.href = '/assets'}
                >
                  <span className="text-xl">📋</span>
                  <span>Manage Assets</span>
                  <span className="text-xs opacity-75">Organize your inventory</span>
                </Button>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WorkflowGuide;
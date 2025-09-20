import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Progress } from './ui/Progress';
import { HelpIcon, ProgressiveDisclosure } from './ui';
import { cn } from '../utils/cn';

const WorkflowDashboard = () => {
  const { 
    assets, 
    assetGroups, 
    operations, 
    activeScanTask,
    fetchAssets,
    fetchAssetGroups,
    fetchOperations,
    createScanTask,
    cancelScanTask
  } = useApp();
  
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowProgress, setWorkflowProgress] = useState({
    discovery: false,
    assets: false,
    groups: false,
    operations: false
  });

  useEffect(() => {
    // Load initial data
    fetchAssets();
    fetchAssetGroups();
    fetchOperations();
  }, [fetchAssets, fetchAssetGroups, fetchOperations]);

  useEffect(() => {
    // Update workflow progress based on current state
    setWorkflowProgress({
      discovery: assets.length > 0 || activeScanTask,
      assets: assets.length > 0,
      groups: assetGroups.length > 0,
      operations: operations.length > 0
    });
  }, [assets, assetGroups, operations, activeScanTask]);

  const workflowSteps = [
    {
      id: 1,
      title: "Network Discovery",
      description: "Discover network devices using various scan methods",
      icon: "🔍",
      status: workflowProgress.discovery ? "completed" : "pending",
      action: "Start Discovery",
      component: "Discovery"
    },
    {
      id: 2,
      title: "Asset Management",
      description: "Review and manage discovered devices",
      icon: "🏠",
      status: workflowProgress.assets ? "completed" : "pending",
      action: "Manage Assets",
      component: "Assets"
    },
    {
      id: 3,
      title: "Asset Groups",
      description: "Create groups for bulk operations",
      icon: "📁",
      status: workflowProgress.groups ? "completed" : "pending",
      action: "Create Groups",
      component: "Groups"
    },
    {
      id: 4,
      title: "Operations",
      description: "Run operations on assets and groups",
      icon: "⚙️",
      status: workflowProgress.operations ? "completed" : "pending",
      action: "Run Operations",
      component: "Operations"
    }
  ];

  const getStepStatus = (step) => {
    if (step.status === "completed") return "completed";
    if (step.id === currentStep) return "current";
    if (step.id < currentStep) return "completed";
    return "pending";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "current": return "bg-blue-500";
      case "pending": return "bg-gray-300";
      default: return "bg-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return "✓";
      case "current": return "→";
      case "pending": return "○";
      default: return "○";
    }
  };

  const handleQuickStart = async () => {
    try {
      // Start a quick discovery scan
      await createScanTask({
        name: "Quick Network Discovery",
        target: "172.18.0.0/24", // Default Docker network
        scan_type: "quick",
        created_by: user?.id?.toString() || "1"
      });
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to start discovery:', error);
    }
  };

  const handleStepAction = (step) => {
    setCurrentStep(step.id);
    // Navigate to the appropriate component
    // This would be handled by the parent component
  };

  const calculateOverallProgress = () => {
    const completedSteps = Object.values(workflowProgress).filter(Boolean).length;
    return (completedSteps / 4) * 100;
  };

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen p-6">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center">
          Welcome to DiscoverIT
          <HelpIcon 
            content="This dashboard guides you through the complete workflow for network device discovery and management. Follow the steps below to get started."
            className="ml-3"
          />
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Your comprehensive network device discovery and management platform. 
          Follow the workflow below to discover, organize, and manage your network assets.
        </p>
        
        {/* Overall Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(calculateOverallProgress())}%</span>
          </div>
          <Progress value={calculateOverallProgress()} className="h-2" />
        </div>
      </div>

      {/* Quick Start */}
      {!workflowProgress.discovery && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Ready to get started?
            </h3>
            <p className="text-blue-700 mb-4">
              Start with a quick network discovery to find devices on your network.
            </p>
            <Button 
              onClick={handleQuickStart}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!!activeScanTask}
            >
              {activeScanTask ? "Discovery in Progress..." : "Start Quick Discovery"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🔍</span>
              <span>Discovery in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Scanning: {activeScanTask.target}</span>
                <span>{activeScanTask.progress || 0}%</span>
              </div>
              <Progress value={activeScanTask.progress || 0} className="h-2" />
              <div className="flex justify-between text-xs text-slate-600">
                <span>Type: {activeScanTask.scan_type}</span>
                <span>Status: {activeScanTask.status}</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => cancelScanTask(activeScanTask.id)}
                >
                  Cancel Scan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Workflow Steps */}
      <ProgressiveDisclosure
        steps={workflowSteps.map(step => ({
          title: step.title,
          description: step.description,
          icon: step.icon,
          details: [
            step.id === 1 && `${assets.length} devices discovered`,
            step.id === 2 && `${assets.length} assets managed`,
            step.id === 3 && `${assetGroups.length} groups created`,
            step.id === 4 && `${operations.length} operations available`
          ].filter(Boolean),
          action: () => handleStepAction(step),
          actionText: step.action
        }))}
        currentStep={currentStep - 1}
        onStepChange={(stepIndex) => setCurrentStep(stepIndex + 1)}
        variant="primary"
        showProgress={true}
      />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assets.length > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="text-green-600">✓</div>
                <div>
                  <div className="font-medium text-green-900">
                    {assets.length} assets discovered
                  </div>
                  <div className="text-sm text-green-700">
                    Latest: {assets[0]?.name || assets[0]?.primary_ip}
                  </div>
                </div>
              </div>
            )}
            
            {assetGroups.length > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-blue-600">✓</div>
                <div>
                  <div className="font-medium text-blue-900">
                    {assetGroups.length} asset groups created
                  </div>
                  <div className="text-sm text-blue-700">
                    Latest: {assetGroups[0]?.name}
                  </div>
                </div>
              </div>
            )}
            
            {operations.length > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="text-purple-600">✓</div>
                <div>
                  <div className="font-medium text-purple-900">
                    {operations.length} operations configured
                  </div>
                  <div className="text-sm text-purple-700">
                    Latest: {operations[0]?.name}
                  </div>
                </div>
              </div>
            )}
            
            {assets.length === 0 && assetGroups.length === 0 && operations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No activity yet. Start with network discovery!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="text-3xl">🔍</div>
              <HelpIcon 
                content="Start a quick network discovery scan to find devices on your network. This will scan the default Docker network range."
                size="sm"
              />
            </div>
            <h3 className="font-semibold mb-2">Quick Discovery</h3>
            <p className="text-sm text-slate-600 mb-4">
              Start a quick network scan
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleQuickStart}
              disabled={!!activeScanTask}
            >
              Start Scan
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="text-3xl">📊</div>
              <HelpIcon 
                content="View detailed statistics about your network discovery activities, asset counts, and system performance."
                size="sm"
              />
            </div>
            <h3 className="font-semibold mb-2">View Statistics</h3>
            <p className="text-sm text-slate-600 mb-4">
              See discovery and asset statistics
            </p>
            <Button variant="outline" size="sm">
              View Stats
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="text-3xl">📖</div>
              <HelpIcon 
                content="Access the complete workflow guide with detailed instructions for each step of the discovery and management process."
                size="sm"
              />
            </div>
            <h3 className="font-semibold mb-2">Workflow Guide</h3>
            <p className="text-sm text-slate-600 mb-4">
              Learn about the complete workflow
            </p>
            <Button variant="outline" size="sm">
              View Guide
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowDashboard;

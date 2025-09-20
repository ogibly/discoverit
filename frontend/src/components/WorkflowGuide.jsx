import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { HelpIcon, CollapsibleGuidance, ProgressiveDisclosure } from './ui';

const WorkflowGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const workflowSteps = [
    {
      step: 1,
      title: "Network Discovery",
      description: "Discover network devices using various scan methods",
      icon: "🔍",
      details: [
        "Use Discovery screen to scan network ranges",
        "Choose from multiple scan types: Quick, Comprehensive, SNMP, ARP",
        "Configure auto-assignment of labels and groups",
        "Monitor scan progress and view results"
      ],
      screen: "Discovery",
      path: "/discovery"
    },
    {
      step: 2,
      title: "Asset Management",
      description: "Review and manage discovered assets",
      icon: "🏠",
      details: [
        "View all discovered devices in Assets screen",
        "Edit asset information and properties",
        "Assign labels and organize assets",
        "Select assets for operations"
      ],
      screen: "Assets",
      path: "/"
    },
    {
      step: 3,
      title: "Asset Groups",
      description: "Create groups for bulk operations",
      icon: "📁",
      details: [
        "Create asset groups from selected assets",
        "Define group properties and credentials",
        "Use groups as sub-inventories for operations",
        "Organize assets by location, function, or type"
      ],
      screen: "Assets → Groups",
      path: "/"
    },
    {
      step: 4,
      title: "Operations",
      description: "Run operations on assets and groups",
      icon: "⚙️",
      details: [
        "Create operations: AWX Playbooks, API calls, Scripts",
        "Select target assets or groups",
        "Configure credentials and parameters",
        "Execute and monitor operation progress"
      ],
      screen: "Operations",
      path: "/operations"
    }
  ];

  const operationTypes = [
    {
      type: "AWX Playbook",
      description: "Execute Ansible playbooks via AWX Tower",
      icon: "🎭",
      details: [
        "Configure AWX Tower connection",
        "Specify playbook name and extra variables",
        "Generate Ansible inventory from assets/groups",
        "Execute playbooks with proper credentials"
      ]
    },
    {
      type: "API Call",
      description: "Make HTTP API calls to external services",
      icon: "🌐",
      details: [
        "Configure HTTP method (GET, POST, PUT, DELETE, PATCH)",
        "Set request headers and body",
        "Target specific assets or groups",
        "Handle authentication and responses"
      ]
    },
    {
      type: "Script",
      description: "Execute custom scripts on target systems",
      icon: "📜",
      details: [
        "Specify script path and arguments",
        "Use SSH or other remote execution methods",
        "Apply to selected assets or groups",
        "Monitor execution and collect results"
      ]
    }
  ];

  const screenClarifications = [
    {
      screen: "Discovery vs Scans",
      clarification: "Discovery is the comprehensive interface for network device discovery with multiple scan types, history, and statistics. The Scans screen has been removed to avoid confusion.",
      recommendation: "Use Discovery screen for all network scanning activities."
    },
    {
      screen: "Scanners vs Settings",
      clarification: "Scanners screen manages individual scanner service instances (CRUD operations, health checks, subnet assignments). Settings contains global scanner defaults and system-wide configurations.",
      recommendation: "Use Scanners screen for managing scanner instances, Settings for global defaults."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          DiscoverIT Workflow Guide
          <HelpIcon 
            content="This guide walks you through the complete workflow for network device discovery and management. Click on each step to learn more details."
            className="ml-2"
          />
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Complete workflow for network device discovery and management
        </p>
      </div>

      {/* Compact Workflow Steps */}
      <ProgressiveDisclosure
        steps={workflowSteps.map(step => ({
          title: `Step ${step.step}: ${step.title}`,
          description: step.description,
          icon: step.icon,
          details: step.details,
          action: () => {
            // Navigate to the appropriate screen
            console.log(`Navigate to ${step.screen}`);
          },
          actionText: `Go to ${step.screen}`
        }))}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        variant="primary"
        showProgress={true}
      />

      {/* Operation Types */}
      <CollapsibleGuidance
        title="Operation Types"
        icon="⚙️"
        variant="info"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Different ways to execute operations on your assets. Each type serves specific use cases:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {operationTypes.map((opType, index) => (
              <div key={index} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{opType.icon}</span>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{opType.type}</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{opType.description}</p>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {opType.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start space-x-1">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleGuidance>

      {/* Screen Clarifications */}
      <CollapsibleGuidance
        title="Screen Clarifications"
        icon="💡"
        variant="warning"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Understanding the differences between similar screens to avoid confusion:
          </p>
          {screenClarifications.map((clarification, index) => (
            <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{clarification.screen}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{clarification.clarification}</p>
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Recommendation:</strong> {clarification.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleGuidance>

      {/* Quick Start */}
      <CollapsibleGuidance
        title="Quick Start Guide"
        icon="🚀"
        variant="success"
        defaultOpen={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Get started with DiscoverIT in 4 simple steps:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xl mb-1">🔍</div>
              <h4 className="font-semibold mb-1 text-sm">1. Discover</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Scan your network to find devices</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl mb-1">🏠</div>
              <h4 className="font-semibold mb-1 text-sm">2. Review</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Check discovered assets</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-xl mb-1">📁</div>
              <h4 className="font-semibold mb-1 text-sm">3. Group</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Organize assets into groups</p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xl mb-1">⚙️</div>
              <h4 className="font-semibold mb-1 text-sm">4. Operate</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Run operations on assets</p>
            </div>
          </div>
        </div>
      </CollapsibleGuidance>
    </div>
  );
};

export default WorkflowGuide;

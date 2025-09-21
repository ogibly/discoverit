import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { HelpIcon } from './ui';

const WorkflowGuide = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  const workflowSteps = [
    {
      step: 1,
      title: "Network Discovery",
      description: "Discover network devices using various scan methods",
      icon: "🔍",
      details: [
        "Use Discovery screen to scan network ranges",
        "Choose from multiple scan types: Quick, Comprehensive, SNMP, ARP",
        "Monitor scan progress and view results in real-time",
        "Review discovered devices and their properties"
      ],
      screen: "Discovery",
      path: "/discovery"
    },
    {
      step: 2,
      title: "Device Review",
      description: "Review and manage discovered devices",
      icon: "📱",
      details: [
        "View all discovered devices in the Discovery interface",
        "Convert selected devices to managed assets",
        "Edit device information and properties",
        "Filter and sort devices by various criteria"
      ],
      screen: "Discovery → Devices",
      path: "/discovery"
    },
    {
      step: 3,
      title: "Asset Management",
      description: "Organize and manage your asset inventory",
      icon: "🏠",
      details: [
        "View all managed assets in Assets screen",
        "Create asset groups for bulk operations",
        "Assign labels and organize assets by location or function",
        "Select assets for operations and management"
      ],
      screen: "Assets",
      path: "/"
    },
    {
      step: 4,
      title: "Operations Execution",
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
      color: "bg-blue-900/20 text-blue-200 border-blue-800",
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
      color: "bg-green-900/20 text-green-200 border-green-800",
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
      color: "bg-purple-900/20 text-purple-200 border-purple-800",
      details: [
        "Specify script path and arguments",
        "Use SSH or other remote execution methods",
        "Apply to selected assets or groups",
        "Monitor execution and collect results"
      ]
    }
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: "Discover",
      description: "Scan your network to find devices",
      icon: "🔍",
      color: "bg-blue-600"
    },
    {
      step: 2,
      title: "Review",
      description: "Check discovered devices",
      icon: "📱",
      color: "bg-green-600"
    },
    {
      step: 3,
      title: "Convert",
      description: "Convert devices to managed assets",
      icon: "🏠",
      color: "bg-yellow-600"
    },
    {
      step: 4,
      title: "Operate",
      description: "Run operations on assets",
      icon: "⚙️",
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      {/* Compact Header */}
      <div className="bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-100 flex items-center">
                Workflow Guide
                <HelpIcon 
                  content="This guide walks you through the complete workflow for network device discovery and management. Follow the steps to get started with DiscoverIT."
                  className="ml-2"
                  size="sm"
                />
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Complete workflow for network device discovery and management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Quick Start Guide */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
              <span className="mr-2">🚀</span>
              Quick Start Guide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickStartSteps.map((step, index) => (
                <div key={index} className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-full ${step.color} flex items-center justify-center`}>
                    <span className="text-white text-sm">{step.icon}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-100 mb-1">{step.step}. {step.title}</h4>
                  <p className="text-xs text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Workflow Steps */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Detailed Workflow Steps
            </h2>
            
            {/* Step Navigation */}
            <div className="flex space-x-2 mb-4">
              {workflowSteps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all duration-200 ${
                    activeStep === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {step.step}. {step.title}
                </button>
              ))}
            </div>

            {/* Active Step Content */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">{workflowSteps[activeStep].icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    Step {workflowSteps[activeStep].step}: {workflowSteps[activeStep].title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    {workflowSteps[activeStep].description}
                  </p>
                  <div className="space-y-2">
                    {workflowSteps[activeStep].details.map((detail, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-0.5 text-xs">•</span>
                        <span className="text-xs text-slate-300">{detail}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Badge className="bg-blue-900/20 text-blue-200 border border-blue-800 text-xs">
                      Screen: {workflowSteps[activeStep].screen}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operation Types */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
              <span className="mr-2">⚙️</span>
              Operation Types
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Different ways to execute operations on your assets. Each type serves specific use cases:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {operationTypes.map((opType, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{opType.icon}</span>
                    <h4 className="font-semibold text-slate-100 text-xs">{opType.type}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{opType.description}</p>
                  <ul className="space-y-1">
                    {opType.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start space-x-1">
                        <span className="text-blue-400 mt-0.5 text-xs">•</span>
                        <span className="text-xs text-slate-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Best Practices
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 mb-1">Start with Quick Scans</h4>
                  <p className="text-xs text-slate-400">Use quick scans for initial network reconnaissance, then run comprehensive scans on specific ranges.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 mb-1">Organize with Groups</h4>
                  <p className="text-xs text-slate-400">Create asset groups based on location, function, or type to streamline operations.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 mb-1">Use Credentials Management</h4>
                  <p className="text-xs text-slate-400">Store and manage credentials securely for automated operations and device access.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowGuide;
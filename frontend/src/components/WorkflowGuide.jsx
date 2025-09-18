import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';

const WorkflowGuide = () => {
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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">DiscoverIT Workflow Guide</h1>
        <p className="text-slate-600">Complete workflow for network device discovery and management</p>
      </div>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflowSteps.map((step, index) => (
          <Card key={step.step} className="relative">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Step {step.step}</span>
                    <Badge variant="outline">{step.screen}</Badge>
                  </CardTitle>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {step.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operation Types */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Types</CardTitle>
          <p className="text-slate-600">Different ways to execute operations on your assets</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {operationTypes.map((opType, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{opType.icon}</span>
                  <h3 className="font-semibold">{opType.type}</h3>
                </div>
                <p className="text-sm text-slate-600">{opType.description}</p>
                <ul className="space-y-1">
                  {opType.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Screen Clarifications */}
      <Card>
        <CardHeader>
          <CardTitle>Screen Clarifications</CardTitle>
          <p className="text-slate-600">Understanding the differences between similar screens</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {screenClarifications.map((clarification, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-slate-900">{clarification.screen}</h3>
                <p className="text-sm text-slate-600 mt-1">{clarification.clarification}</p>
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-800">
                    <strong>Recommendation:</strong> {clarification.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <p className="text-slate-600">Get started with DiscoverIT in 4 simple steps</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold mb-1">1. Discover</h3>
              <p className="text-xs text-slate-600">Scan your network to find devices</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🏠</div>
              <h3 className="font-semibold mb-1">2. Review</h3>
              <p className="text-xs text-slate-600">Check discovered assets</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">📁</div>
              <h3 className="font-semibold mb-1">3. Group</h3>
              <p className="text-xs text-slate-600">Organize assets into groups</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold mb-1">4. Operate</h3>
              <p className="text-xs text-slate-600">Run operations on assets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowGuide;

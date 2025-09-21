import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';

const ScanView = ({
  scanConfig,
  setScanConfig,
  activeScanTask,
  onStartScan,
  onCancelScan
}) => {
  return (
    <div className="space-y-4">
      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="surface-elevated border-info/20 bg-info/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-info rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-info-foreground border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-subheading text-foreground">
                    {activeScanTask.name}
                  </h3>
                  <p className="text-body text-muted-foreground">
                    Target: {activeScanTask.target} • Status: {activeScanTask.status}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Started: {new Date(activeScanTask.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelScan}
                className="text-error hover:text-error hover:bg-error/10 border-error/20"
              >
                Cancel Scan
              </Button>
            </div>
            {activeScanTask.progress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-body text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{activeScanTask.progress}%</span>
                </div>
                <Progress value={activeScanTask.progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Configuration */}
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-subheading text-foreground">Scan Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Target IP Range or Subnet *
            </label>
            <Input
              placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
              value={scanConfig.target}
              onChange={(e) => setScanConfig({ ...scanConfig, target: e.target.value })}
            />
            <p className="text-caption text-muted-foreground mt-1">
              Enter IP ranges, subnets, or individual IP addresses to scan
            </p>
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scan Type
            </label>
            <select
              value={scanConfig.scanType}
              onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
            >
              <option value="quick">Quick Scan (Enhanced ping + port detection)</option>
              <option value="comprehensive">Comprehensive (OS Detection + Services)</option>
              <option value="deep">Deep Scan (Full Service Enumeration)</option>
              <option value="snmp">SNMP Discovery</option>
              <option value="arp">ARP Discovery</option>
            </select>
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Scan Name
            </label>
            <Input
              placeholder="Optional: Give this scan a name"
              value={scanConfig.name}
              onChange={(e) => setScanConfig({ ...scanConfig, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe this scan"
              value={scanConfig.description}
              onChange={(e) => setScanConfig({ ...scanConfig, description: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onStartScan}
              disabled={!scanConfig.target.trim() || activeScanTask}
              className="flex-1"
            >
              {activeScanTask ? 'Scan in Progress...' : 'Start Network Scan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-info rounded-md flex items-center justify-center">
                <span className="text-info-foreground text-sm">🔍</span>
              </div>
              <h3 className="text-subheading text-foreground">
                Quick Scan
              </h3>
            </div>
            <p className="text-body text-muted-foreground">
              Fast discovery using enhanced ping and port detection techniques. 
              Ideal for initial network reconnaissance.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-warning rounded-md flex items-center justify-center">
                <span className="text-warning-foreground text-sm">⚡</span>
              </div>
              <h3 className="text-subheading text-foreground">
                Comprehensive Scan
              </h3>
            </div>
            <p className="text-body text-muted-foreground">
              Detailed analysis including OS detection, service enumeration, 
              and vulnerability assessment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanView;
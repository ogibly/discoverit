import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';

const DiscoveryView = ({
  assets,
  activeScanTask,
  lanDiscoveryResults,
  onStartScan,
  onCancelScan,
  onStartLanDiscovery,
  onCancelLanDiscovery,
  isLanDiscoveryRunning,
  scanConfig,
  setScanConfig,
  lanConfig,
  setLanConfig,
  onSetLanDiscoveryResults
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const scanTypes = [
    { value: 'quick', label: 'Quick Scan', description: 'Fast network discovery', icon: '⚡' },
    { value: 'comprehensive', label: 'Comprehensive', description: 'Deep network analysis', icon: '🔍' },
    { value: 'custom', label: 'Custom', description: 'Custom scan configuration', icon: '⚙️' }
  ];

  const handleStartScan = () => {
    if (!scanConfig.target || !scanConfig.target.trim()) {
      alert('Please enter a target IP or range');
      return;
    }
    onStartScan(scanConfig);
  };

  const handleStartLanDiscovery = () => {
    if (!lanConfig.subnet || !lanConfig.subnet.trim()) {
      alert('Please enter a subnet');
      return;
    }
    onStartLanDiscovery(lanConfig);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading text-foreground">Network Discovery</h2>
          <p className="text-caption text-muted-foreground mt-1">
            Discover and analyze network devices and services
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{assets.length}</div>
            <div className="text-caption text-muted-foreground">Total Assets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{assets.filter(a => a && a.is_managed).length}</div>
            <div className="text-caption text-muted-foreground">Managed</div>
          </div>
        </div>
      </div>

      {/* Custom Scan Configuration */}
      <Card className="surface-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-subheading text-foreground flex items-center">
            🔍 Custom Scan Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Target IP/Range *
              </label>
              <Input
                value={scanConfig.target}
                onChange={(e) => setScanConfig({...scanConfig, target: e.target.value})}
                placeholder="192.168.1.0/24 or 192.168.1.1-100"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Scan Type
              </label>
              <select
                value={scanConfig.scanType}
                onChange={(e) => setScanConfig({...scanConfig, scanType: e.target.value})}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                {scanTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Scan Name
              </label>
              <Input
                value={scanConfig.name}
                onChange={(e) => setScanConfig({...scanConfig, name: e.target.value})}
                placeholder="My Network Scan"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Description
              </label>
              <Input
                value={scanConfig.description}
                onChange={(e) => setScanConfig({...scanConfig, description: e.target.value})}
                placeholder="Optional description"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-body"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
            <div className="flex space-x-3">
              {activeScanTask ? (
                <Button
                  onClick={onCancelScan}
                  className="bg-error hover:bg-error/90 text-error-foreground"
                >
                  Cancel Scan
                </Button>
              ) : (
                <Button
                  onClick={handleStartScan}
                  disabled={!scanConfig.target || !scanConfig.target.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Start Scan
                </Button>
              )}
            </div>
          </div>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
              <h4 className="text-body font-semibold text-foreground">Advanced Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body font-medium text-foreground mb-2">
                    Port Range
                  </label>
                  <Input
                    placeholder="1-1000"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium text-foreground mb-2">
                    Timeout (ms)
                  </label>
                  <Input
                    placeholder="5000"
                    type="number"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-body font-medium text-foreground mb-2">
                    Threads
                  </label>
                  <Input
                    placeholder="50"
                    type="number"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LAN Discovery */}
      <Card className="surface-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="text-subheading text-foreground flex items-center">
            🌐 LAN Discovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Subnet *
              </label>
              <Input
                value={lanConfig.subnet}
                onChange={(e) => setLanConfig({...lanConfig, subnet: e.target.value})}
                placeholder="192.168.1.0/24"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-foreground mb-2">
                Discovery Name
              </label>
              <Input
                value={lanConfig.name}
                onChange={(e) => setLanConfig({...lanConfig, name: e.target.value})}
                placeholder="LAN Discovery"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-caption text-muted-foreground">
              Automatically discover devices on your local network
            </div>
            <div className="flex space-x-3">
              {isLanDiscoveryRunning ? (
                <Button
                  onClick={onCancelLanDiscovery}
                  className="bg-error hover:bg-error/90 text-error-foreground"
                >
                  Cancel Discovery
                </Button>
              ) : (
                <Button
                  onClick={handleStartLanDiscovery}
                  disabled={!lanConfig.subnet || !lanConfig.subnet.trim()}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  Start LAN Discovery
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="surface-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-subheading text-foreground flex items-center">
              🔄 Active Scan Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-body font-semibold text-foreground">{activeScanTask.name}</h4>
                  <p className="text-caption text-muted-foreground">Target: {activeScanTask.target}</p>
                </div>
                <Badge className="badge-info">Running</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-caption text-muted-foreground">
                  <span>Progress</span>
                  <span>{activeScanTask.progress || 0}%</span>
                </div>
                <Progress value={activeScanTask.progress || 0} className="h-2" />
              </div>

              {activeScanTask.status && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-body text-foreground">{activeScanTask.status}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Discovery Results */}
      {lanDiscoveryResults && lanDiscoveryResults.length > 0 && (
        <Card className="surface-elevated">
          <CardHeader className="pb-4">
            <CardTitle className="text-subheading text-foreground flex items-center">
              📊 Recent Discovery Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lanDiscoveryResults.slice(0, 5).map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
                      <span className="text-sm">📱</span>
                    </div>
                    <div>
                      <p className="text-body font-medium text-foreground">
                        {device.hostname || device.ip_address}
                      </p>
                      <p className="text-caption text-muted-foreground">
                        {device.ip_address} • {device.mac_address}
                      </p>
                    </div>
                  </div>
                  <Badge className="badge-success">Discovered</Badge>
                </div>
              ))}
            </div>
            {lanDiscoveryResults.length > 5 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All Results ({lanDiscoveryResults.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiscoveryView;
import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { cn } from '../../utils/cn';

const OverviewView = ({ 
  assets, 
  activeScanTask, 
  lanDiscoveryResults, 
  onStartScan, 
  onStartLanDiscovery, 
  onViewDevices 
}) => {
  const totalDevices = assets?.length || 0;
  const managedAssets = assets?.filter(a => a && a.is_managed).length || 0;
  const discoveredDevices = assets?.filter(a => a && !a.is_managed).length || 0;
  const deviceTypes = new Set(assets?.map(a => a?.model).filter(Boolean)).size || 0;

  const stats = [
    {
      title: 'Total Devices',
      value: totalDevices,
      description: 'All discovered devices',
      icon: '📊',
      color: 'bg-primary text-primary-foreground'
    },
    {
      title: 'Managed Assets',
      value: managedAssets,
      description: 'Actively managed assets',
      icon: '✅',
      color: 'bg-success text-success-foreground'
    },
    {
      title: 'Discovered Devices',
      value: discoveredDevices,
      description: 'Unmanaged devices',
      icon: '🔍',
      color: 'bg-info text-info-foreground'
    },
    {
      title: 'Device Types',
      value: deviceTypes,
      description: 'Unique device models',
      icon: '🏷️',
      color: 'bg-muted text-muted-foreground'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Sophisticated Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="surface-elevated hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-caption text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className={cn("w-10 h-10 rounded-md flex items-center justify-center text-lg", stat.color)}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-subheading text-foreground">
                    {activeScanTask.name}
                  </h3>
                  <p className="text-body text-muted-foreground">
                    Target: <span className="font-mono text-foreground">{activeScanTask.target}</span> • 
                    Status: <span className="font-medium text-foreground">{activeScanTask.status}</span>
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Started: {new Date(activeScanTask.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Handle cancel */}}
              >
                Cancel
              </Button>
            </div>
            {activeScanTask.progress > 0 && (
              <div className="mt-4">
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

      {/* LAN Discovery Results */}
      {lanDiscoveryResults && (
        <Card className="surface-elevated border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-subheading text-foreground">
                  LAN Discovery Results
                </h3>
                <p className="text-body text-muted-foreground">
                  Network: <span className="font-mono font-semibold text-foreground">{lanDiscoveryResults.network}</span> • 
                  Found <span className="font-bold text-success">{lanDiscoveryResults.live_devices}</span> live devices
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Handle close */}}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <p className="text-xl font-bold text-foreground">
                  {lanDiscoveryResults.total_ips_scanned}
                </p>
                <p className="text-caption text-muted-foreground">IPs Scanned</p>
              </div>
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <p className="text-xl font-bold text-foreground">
                  {lanDiscoveryResults.live_devices}
                </p>
                <p className="text-caption text-muted-foreground">Live Devices</p>
              </div>
              <div className="text-center p-3 bg-background rounded-md border border-border">
                <p className="text-xl font-bold text-foreground">
                  {lanDiscoveryResults.max_depth}
                </p>
                <p className="text-caption text-muted-foreground">Scan Depth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="surface-interactive" onClick={onViewDevices}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-primary rounded-md flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📱</span>
            </div>
            <h3 className="text-subheading text-foreground mb-2">
              View All Devices
            </h3>
            <p className="text-body text-muted-foreground">
              Browse and manage all discovered devices and managed assets
            </p>
          </CardContent>
        </Card>

        <Card className="surface-interactive" onClick={onStartScan}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-warning rounded-md flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🔍</span>
            </div>
            <h3 className="text-subheading text-foreground mb-2">
              Custom Network Scan
            </h3>
            <p className="text-body text-muted-foreground">
              Perform targeted scans on specific IP ranges or subnets
            </p>
          </CardContent>
        </Card>

        <Card className="surface-interactive" onClick={onStartLanDiscovery}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-success rounded-md flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🌐</span>
            </div>
            <h3 className="text-subheading text-foreground mb-2">
              Quick LAN Discovery
            </h3>
            <p className="text-body text-muted-foreground">
              Automatically discover devices on your local network
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewView;
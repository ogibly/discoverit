import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

const LanDiscoveryView = ({
  lanConfig,
  setLanConfig,
  isLanDiscoveryRunning,
  lanDiscoveryResults,
  onStartLanDiscovery,
  onSetLanDiscoveryResults
}) => {
  return (
    <div className="space-y-4">
      {/* LAN Discovery Results */}
      {lanDiscoveryResults && (
        <Card className="surface-elevated border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-subheading text-foreground">
                  LAN Discovery Results
                </h3>
                <p className="text-body text-muted-foreground">
                  Network: {lanDiscoveryResults.network} • 
                  Found {lanDiscoveryResults.live_devices} live devices
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetLanDiscoveryResults(null)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
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

      {/* LAN Discovery Configuration */}
      <Card className="surface-elevated">
        <CardHeader>
          <CardTitle className="text-subheading text-foreground">LAN Discovery Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-info/10 p-4 rounded-md border border-info/20">
            <div className="flex items-start space-x-3">
              <div className="text-xl">🌐</div>
              <div>
                <h3 className="text-subheading text-foreground mb-2">
                  Automatic Network Discovery
                </h3>
                <p className="text-body text-muted-foreground">
                  This feature intelligently detects your network topology and scans for live devices 
                  using multiple discovery techniques including ARP, ICMP, and TCP probes.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Discovery Depth
            </label>
            <select
              value={lanConfig.maxDepth}
              onChange={(e) => setLanConfig({ ...lanConfig, maxDepth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
            >
              <option value={1}>Level 1: Local subnet only (fastest)</option>
              <option value={2}>Level 2: Local + adjacent subnets (recommended)</option>
              <option value={3}>Level 3: Extended network scan (slower)</option>
              <option value={4}>Level 4: Deep network scan (slowest)</option>
              <option value={5}>Level 5: Maximum depth (very slow)</option>
            </select>
            <p className="text-caption text-muted-foreground mt-1">
              Higher levels scan more network segments but take longer to complete
            </p>
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Discovery Name
            </label>
            <Input
              placeholder="Optional: Give this discovery a name"
              value={lanConfig.name}
              onChange={(e) => setLanConfig({ ...lanConfig, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-body font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe this discovery"
              value={lanConfig.description}
              onChange={(e) => setLanConfig({ ...lanConfig, description: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onStartLanDiscovery}
              disabled={isLanDiscoveryRunning}
              className={cn(
                "flex-1 transition-all duration-200",
                isLanDiscoveryRunning 
                  ? "bg-muted cursor-not-allowed" 
                  : "bg-success hover:bg-success/90 text-success-foreground"
              )}
            >
              {isLanDiscoveryRunning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-success-foreground border-t-transparent"></div>
                  <span>Discovering...</span>
                </div>
              ) : (
                'Start LAN Discovery'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discovery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-success rounded-md flex items-center justify-center">
                <span className="text-success-foreground text-sm">⚡</span>
              </div>
              <h3 className="text-subheading text-foreground">
                Fast Discovery
              </h3>
            </div>
            <p className="text-body text-muted-foreground">
              Level 1-2 scans provide quick results for local network discovery 
              with minimal impact on network performance.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground text-sm">🔍</span>
              </div>
              <h3 className="text-subheading text-foreground">
                Comprehensive Discovery
              </h3>
            </div>
            <p className="text-body text-muted-foreground">
              Level 3-5 scans provide thorough network mapping across multiple 
              subnets for complete network visibility.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LanDiscoveryView;
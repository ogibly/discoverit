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
    <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
      {/* LAN Discovery Results */}
      {lanDiscoveryResults && (
        <Card className="border-0 shadow-lg bg-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  LAN Discovery Results
                </h3>
                <p className="text-slate-400">
                  Network: <span className="font-mono font-semibold">{lanDiscoveryResults.network}</span> • 
                  Found <span className="font-bold text-green-400">{lanDiscoveryResults.live_devices}</span> live devices
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetLanDiscoveryResults(null)}
                className="border-slate-600 text-slate-300"
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-800/60 rounded-lg">
                <p className="text-2xl font-bold text-slate-100">
                  {lanDiscoveryResults.total_ips_scanned}
                </p>
                <p className="text-sm text-slate-400">IPs Scanned</p>
              </div>
              <div className="text-center p-4 bg-slate-800/60 rounded-lg">
                <p className="text-2xl font-bold text-slate-100">
                  {lanDiscoveryResults.live_devices}
                </p>
                <p className="text-sm text-slate-400">Live Devices</p>
              </div>
              <div className="text-center p-4 bg-slate-800/60 rounded-lg">
                <p className="text-2xl font-bold text-slate-100">
                  {lanDiscoveryResults.max_depth}
                </p>
                <p className="text-sm text-slate-400">Scan Depth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LAN Discovery Configuration */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quick LAN Discovery
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400">
            Automatically discover devices on your local network and adjacent subnets
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🌐</div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Automatic Network Discovery
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This feature intelligently detects your network topology and scans for live devices 
                  using multiple discovery techniques including ARP, ICMP, and TCP probes.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Discovery Depth
            </label>
            <select
              value={lanConfig.maxDepth}
              onChange={(e) => setLanConfig({ ...lanConfig, maxDepth: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value={1}>Level 1: Local subnet only (fastest)</option>
              <option value={2}>Level 2: Local + adjacent subnets (recommended)</option>
              <option value={3}>Level 3: Extended network scan (slower)</option>
              <option value={4}>Level 4: Deep network scan (slowest)</option>
              <option value={5}>Level 5: Maximum depth (very slow)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Higher levels scan more network segments but take longer to complete
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Discovery Name
            </label>
            <Input
              placeholder="Optional: Give this discovery a name"
              value={lanConfig.name}
              onChange={(e) => setLanConfig({ ...lanConfig, name: e.target.value })}
              className="bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe this discovery"
              value={lanConfig.description}
              onChange={(e) => setLanConfig({ ...lanConfig, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onStartLanDiscovery}
              disabled={isLanDiscoveryRunning}
              className={cn(
                "flex-1 py-3 font-semibold text-lg transition-all duration-200",
                isLanDiscoveryRunning 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25"
              )}
            >
              {isLanDiscoveryRunning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Fast Discovery
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Level 1-2 scans provide quick results for local network discovery 
              with minimal impact on network performance.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Comprehensive Discovery
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
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

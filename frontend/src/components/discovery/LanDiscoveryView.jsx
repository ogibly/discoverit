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
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-green-100">
                LAN Discovery Results
              </h3>
              <p className="text-xs text-green-300">
                Network: {lanDiscoveryResults.network} • 
                Found {lanDiscoveryResults.live_devices} live devices
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetLanDiscoveryResults(null)}
              className="border-slate-600 text-slate-300 h-8 px-3 text-xs"
            >
              Close
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-slate-800/60 rounded">
              <p className="text-lg font-bold text-slate-100">
                {lanDiscoveryResults.total_ips_scanned}
              </p>
              <p className="text-xs text-slate-400">IPs Scanned</p>
            </div>
            <div className="text-center p-2 bg-slate-800/60 rounded">
              <p className="text-lg font-bold text-slate-100">
                {lanDiscoveryResults.live_devices}
              </p>
              <p className="text-xs text-slate-400">Live Devices</p>
            </div>
            <div className="text-center p-2 bg-slate-800/60 rounded">
              <p className="text-lg font-bold text-slate-100">
                {lanDiscoveryResults.max_depth}
              </p>
              <p className="text-xs text-slate-400">Scan Depth</p>
            </div>
          </div>
        </div>
      )}

      {/* LAN Discovery Configuration */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="space-y-4">
          <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-800">
            <div className="flex items-start space-x-2">
              <div className="text-lg">🌐</div>
              <div>
                <h3 className="text-sm font-semibold text-blue-100 mb-1">
                  Automatic Network Discovery
                </h3>
                <p className="text-xs text-blue-300">
                  This feature intelligently detects your network topology and scans for live devices 
                  using multiple discovery techniques including ARP, ICMP, and TCP probes.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Discovery Depth
            </label>
            <select
              value={lanConfig.maxDepth}
              onChange={(e) => setLanConfig({ ...lanConfig, maxDepth: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded text-sm h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={1}>Level 1: Local subnet only (fastest)</option>
              <option value={2}>Level 2: Local + adjacent subnets (recommended)</option>
              <option value={3}>Level 3: Extended network scan (slower)</option>
              <option value={4}>Level 4: Deep network scan (slowest)</option>
              <option value={5}>Level 5: Maximum depth (very slow)</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Higher levels scan more network segments but take longer to complete
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Discovery Name
            </label>
            <Input
              placeholder="Optional: Give this discovery a name"
              value={lanConfig.name}
              onChange={(e) => setLanConfig({ ...lanConfig, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe this discovery"
              value={lanConfig.description}
              onChange={(e) => setLanConfig({ ...lanConfig, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onStartLanDiscovery}
              disabled={isLanDiscoveryRunning}
              className={cn(
                "flex-1 h-8 text-sm transition-all duration-200",
                isLanDiscoveryRunning 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              {isLanDiscoveryRunning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  <span>Discovering...</span>
                </div>
              ) : (
                'Start LAN Discovery'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Discovery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Fast Discovery
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Level 1-2 scans provide quick results for local network discovery 
            with minimal impact on network performance.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">🔍</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Comprehensive Discovery
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Level 3-5 scans provide thorough network mapping across multiple 
            subnets for complete network visibility.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanDiscoveryView;

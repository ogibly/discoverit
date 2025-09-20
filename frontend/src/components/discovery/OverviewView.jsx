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
  const managedAssets = assets?.filter(a => a.is_managed).length || 0;
  const discoveredDevices = assets?.filter(a => !a.is_managed).length || 0;
  const deviceTypes = new Set(assets?.map(a => a.model).filter(Boolean)).size || 0;

  const stats = [
    {
      title: 'Total Devices',
      value: totalDevices,
      description: 'All discovered devices'
    },
    {
      title: 'Managed Assets',
      value: managedAssets,
      description: 'Actively managed assets'
    },
    {
      title: 'Discovered Devices',
      value: discoveredDevices,
      description: 'Unmanaged devices'
    },
    {
      title: 'Device Types',
      value: deviceTypes,
      description: 'Unique device models'
    }
  ];

  return (
    <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
      {/* Clean Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {activeScanTask.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Target: <span className="font-mono">{activeScanTask.target}</span> • 
                    Status: <span className="font-medium">{activeScanTask.status}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Started: {new Date(activeScanTask.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Handle cancel */}}
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
            {activeScanTask.progress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
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
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  LAN Discovery Results
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Network: <span className="font-mono font-semibold">{lanDiscoveryResults.network}</span> • 
                  Found <span className="font-bold text-emerald-600 dark:text-emerald-400">{lanDiscoveryResults.live_devices}</span> live devices
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Handle close */}}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {lanDiscoveryResults.total_ips_scanned}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">IPs Scanned</p>
              </div>
              <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {lanDiscoveryResults.live_devices}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Live Devices</p>
              </div>
              <div className="text-center p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {lanDiscoveryResults.max_depth}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Scan Depth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={onViewDevices}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              View All Devices
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Browse and manage all discovered devices and managed assets
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={onStartScan}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Custom Network Scan
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Perform targeted scans on specific IP ranges or subnets
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={onStartLanDiscovery}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">🌐</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Quick LAN Discovery
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Automatically discover devices on your local network
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewView;

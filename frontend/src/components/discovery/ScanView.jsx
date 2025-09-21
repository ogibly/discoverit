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
    <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
      {/* Active Scan Status */}
      {activeScanTask && (
        <Card className="border-0 shadow-lg bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    {activeScanTask.name}
                  </h3>
                  <p className="text-slate-400">
                    Target: <span className="font-mono font-semibold">{activeScanTask.target}</span> • 
                    Status: <span className="font-semibold text-blue-400">{activeScanTask.status}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Started: {new Date(activeScanTask.start_time).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelScan}
                className="border-red-600 text-red-400 hover:bg-red-900/20"
              >
                Cancel Scan
              </Button>
            </div>
            {activeScanTask.progress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
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
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Custom Network Scan
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400">
            Configure and execute targeted network scans on specific IP ranges or subnets
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Target IP Range or Subnet *
            </label>
            <Input
              placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
              value={scanConfig.target}
              onChange={(e) => setScanConfig({ ...scanConfig, target: e.target.value })}
              className="bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter IP ranges, subnets, or individual IP addresses to scan
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Scan Type
            </label>
            <select
              value={scanConfig.scanType}
              onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value="quick">Quick Scan (Enhanced ping + port detection)</option>
              <option value="comprehensive">Comprehensive (OS Detection + Services)</option>
              <option value="deep">Deep Scan (Full Service Enumeration)</option>
              <option value="snmp">SNMP Discovery</option>
              <option value="arp">ARP Discovery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Scan Name
            </label>
            <Input
              placeholder="Optional: Give this scan a name"
              value={scanConfig.name}
              onChange={(e) => setScanConfig({ ...scanConfig, name: e.target.value })}
              className="bg-white/80 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe this scan"
              value={scanConfig.description}
              onChange={(e) => setScanConfig({ ...scanConfig, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={onStartScan}
              disabled={!scanConfig.target.trim() || activeScanTask}
              className={cn(
                "flex-1 py-3 font-semibold text-lg transition-all duration-200",
                activeScanTask 
                  ? "bg-slate-400 cursor-not-allowed" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              )}
            >
              {activeScanTask ? 'Scan in Progress...' : 'Start Network Scan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Quick Scan
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Fast discovery using enhanced ping and port detection techniques. 
              Ideal for initial network reconnaissance.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Comprehensive Scan
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
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

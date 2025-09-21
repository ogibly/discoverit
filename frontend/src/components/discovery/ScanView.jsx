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
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl animate-spin">🔄</div>
              <div>
                <h3 className="text-sm font-semibold text-blue-100">
                  {activeScanTask.name}
                </h3>
                <p className="text-xs text-blue-300">
                  Target: {activeScanTask.target} • Status: {activeScanTask.status}
                </p>
                <p className="text-xs text-blue-400">
                  Started: {new Date(activeScanTask.start_time).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelScan}
              className="border-red-600 text-red-400 hover:bg-red-900/20 h-8 px-3 text-xs"
            >
              Cancel Scan
            </Button>
          </div>
          {activeScanTask.progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-blue-400 mb-1">
                <span>Progress</span>
                <span>{activeScanTask.progress}%</span>
              </div>
              <Progress value={activeScanTask.progress} className="h-2" />
            </div>
          )}
        </div>
      )}

      {/* Scan Configuration */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target IP Range or Subnet *
            </label>
            <Input
              placeholder="e.g., 192.168.1.0/24, 10.0.0.1-10.0.0.100, or 192.168.1.1"
              value={scanConfig.target}
              onChange={(e) => setScanConfig({ ...scanConfig, target: e.target.value })}
              className="h-8 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter IP ranges, subnets, or individual IP addresses to scan
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Scan Type
            </label>
            <select
              value={scanConfig.scanType}
              onChange={(e) => setScanConfig({ ...scanConfig, scanType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded text-sm h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="quick">Quick Scan (Enhanced ping + port detection)</option>
              <option value="comprehensive">Comprehensive (OS Detection + Services)</option>
              <option value="deep">Deep Scan (Full Service Enumeration)</option>
              <option value="snmp">SNMP Discovery</option>
              <option value="arp">ARP Discovery</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Scan Name
            </label>
            <Input
              placeholder="Optional: Give this scan a name"
              value={scanConfig.name}
              onChange={(e) => setScanConfig({ ...scanConfig, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe this scan"
              value={scanConfig.description}
              onChange={(e) => setScanConfig({ ...scanConfig, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-600 bg-slate-800 text-slate-100 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onStartScan}
              disabled={!scanConfig.target.trim() || activeScanTask}
              className="flex-1 h-8 text-sm"
            >
              {activeScanTask ? 'Scan in Progress...' : 'Start Network Scan'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scan Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">🔍</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Quick Scan
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Fast discovery using enhanced ping and port detection techniques. 
            Ideal for initial network reconnaissance.
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Comprehensive Scan
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Detailed analysis including OS detection, service enumeration, 
            and vulnerability assessment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScanView;

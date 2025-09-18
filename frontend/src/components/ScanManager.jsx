import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';

const ScanManager = () => {
  const {
    activeScanTask,
    createScanTask,
    cancelScanTask,
    statusMessage,
    clearStatusMessage
  } = useApp();

  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('comprehensive');
  const [loading, setLoading] = useState(false);

  const handleStartScan = async () => {
    if (!target.trim()) return;
    
    setLoading(true);
    try {
      await createScanTask({
        target: target.trim(),
        scan_type: scanType,
        name: `Scan ${target} - ${new Date().toLocaleString()}`
      });
    } catch (error) {
      console.error('Failed to start scan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async () => {
    if (!activeScanTask) return;
    
    try {
      await cancelScanTask(activeScanTask.id);
    } catch (error) {
      console.error('Failed to cancel scan:', error);
    }
  };

  const getScanTypeColor = (type) => {
    switch (type) {
      case 'quick': return 'bg-green-100 text-green-800';
      case 'comprehensive': return 'bg-blue-100 text-blue-800';
      case 'arp': return 'bg-yellow-100 text-yellow-800';
      case 'snmp': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Network Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Enter target (e.g., 192.168.1.0/24, 192.168.1.1-50, or specific IPs)"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={!!activeScanTask}
                />
              </div>
              <div>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  disabled={!!activeScanTask}
                  className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <option value="quick">Quick Scan</option>
                  <option value="comprehensive">Comprehensive Scan</option>
                  <option value="arp">ARP Discovery</option>
                  <option value="snmp">SNMP Scan</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleStartScan}
                disabled={!target.trim() || !!activeScanTask || loading}
                loading={loading}
              >
                {activeScanTask ? 'Scanning...' : 'Start Scan'}
              </Button>
              
              {activeScanTask && (
                <Button
                  variant="destructive"
                  onClick={handleCancelScan}
                >
                  Cancel Scan
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Scan Status */}
      {activeScanTask && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Scan</CardTitle>
              <Badge className={getScanTypeColor(activeScanTask.scan_type)}>
                {activeScanTask.scan_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-slate-600">Target</div>
                  <div className="font-mono">{activeScanTask.target}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Progress</div>
                  <div>{activeScanTask.progress || 0}%</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Current IP</div>
                  <div className="font-mono">{activeScanTask.current_ip || 'Initializing...'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scan Progress</span>
                  <span>
                    {activeScanTask.completed_ips || 0} / {activeScanTask.total_ips || 0} IPs
                  </span>
                </div>
                <Progress value={activeScanTask.progress || 0} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-slate-600">Started</div>
                  <div>{new Date(activeScanTask.start_time).toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Status</div>
                  <Badge variant={activeScanTask.status === 'running' ? 'default' : 'secondary'}>
                    {activeScanTask.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={cn(
          'p-4 rounded-md border',
          statusMessage.includes('success') || statusMessage.includes('completed')
            ? 'bg-green-50 border-green-200 text-green-800'
            : statusMessage.includes('error') || statusMessage.includes('failed')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        )}>
          <div className="flex items-center justify-between">
            <span>{statusMessage}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearStatusMessage}
              className="h-6 w-6 p-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanManager;

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Settings, 
  Play, 
  Filter,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { useApi } from '../../hooks/useApi';
import { formatDate, formatDateTime } from '../../utils/formatters';
import ComplianceRuleForm from './ComplianceRuleForm';

const ComplianceDashboard = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rules, setRules] = useState([]);
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [filters, setFilters] = useState({
    rule_type: '',
    framework: '',
    status: '',
    asset_id: '',
    asset_group_id: ''
  });

  const api = useApi();

  useEffect(() => {
    if (isOpen) {
      loadComplianceData();
    }
  }, [isOpen]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const [rulesRes, checksRes, summaryRes] = await Promise.all([
        api.get('/compliance/rules'),
        api.get('/compliance/checks'),
        api.get('/compliance/summary')
      ]);
      
      setRules(rulesRes.data || []);
      setChecks(checksRes.data || []);
      setSummary(summaryRes.data || {});
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCheck = async (ruleId, assetId = null, assetGroupId = null) => {
    try {
      await api.post('/compliance/checks', {
        rule_id: ruleId,
        asset_id: assetId,
        asset_group_id: assetGroupId
      });
      loadComplianceData();
    } catch (error) {
      console.error('Failed to run compliance check:', error);
    }
  };

  const handleRunAllChecks = async () => {
    try {
      await api.post('/compliance/checks/run-all');
      loadComplianceData();
    } catch (error) {
      console.error('Failed to run all compliance checks:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this compliance rule?')) {
      try {
        await api.delete(`/compliance/rules/${ruleId}`);
        loadComplianceData();
      } catch (error) {
        console.error('Failed to delete compliance rule:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'PASSED': 'success',
      'FAILED': 'destructive',
      'WARNING': 'warning',
      'PENDING': 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      'HIGH': 'destructive',
      'MEDIUM': 'warning',
      'LOW': 'secondary',
      'INFO': 'outline'
    };
    
    return (
      <Badge variant={variants[severity] || 'secondary'}>
        {severity}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadComplianceData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunAllChecks}
              disabled={loading}
            >
              <Play className="w-4 h-4" />
              Run All Checks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRuleModal(true)}
            >
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="checks">Checks</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Rules</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.total_rules || 0}</p>
                    </div>
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{summary.passed_checks || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{summary.failed_checks || 0}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Compliance %</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary.compliance_percentage ? `${summary.compliance_percentage.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Checks</h3>
                <div className="space-y-3">
                  {checks.slice(0, 5).map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium text-sm">{check.rule_name}</p>
                          <p className="text-xs text-gray-500">
                            {check.asset_name || check.asset_group_name || 'All Assets'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(check.status)}
                        <span className="text-xs text-gray-500">
                          {formatDateTime(check.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Active Rules</h3>
                <div className="space-y-3">
                  {rules.filter(rule => rule.is_active).slice(0, 5).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{rule.name}</p>
                          <p className="text-xs text-gray-500">{rule.framework}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(rule.severity)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunCheck(rule.id)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search rules..."
                  className="w-64"
                />
                <Select
                  value={filters.framework}
                  onValueChange={(value) => setFilters({...filters, framework: value})}
                >
                  <option value="">All Frameworks</option>
                  <option value="ISO27001">ISO 27001</option>
                  <option value="SOC2">SOC 2</option>
                  <option value="PCI_DSS">PCI DSS</option>
                  <option value="HIPAA">HIPAA</option>
                  <option value="NIST">NIST</option>
                </Select>
                <Select
                  value={filters.rule_type}
                  onValueChange={(value) => setFilters({...filters, rule_type: value})}
                >
                  <option value="">All Types</option>
                  <option value="SECURITY">Security</option>
                  <option value="CONFIGURATION">Configuration</option>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="PERFORMANCE">Performance</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-lg">{rule.name}</h4>
                        {getSeverityBadge(rule.severity)}
                        <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{rule.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Framework: {rule.framework}</span>
                        <span>Type: {rule.rule_type}</span>
                        <span>Created: {formatDate(rule.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunCheck(rule.id)}
                      >
                        <Play className="w-4 h-4" />
                        Run Check
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search checks..."
                  className="w-64"
                />
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({...filters, status: value})}
                >
                  <option value="">All Statuses</option>
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="WARNING">Warning</option>
                  <option value="PENDING">Pending</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {checks.map((check) => (
                <Card key={check.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(check.status)}
                        <h4 className="font-semibold text-lg">{check.rule_name}</h4>
                        {getStatusBadge(check.status)}
                      </div>
                      <p className="text-gray-600 mb-2">
                        {check.asset_name || check.asset_group_name || 'All Assets'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Framework: {check.framework}</span>
                        <span>Severity: {check.severity}</span>
                        <span>Run: {formatDateTime(check.created_at)}</span>
                      </div>
                      {check.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(check.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunCheck(check.rule_id, check.asset_id, check.asset_group_id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Re-run
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Compliance Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <FileText className="w-6 h-6" />
                  <span>Compliance Summary</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Download className="w-6 h-6" />
                  <span>Export Results</span>
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Compliance Rule Form Modal */}
      <ComplianceRuleForm
        rule={editingRule}
        isOpen={showRuleModal}
        onClose={() => {
          setShowRuleModal(false);
          setEditingRule(null);
        }}
        onSave={loadComplianceData}
      />
    </Modal>
  );
};

export default ComplianceDashboard;

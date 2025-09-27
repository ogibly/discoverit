import React, { useState, useEffect } from 'react';
import { X, Save, TestTube } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FormTextarea } from '../common/FormModal';
import { Card } from '../ui/Card';
import { useApi } from '../../hooks/useApi';

const ComplianceRuleForm = ({ rule, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'SECURITY',
    framework: 'ISO27001',
    severity: 'MEDIUM',
    rule_expression: '',
    remediation_guidance: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const api = useApi();

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        rule_type: rule.rule_type || 'SECURITY',
        framework: rule.framework || 'ISO27001',
        severity: rule.severity || 'MEDIUM',
        rule_expression: rule.rule_expression || '',
        remediation_guidance: rule.remediation_guidance || '',
        is_active: rule.is_active !== undefined ? rule.is_active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        rule_type: 'SECURITY',
        framework: 'ISO27001',
        severity: 'MEDIUM',
        rule_expression: '',
        remediation_guidance: '',
        is_active: true
      });
    }
    setErrors({});
  }, [rule, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.rule_expression.trim()) {
      newErrors.rule_expression = 'Rule expression is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      if (rule) {
        await api.put(`/compliance/rules/${rule.id}`, formData);
      } else {
        await api.post('/compliance/rules', formData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save compliance rule:', error);
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestRule = async () => {
    if (!formData.rule_expression.trim()) {
      setErrors(prev => ({
        ...prev,
        rule_expression: 'Rule expression is required for testing'
      }));
      return;
    }
    
    try {
      // This would be a test endpoint in the real implementation
      console.log('Testing rule expression:', formData.rule_expression);
      // await api.post('/compliance/rules/test', { rule_expression: formData.rule_expression });
    } catch (error) {
      console.error('Failed to test rule:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {rule ? 'Edit Compliance Rule' : 'Create Compliance Rule'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter rule name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Framework
              </label>
              <Select
                value={formData.framework}
                onValueChange={(value) => handleInputChange('framework', value)}
              >
                <option value="ISO27001">ISO 27001</option>
                <option value="SOC2">SOC 2</option>
                <option value="PCI_DSS">PCI DSS</option>
                <option value="HIPAA">HIPAA</option>
                <option value="NIST">NIST</option>
                <option value="CUSTOM">Custom</option>
              </Select>
            </div>
          </div>

          <FormTextarea
            label="Description *"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this rule checks for"
            rows={3}
            error={errors.description}
            className={errors.description ? 'border-red-500' : ''}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Type
              </label>
              <Select
                value={formData.rule_type}
                onValueChange={(value) => handleInputChange('rule_type', value)}
              >
                <option value="SECURITY">Security</option>
                <option value="CONFIGURATION">Configuration</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="AVAILABILITY">Availability</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleInputChange('severity', value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Expression *
            </label>
            <div className="space-y-2">
              <FormTextarea
                value={formData.rule_expression}
                onChange={(e) => handleInputChange('rule_expression', e.target.value)}
                placeholder="Enter the rule expression (e.g., asset.operating_system == 'Windows' AND asset.last_scan_date < datetime.now() - timedelta(days=30))"
                rows={4}
                error={errors.rule_expression}
                className={errors.rule_expression ? 'border-red-500' : ''}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Use Python expressions to define compliance rules. Available variables: asset, asset_group, scan_results
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestRule}
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </Button>
              </div>
            </div>
          </div>

          <FormTextarea
            label="Remediation Guidance"
            value={formData.remediation_guidance}
            onChange={(e) => handleInputChange('remediation_guidance', e.target.value)}
            placeholder="Provide guidance on how to fix compliance issues"
            rows={3}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (rule will be evaluated during compliance checks)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : (rule ? 'Update Rule' : 'Create Rule')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplianceRuleForm;

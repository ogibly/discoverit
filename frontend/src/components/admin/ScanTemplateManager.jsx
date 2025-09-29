import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormTextarea } from '../common/FormModal';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Clock,
  AlertCircle
} from 'lucide-react';

const ScanTemplateManager = () => {
  const { scanTemplates, fetchScanTemplates } = useApp();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timeout: 300,
    arguments: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchScanTemplates();
  }, [fetchScanTemplates]);


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      timeout: 300,
      arguments: ''
    });
    setErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      description: template.description,
      timeout: template.scan_config?.timeout || 300,
      arguments: template.scan_config?.arguments || ''
    });
    setEditingTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = (template) => {
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description,
      timeout: template.scan_config?.timeout || 300,
      arguments: template.scan_config?.arguments || ''
    });
    setEditingTemplate(null);
    setIsCreateModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.timeout < 30 || formData.timeout > 3600) {
      newErrors.timeout = 'Timeout must be between 30 and 3600 seconds';
    }
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        scan_config: {
          timeout: formData.timeout,
          arguments: formData.arguments.trim()
        }
      };

      if (isEditModalOpen && editingTemplate) {
        // Update existing template
        await fetch(`/api/v2/scan-templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });
      } else {
        // Create new template
        await fetch('/api/v2/scan-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });
      }

      await fetchScanTemplates();
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors({ general: 'Failed to save template' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;
    
    try {
      const response = await fetch(`/api/v2/scan-templates/${template.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete template');
      }
      
      await fetchScanTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(`Failed to delete template: ${error.message}`);
    }
  };

  const getScanTypeIcon = (scanType) => {
    const type = scanTypes.find(t => t.value === scanType);
    return type ? type.icon : Settings;
  };

  const getScanTypeLabel = (scanType) => {
    const type = scanTypes.find(t => t.value === scanType);
    return type ? type.label : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Scan Templates</h2>
          <p className="text-slate-400 mt-1">
            Manage scan templates for network discovery
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scanTemplates?.map((template) => {
          const Icon = getScanTypeIcon(template.scan_config?.scan_type);
          const isSystem = template.is_system;
          
          return (
            <Card key={template.id} className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                  </div>
                  {isSystem && (
                    <Badge variant="outline" className="text-xs">System</Badge>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{template.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Type:</span>
                    <div className="text-white">{getScanTypeLabel(template.scan_config?.scan_type)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Depth:</span>
                    <div className="text-white">N/A</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Timeout:</span>
                    <div className="text-white">{template.scan_config?.timeout || 300}s</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Usage:</span>
                    <div className="text-white">{template.usage_count || 0}</div>
                  </div>
                </div>
                
                {template.scan_config?.arguments && (
                  <div>
                    <span className="text-slate-400 text-sm">Arguments:</span>
                    <code className="block text-xs bg-slate-900 text-slate-300 p-2 rounded mt-1">
                      {template.scan_config.arguments}
                    </code>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  {!isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete template"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Template' : 'Create Template'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-400 text-sm">{errors.general}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Template Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter template name"
              className={cn(errors.name && "border-red-500")}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <FormTextarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this template does"
              rows={3}
              className={cn(errors.description && "border-red-500")}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>


          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Timeout (seconds)
            </label>
            <Input
              type="number"
              min="30"
              max="3600"
              value={formData.timeout}
              onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
              className={cn(errors.timeout && "border-red-500")}
            />
            {errors.timeout && <p className="text-red-400 text-sm mt-1">{errors.timeout}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nmap Arguments
            </label>
            <Input
              value={formData.arguments}
              onChange={(e) => setFormData({ ...formData, arguments: e.target.value })}
              placeholder="e.g., -sS -O -sV -A"
            />
            <p className="text-xs text-slate-500 mt-1">
              Advanced nmap arguments (leave empty for defaults)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditModalOpen ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScanTemplateManager;

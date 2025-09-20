import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Input, Card, Modal, Badge } from './ui';

const CredentialsManager = () => {
  const { api } = useApp();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedCredentials, setSelectedCredentials] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credential_type: 'username_password',
    username: '',
    password: '',
    ssh_private_key: '',
    ssh_passphrase: '',
    domain: '',
    port: '',
    is_active: true
  });

  const credentialTypes = [
    { value: 'username_password', label: 'Username/Password', icon: '🔑' },
    { value: 'ssh_key', label: 'SSH Private Key', icon: '🔐' }
  ];

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/credentials');
      setCredentials(response.data || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setCredentials([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const credentialData = { ...formData };
      
      // Clean up empty fields based on credential type
      if (credentialData.credential_type !== 'username_password') {
        credentialData.username = null;
        credentialData.password = null;
      }
      if (credentialData.credential_type !== 'ssh_key') {
        credentialData.ssh_private_key = null;
        credentialData.ssh_passphrase = null;
      }

      await api.post('/credentials', credentialData);
      setShowCreateModal(false);
      resetForm();
      loadCredentials();
    } catch (error) {
      console.error('Failed to create credential:', error);
      alert('Failed to create credential: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdate = async () => {
    try {
      const credentialData = { ...formData };
      delete credentialData.id; // Remove ID from update data
      
      await api.put(`/credentials/${editingCredential.id}`, credentialData);
      setShowEditModal(false);
      setEditingCredential(null);
      resetForm();
      loadCredentials();
    } catch (error) {
      console.error('Failed to update credential:', error);
      alert('Failed to update credential: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    
    try {
      await api.delete(`/credentials/${id}`);
      loadCredentials();
    } catch (error) {
      console.error('Failed to delete credential:', error);
      alert('Failed to delete credential: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleSelection = (credentialId) => {
    setSelectedCredentials(prev => 
      prev.includes(credentialId) 
        ? prev.filter(id => id !== credentialId)
        : [...prev, credentialId]
    );
  };

  const handleSelectAll = (credentialIds) => {
    setSelectedCredentials(credentialIds);
  };

  const handleBulkDelete = async () => {
    if (selectedCredentials.length === 0) {
      alert('Please select credentials to delete');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedCredentials.length} selected credential(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    try {
      const deletePromises = selectedCredentials.map(id => 
        api.delete(`/credentials/${id}`)
      );
      await Promise.all(deletePromises);
      setSelectedCredentials([]);
      loadCredentials();
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      alert('Failed to delete credentials: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (credential) => {
    setEditingCredential(credential);
    setFormData({
      ...credential,
      tags: credential.tags || []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      credential_type: 'username_password',
      username: '',
      password: '',
      ssh_private_key: '',
      ssh_passphrase: '',
      domain: '',
      port: '',
      is_active: true
    });
  };

  const filteredCredentials = (credentials || []).filter(credential => {
    const matchesSearch = !searchTerm || 
      credential.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || credential.credential_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getCredentialTypeInfo = (type) => {
    return credentialTypes.find(t => t.value === type) || { label: type, icon: '❓' };
  };

  const renderCredentialForm = () => {
    const typeInfo = getCredentialTypeInfo(formData.credential_type);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter credential name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type *
            </label>
            <select
              value={formData.credential_type}
              onChange={(e) => setFormData({...formData, credential_type: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {credentialTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Enter description"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {formData.credential_type === 'username_password' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username *
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
          </div>
        )}

        {formData.credential_type === 'ssh_key' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SSH Private Key *
              </label>
              <textarea
                value={formData.ssh_private_key}
                onChange={(e) => setFormData({...formData, ssh_private_key: e.target.value})}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={8}
              />
              <p className="text-xs text-slate-500 mt-1">
                Paste your SSH private key content here. Include the full key with headers.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Passphrase (Optional)
              </label>
              <Input
                type="password"
                value={formData.ssh_passphrase}
                onChange={(e) => setFormData({...formData, ssh_passphrase: e.target.value})}
                placeholder="Enter passphrase if the key is encrypted"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Domain
            </label>
            <Input
              value={formData.domain}
              onChange={(e) => setFormData({...formData, domain: e.target.value})}
              placeholder="example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Port
            </label>
            <Input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({...formData, port: e.target.value})}
              placeholder="22"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
            Active
          </label>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-screen overflow-y-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Credentials Manager</h1>
          <p className="text-slate-600">Manage authentication credentials and key pairs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Add Credential
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search credentials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {credentialTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedCredentials.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedCredentials.length} credential(s) selected
                  </span>
                  <button
                    onClick={() => setSelectedCredentials([])}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-100"
                  >
                    Clear Selection
                  </button>
                </div>
                <button
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50 border border-red-300 hover:border-red-400"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCredentials.map(credential => {
                const typeInfo = getCredentialTypeInfo(credential.credential_type);
                return (
                  <Card key={credential.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCredentials.includes(credential.id)}
                          onChange={() => handleToggleSelection(credential.id)}
                          className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-lg">{typeInfo.icon}</span>
                        <Badge variant={credential.is_active ? 'success' : 'secondary'}>
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(credential)}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(credential.id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-slate-900 mb-2">{credential.name}</h3>
                    
                    {credential.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{credential.description}</p>
                    )}
                    
                    <div className="space-y-1 text-sm text-slate-500">
                      {credential.username && (
                        <div>User: {credential.username}</div>
                      )}
                      {credential.domain && (
                        <div>Domain: {credential.domain}</div>
                      )}
                      {credential.port && (
                        <div>Port: {credential.port}</div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-xs text-slate-400">
                      Created: {new Date(credential.created_at).toLocaleDateString()}
                      {credential.last_used && (
                        <div>Last used: {new Date(credential.last_used).toLocaleDateString()}</div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {filteredCredentials.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No credentials found. Create your first credential to get started.
            </div>
          )}
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Credential"
      >
        {renderCredentialForm()}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Credential
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCredential(null);
          resetForm();
        }}
        title="Edit Credential"
      >
        {renderCredentialForm()}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false);
              setEditingCredential(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdate}>
            Update Credential
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CredentialsManager;

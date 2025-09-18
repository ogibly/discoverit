import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { cn } from '../utils/cn';

const AssetDetail = ({ asset }) => {
  const { deleteAsset, updateAsset } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (asset) {
      setEditData({
        name: asset.name || '',
        description: asset.description || '',
        owner: asset.owner || '',
        location: asset.location || '',
        department: asset.department || '',
        username: asset.username || '',
        password: asset.password || '',
        ssh_key: asset.ssh_key || ''
      });
    }
  }, [asset]);

  if (!asset) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            Select an asset to view details
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      await updateAsset(asset.id, editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(asset.id);
      } catch (error) {
        console.error('Failed to delete asset:', error);
      }
    }
  };

  const getStatusBadge = () => {
    if (!asset.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (asset.is_managed) {
      return <Badge variant="default">Managed</Badge>;
    }
    return <Badge variant="outline">Discovered</Badge>;
  };

  const getLastSeenText = () => {
    if (!asset.last_seen) return 'Never';
    const date = new Date(asset.last_seen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{asset.name}</span>
              {getStatusBadge()}
            </CardTitle>
            {asset.description && (
              <p className="text-sm text-slate-600 mt-1">{asset.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            {isEditing && (
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="scans">Scan History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.name}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Owner
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.owner}
                    onChange={(e) => setEditData({...editData, owner: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.owner || 'N/A'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.location || 'N/A'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.department}
                    onChange={(e) => setEditData({...editData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.department || 'N/A'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Seen
                </label>
                <div className="text-sm">{getLastSeenText()}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Created
                </label>
                <div className="text-sm">{new Date(asset.created_at).toLocaleString()}</div>
              </div>
            </div>
            
            {asset.description && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.description}</div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="network" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Primary IP
                </label>
                <div className="font-mono text-sm">{asset.primary_ip || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  MAC Address
                </label>
                <div className="font-mono text-sm">{asset.mac_address || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Hostname
                </label>
                <div className="text-sm">{asset.hostname || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Operating System
                </label>
                <div className="text-sm">
                  {asset.os_name ? (
                    <div>
                      <div>{asset.os_name}</div>
                      {asset.os_version && (
                        <div className="text-xs text-slate-500">{asset.os_version}</div>
                      )}
                    </div>
                  ) : (
                    'Unknown'
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Manufacturer
                </label>
                <div className="text-sm">{asset.manufacturer || 'N/A'}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Model
                </label>
                <div className="text-sm">{asset.model || 'N/A'}</div>
              </div>
            </div>
            
            {asset.ip_addresses && asset.ip_addresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  All IP Addresses
                </label>
                <div className="space-y-1">
                  {asset.ip_addresses.map((ip, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{ip.ip}</span>
                      {ip.is_primary && (
                        <Badge variant="default" className="text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="credentials" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.username || 'N/A'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                {isEditing ? (
                  <input
                    type="password"
                    value={editData.password}
                    onChange={(e) => setEditData({...editData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm">{asset.password ? '••••••••' : 'N/A'}</div>
                )}
              </div>
            </div>
            
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SSH Key
                </label>
                <textarea
                  value={editData.ssh_key}
                  onChange={(e) => setEditData({...editData, ssh_key: e.target.value})}
                  rows={4}
                  placeholder="Paste SSH private key here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scans" className="space-y-4">
            <div className="text-center text-slate-500 py-8">
              Scan history will be displayed here
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AssetDetail;
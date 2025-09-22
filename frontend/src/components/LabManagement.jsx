import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { cn } from '../utils/cn';
import PageHeader from './PageHeader';

const LabManagement = () => {
  const [labs, setLabs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [labForm, setLabForm] = useState({
    name: '',
    description: '',
    location: '',
    networks: [],
    scanners: [],
    manager: '',
    contact_email: '',
    is_active: true
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockLabs = [
      {
        id: 1,
        name: 'Computer Science Lab A',
        description: 'Main computer science laboratory with workstations and servers',
        location: 'Building A, Room 101',
        networks: ['192.168.1.0/24', '192.168.2.0/24'],
        scanners: ['Scanner-1', 'Scanner-2'],
        manager: 'Dr. John Smith',
        contact_email: 'john.smith@university.edu',
        is_active: true,
        device_count: 45,
        last_scan: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Engineering Lab B',
        description: 'Engineering laboratory with IoT devices and sensors',
        location: 'Building B, Room 205',
        networks: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        scanners: ['Scanner-3'],
        manager: 'Prof. Jane Doe',
        contact_email: 'jane.doe@university.edu',
        is_active: true,
        device_count: 32,
        last_scan: '2024-01-14T15:45:00Z'
      },
      {
        id: 3,
        name: 'Research Lab C',
        description: 'Research laboratory with specialized equipment',
        location: 'Building C, Room 301',
        networks: ['172.16.0.0/16'],
        scanners: ['Scanner-4', 'Scanner-5'],
        manager: 'Dr. Mike Johnson',
        contact_email: 'mike.johnson@university.edu',
        is_active: false,
        device_count: 18,
        last_scan: '2024-01-10T09:15:00Z'
      }
    ];
    setLabs(mockLabs);
  }, []);

  const handleCreateLab = () => {
    setLabForm({
      name: '',
      description: '',
      location: '',
      networks: [],
      scanners: [],
      manager: '',
      contact_email: '',
      is_active: true
    });
    setShowCreateModal(true);
  };

  const handleEditLab = (lab) => {
    setSelectedLab(lab);
    setLabForm({
      name: lab.name,
      description: lab.description,
      location: lab.location,
      networks: lab.networks,
      scanners: lab.scanners,
      manager: lab.manager,
      contact_email: lab.contact_email,
      is_active: lab.is_active
    });
    setShowEditModal(true);
  };

  const handleSaveLab = () => {
    if (showCreateModal) {
      const newLab = {
        id: Date.now(),
        ...labForm,
        device_count: 0,
        last_scan: null
      };
      setLabs([...labs, newLab]);
    } else {
      const updatedLabs = labs.map(lab =>
        lab.id === selectedLab.id ? { ...lab, ...labForm } : lab
      );
      setLabs(updatedLabs);
    }
    
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedLab(null);
  };

  const handleDeleteLab = (labId) => {
    if (confirm('Are you sure you want to delete this lab?')) {
      setLabs(labs.filter(lab => lab.id !== labId));
    }
  };

  const addNetwork = () => {
    setLabForm({
      ...labForm,
      networks: [...labForm.networks, '']
    });
  };

  const updateNetwork = (index, value) => {
    const updatedNetworks = [...labForm.networks];
    updatedNetworks[index] = value;
    setLabForm({
      ...labForm,
      networks: updatedNetworks
    });
  };

  const removeNetwork = (index) => {
    const updatedNetworks = labForm.networks.filter((_, i) => i !== index);
    setLabForm({
      ...labForm,
      networks: updatedNetworks
    });
  };

  const metrics = [
    { value: labs.length, label: "Total Labs", color: "text-primary" },
    { value: labs.filter(l => l.is_active).length, label: "Active Labs", color: "text-success" },
    { value: labs.reduce((sum, l) => sum + l.device_count, 0), label: "Total Devices", color: "text-info" },
    { value: labs.filter(l => l.last_scan && new Date(l.last_scan) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, label: "Recently Scanned", color: "text-warning" }
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title="Lab Management"
        subtitle="Manage your lab networks and access controls"
        metrics={metrics}
        actions={[
          {
            label: "Create Lab",
            icon: "➕",
            onClick: handleCreateLab,
            variant: "default"
          }
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <Card key={lab.id} className="surface-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">🏢</span>
                    <span>{lab.name}</span>
                  </CardTitle>
                  <Badge
                    variant={lab.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {lab.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{lab.description}</p>
                    <p className="text-sm text-muted-foreground">📍 {lab.location}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Networks:</h4>
                    <div className="flex flex-wrap gap-1">
                      {lab.networks.map((network, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {network}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Manager:</h4>
                    <p className="text-sm text-muted-foreground">{lab.manager}</p>
                    <p className="text-xs text-muted-foreground">{lab.contact_email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{lab.device_count}</div>
                      <div className="text-xs text-muted-foreground">Devices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-info">{lab.scanners.length}</div>
                      <div className="text-xs text-muted-foreground">Scanners</div>
                    </div>
                  </div>

                  {lab.last_scan && (
                    <div className="text-xs text-muted-foreground">
                      Last scan: {new Date(lab.last_scan).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex space-x-2 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      onClick={() => handleEditLab(lab)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteLab(lab.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Lab Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Lab"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lab Name *
            </label>
            <Input
              value={labForm.name}
              onChange={(e) => setLabForm({...labForm, name: e.target.value})}
              placeholder="Enter lab name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={labForm.description}
              onChange={(e) => setLabForm({...labForm, description: e.target.value})}
              placeholder="Enter lab description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Location
            </label>
            <Input
              value={labForm.location}
              onChange={(e) => setLabForm({...labForm, location: e.target.value})}
              placeholder="Enter lab location"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lab Networks *
            </label>
            <div className="space-y-2">
              {labForm.networks.map((network, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={network}
                    onChange={(e) => updateNetwork(index, e.target.value)}
                    placeholder="e.g., 192.168.1.0/24"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeNetwork(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addNetwork}
                className="w-full"
              >
                Add Network
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lab Manager *
            </label>
            <Input
              value={labForm.manager}
              onChange={(e) => setLabForm({...labForm, manager: e.target.value})}
              placeholder="Enter manager name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Contact Email *
            </label>
            <Input
              type="email"
              value={labForm.contact_email}
              onChange={(e) => setLabForm({...labForm, contact_email: e.target.value})}
              placeholder="Enter contact email"
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={labForm.is_active}
              onChange={(e) => setLabForm({...labForm, is_active: e.target.checked})}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              Lab is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLab}
              disabled={!labForm.name || !labForm.manager || !labForm.contact_email || labForm.networks.length === 0}
            >
              Create Lab
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Lab Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Lab"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lab Name *
            </label>
            <Input
              value={labForm.name}
              onChange={(e) => setLabForm({...labForm, name: e.target.value})}
              placeholder="Enter lab name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={labForm.description}
              onChange={(e) => setLabForm({...labForm, description: e.target.value})}
              placeholder="Enter lab description"
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Location
            </label>
            <Input
              value={labForm.location}
              onChange={(e) => setLabForm({...labForm, location: e.target.value})}
              placeholder="Enter lab location"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lab Networks *
            </label>
            <div className="space-y-2">
              {labForm.networks.map((network, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={network}
                    onChange={(e) => updateNetwork(index, e.target.value)}
                    placeholder="e.g., 192.168.1.0/24"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeNetwork(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addNetwork}
                className="w-full"
              >
                Add Network
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Lab Manager *
            </label>
            <Input
              value={labForm.manager}
              onChange={(e) => setLabForm({...labForm, manager: e.target.value})}
              placeholder="Enter manager name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Contact Email *
            </label>
            <Input
              type="email"
              value={labForm.contact_email}
              onChange={(e) => setLabForm({...labForm, contact_email: e.target.value})}
              placeholder="Enter contact email"
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={labForm.is_active}
              onChange={(e) => setLabForm({...labForm, is_active: e.target.checked})}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="is_active_edit" className="text-sm text-foreground">
              Lab is active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLab}
              disabled={!labForm.name || !labForm.manager || !labForm.contact_email || labForm.networks.length === 0}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LabManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OperationsManagement from './OperationsManagement'; // Import the existing Operations component

const API_BASE = import.meta.env.VITE_API_BASE;

export default function Settings() {
  const [activeSection, setActiveSection] = useState('scanners'); // 'scanners' or 'operations'
  const [scanners, setScanners] = useState([{ name: '', url: '', subnets: '' }]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/settings`);
        if (response.data && response.data.scanners) {
          setScanners(response.data.scanners);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveScanners = async () => {
    try {
      await axios.post(`${API_BASE}/settings`, { scanners });
      alert('Scanner settings saved successfully!');
    } catch (error) {
      console.error('Error saving scanner settings:', error);
      alert('Failed to save scanner settings.');
    }
  };

  const handleAddScanner = () => {
    setScanners([...scanners, { name: '', url: '', subnets: '' }]);
  };

  const handleRemoveScanner = (index) => {
    const newScanners = [...scanners];
    newScanners.splice(index, 1);
    setScanners(newScanners);
  };

  const handleScannerChange = (index, field, value) => {
    const newScanners = [...scanners];
    newScanners[index][field] = value;
    setScanners(newScanners);
  };

  const navLinkClasses = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
  const activeLinkClasses = "bg-blue-600 text-white";
  const inactiveLinkClasses = "text-slate-400 hover:bg-slate-800 hover:text-white";

  return (
    <div className="p-6 text-slate-300">
      <h2 className="text-2xl font-bold mb-6 text-white">Application Settings</h2>

      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveSection('scanners')}
          className={`${navLinkClasses} ${activeSection === 'scanners' ? activeLinkClasses : inactiveLinkClasses}`}
        >
          Scanners
        </button>
        <button
          onClick={() => setActiveSection('operations')}
          className={`${navLinkClasses} ${activeSection === 'operations' ? activeLinkClasses : inactiveLinkClasses}`}
        >
          Operations Management
        </button>
      </div>

      {activeSection === 'scanners' && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-white">Scanner Configuration</h3>
          {scanners.map((scanner, index) => (
            <div key={index} className="space-y-4 border border-slate-800 p-4 rounded-lg mb-4 bg-slate-900/70">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white">Scanner {index + 1}</h4>
                <button
                  onClick={() => handleRemoveScanner(index)}
                  className="px-3 py-1 text-xs font-medium text-red-500 bg-red-900/50 border border-red-800 rounded-md hover:bg-red-900"
                >
                  Remove
                </button>
              </div>
              <div>
                <label htmlFor={`name-${index}`} className="block text-sm font-medium text-slate-400">
                  Scanner Name
                </label>
                <input
                  type="text"
                  id={`name-${index}`}
                  value={scanner.name}
                  onChange={(e) => handleScannerChange(index, 'name', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Main Office Scanner"
                />
              </div>
              <div>
                <label htmlFor={`url-${index}`} className="block text-sm font-medium text-slate-400">
                  Scanner URL
                </label>
                <input
                  type="text"
                  id={`url-${index}`}
                  value={scanner.url}
                  onChange={(e) => handleScannerChange(index, 'url', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., http://scanner1:8001"
                />
              </div>
              <div>
                <label htmlFor={`subnets-${index}`} className="block text-sm font-medium text-slate-400">
                  Target Subnets (comma-separated)
                </label>
                <input
                  type="text"
                  id={`subnets-${index}`}
                  value={scanner.subnets}
                  onChange={(e) => handleScannerChange(index, 'subnets', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., 192.168.1.0/24, 10.0.0.0/8"
                />
              </div>
            </div>
          ))}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleAddScanner}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add Scanner
            </button>
            <button
              onClick={handleSaveScanners}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Scanner Settings
            </button>
          </div>
        </div>
      )}

      {activeSection === 'operations' && (
        <OperationsManagement />
      )}
    </div>
  );
}

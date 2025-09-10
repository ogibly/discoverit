import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function RunOperationModal({ assets, assetGroups, onClose, operation: initialOperation }) {
  const [operation, setOperation] = useState(initialOperation ? initialOperation.id : '');
  const [operations, setOperations] = useState([]);
  const [params, setParams] = useState({});
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}/operations`).then(res => {
      setOperations(res.data);
      if (initialOperation) {
        setOperation(initialOperation.id);
      }
    });
  }, [initialOperation]);

  const handleRunOperation = async () => {
    if (!operation) {
      setStatusMsg('Please select an operation.');
      return;
    }

    const selectedOperation = operations.find(op => op.id === parseInt(operation));

    const operationData = {
      name: selectedOperation.name,
      params,
      asset_ids: assets.map(a => a.id),
      asset_group_ids: assetGroups.map(ag => ag.id),
    };

    try {
      await axios.post(`${API_BASE}/operations/run`, operationData);
      setStatusMsg('Operation started successfully.');
      onClose();
    } catch (error) {
      setStatusMsg('Failed to start operation.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Run Operation</h2>
        <div className="mb-4">
          <label htmlFor="operation" className="block text-sm font-medium text-slate-300 mb-2">
            Operation
          </label>
          <select
            id="operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
          >
            <option value="">Select an operation</option>
            {operations.map((op) => (
              <option key={op.id} value={op.id}>
                {op.name}
              </option>
            ))}
          </select>
        </div>
        {/* Placeholder for operation-specific parameters */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleRunOperation}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
          >
            Run
          </button>
        </div>
        {statusMsg && <p className="text-sm text-slate-400 mt-4">{statusMsg}</p>}
      </div>
    </div>
  );
}

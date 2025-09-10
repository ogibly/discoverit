import React, { useState, useEffect } from 'react';

export default function OperationModal({ operation, onSave, onClose }) {
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiHeaders, setApiHeaders] = useState('');
  const [apiBody, setApiBody] = useState('');

  useEffect(() => {
    if (operation) {
      setName(operation.name);
      setApiUrl(operation.api_url);
      setApiMethod(operation.api_method);
      setApiHeaders(operation.api_headers);
      setApiBody(operation.api_body);
    }
  }, [operation]);

  const handleSave = () => {
    onSave({
      name,
      api_url: apiUrl,
      api_method: apiMethod,
      api_headers: apiHeaders,
      api_body: apiBody,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          {operation ? 'Edit Operation' : 'Create Operation'}
        </h2>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="api_url" className="block text-sm font-medium text-slate-300 mb-2">
            API URL
          </label>
          <input
            type="text"
            id="api_url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="api_method" className="block text-sm font-medium text-slate-300 mb-2">
            API Method
          </label>
          <select
            id="api_method"
            value={apiMethod}
            onChange={(e) => setApiMethod(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="api_headers" className="block text-sm font-medium text-slate-300 mb-2">
            API Headers
          </label>
          <textarea
            id="api_headers"
            value={apiHeaders}
            onChange={(e) => setApiHeaders(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="api_body" className="block text-sm font-medium text-slate-300 mb-2">
            API Body
          </label>
          <textarea
            id="api_body"
            value={apiBody}
            onChange={(e) => setApiBody(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
          />
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

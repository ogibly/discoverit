import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function LabelManager({ selectedObject, onUpdate }) {
  const [labels, setLabels] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (selectedObject) {
      setLabels(selectedObject.labels || []);
    }
  }, [selectedObject]);

  useEffect(() => {
    axios.get(`${API_BASE}/labels`).then(res => {
      setAllLabels(res.data);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  const handleCreateLabel = async () => {
    if (newLabel && !allLabels.find(l => l.name === newLabel)) {
      try {
        const res = await axios.post(`${API_BASE}/labels`, { name: newLabel });
        const createdLabel = res.data;
        setAllLabels([...allLabels, createdLabel]);
        const updatedLabels = [...labels, createdLabel];
        setLabels(updatedLabels);
        onUpdate({ ...selectedObject, labels: updatedLabels.map(l => l.id) });
        setNewLabel('');
      } catch (error) {
        console.error("Failed to create label", error);
      }
    }
  };

  const toggleLabel = (label) => {
    let updatedLabels;
    if (labels.find(l => l.id === label.id)) {
      updatedLabels = labels.filter(l => l.id !== label.id);
    } else {
      updatedLabels = [...labels, label];
    }
    setLabels(updatedLabels);
    onUpdate({ ...selectedObject, labels: updatedLabels.map(l => l.id) });
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap gap-2 p-2 border border-slate-700 rounded-md bg-slate-800 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {labels.map(label => (
          <span key={label.id} className="bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {label.name}
          </span>
        ))}
        {labels.length === 0 && <span className="text-slate-500">Select labels</span>}
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Create new label"
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-1 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleCreateLabel} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1 rounded-md text-sm">
              Create
            </button>
          </div>
          <ul className="max-h-40 overflow-y-auto">
            {allLabels.map(label => (
              <li key={label.id} className="px-3 py-2 hover:bg-slate-700 cursor-pointer flex items-center" onClick={() => toggleLabel(label)}>
                <input
                  type="checkbox"
                  checked={!!labels.find(l => l.id === label.id)}
                  readOnly
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm">{label.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

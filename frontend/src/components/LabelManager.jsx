import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api/v2';

export default function LabelManager({ selectedObject, onUpdate }) {
  const [labels, setLabels] = useState([]);
  const [allLabels, setAllLabels] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

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
        setIsEditing(false);
        setInputValue('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const updateLabels = (newLabels) => {
    setLabels(newLabels);
    onUpdate({ ...selectedObject, labels: newLabels });
  };

  const handleAddLabel = (label) => {
    const newLabels = [...labels, label];
    updateLabels(newLabels);
    setInputValue('');
    setIsEditing(false);
  };

  const handleCreateLabel = async () => {
    if (inputValue && !allLabels.find(l => l.name.toLowerCase() === inputValue.toLowerCase())) {
      try {
        const res = await axios.post(`${API_BASE}/labels`, { name: inputValue });
        const createdLabel = res.data;
        setAllLabels([...allLabels, createdLabel]);
        handleAddLabel(createdLabel);
      } catch (error) {
        console.error("Failed to create label", error);
      }
    }
  };

  const handleRemoveLabel = (labelToRemove) => {
    const newLabels = labels.filter(label => label.id !== labelToRemove.id);
    updateLabels(newLabels);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = filteredLabels.find(l => l.name.toLowerCase() === inputValue.toLowerCase());
      if (exactMatch) {
        handleAddLabel(exactMatch);
      } else {
        handleCreateLabel();
      }
    }
  };

  const filteredLabels = allLabels.filter(
    label => !labels.some(l => l.id === label.id) &&
             label.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-2" ref={ref}>
      {labels.map(label => (
        <span key={label.id} className="bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center">
          {label.name}
          <button
            onClick={() => handleRemoveLabel(label)}
            className="ml-2 text-red-500 hover:text-red-400"
          >
            &times;
          </button>
        </span>
      ))}
      <div className="relative">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-full"
        >
          + Add Label
        </button>
        {isEditing && (
          <div className="absolute z-10 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add or create label"
              className="w-full bg-slate-700 border-b border-slate-600 px-3 py-2 text-sm text-slate-300 focus:outline-none"
            />
            <ul className="max-h-40 overflow-y-auto">
              {filteredLabels.map(label => (
                <li
                  key={label.id}
                  onClick={() => handleAddLabel(label)}
                  className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm"
                >
                  {label.name}
                </li>
              ))}
              {inputValue && !allLabels.some(l => l.name.toLowerCase() === inputValue.toLowerCase()) && (
                <li
                  onClick={handleCreateLabel}
                  className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm"
                >
                  Create "<strong>{inputValue}</strong>"
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

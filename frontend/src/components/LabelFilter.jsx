import React, { useState, useEffect, useRef } from 'react';

export default function LabelFilter({ allLabels, selectedLabels, setSelectedLabels }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

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

  const toggleLabel = (label) => {
    let updatedLabels;
    if (selectedLabels.find(l => l.id === label.id)) {
      updatedLabels = selectedLabels.filter(l => l.id !== label.id);
    } else {
      updatedLabels = [...selectedLabels, label];
    }
    setSelectedLabels(updatedLabels);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-wrap gap-2 p-2 border border-slate-700 rounded-md bg-slate-800 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {selectedLabels.map(label => (
          <span key={label.id} className="bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {label.name}
          </span>
        ))}
        {selectedLabels.length === 0 && <span className="text-slate-500">Filter by label</span>}
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg">
          <ul className="max-h-40 overflow-y-auto">
            {allLabels.map(label => (
              <li key={label.id} className="px-3 py-2 hover:bg-slate-700 cursor-pointer flex items-center" onClick={() => toggleLabel(label)}>
                <input
                  type="checkbox"
                  checked={!!selectedLabels.find(l => l.id === label.id)}
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

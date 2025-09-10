import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

export default function ScanLog() {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/scans`).then(res => {
      setScans(res.data.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
    });
  }, []);

  return (
    <div className="flex flex-col h-full text-slate-300">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">Scans Log</h2>
      </div>
      <div className="flex flex-col flex-grow overflow-hidden border border-slate-800 rounded-lg bg-slate-900/50">
        <div className="flex-grow overflow-y-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800">
              <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Target</th>
                <th scope="col" className="px-6 py-3">Scan Type</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Start Time</th>
                <th scope="col" className="px-6 py-3">End Time</th>
              </tr>
            </thead>
            <tbody>
              {scans.map(scan => (
                <tr key={scan.id} className="border-b border-slate-800 transition-colors duration-150 hover:bg-slate-800/50">
                  <td className="px-6 py-4">{scan.id}</td>
                  <td className="px-6 py-4">{scan.target}</td>
                  <td className="px-6 py-4">{scan.scan_type}</td>
                  <td className="px-6 py-4">{scan.status}</td>
                  <td className="px-6 py-4">{new Date(scan.start_time).toLocaleString()}</td>
                  <td className="px-6 py-4">{scan.end_time ? new Date(scan.end_time).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

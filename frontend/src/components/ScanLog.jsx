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
    <div>
      <div className="header">
        <h2>Scans Log</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Target</th>
            <th>Scan Type</th>
            <th>Status</th>
            <th>Start Time</th>
            <th>End Time</th>
          </tr>
        </thead>
        <tbody>
          {scans.map(scan => (
            <tr key={scan.id}>
              <td>{scan.id}</td>
              <td>{scan.target}</td>
              <td>{scan.scan_type}</td>
              <td>{scan.status}</td>
              <td>{new Date(scan.start_time).toLocaleString()}</td>
              <td>{scan.end_time ? new Date(scan.end_time).toLocaleString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import DeviceList from "./components/DeviceList";
import DeviceDetail from "./components/DeviceDetail";

export default function App() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loadingScan, setLoadingScan] = useState(false);

  const fetchDevices = () => {
    axios.get("http://localhost:8000/devices").then(res => setDevices(res.data));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const triggerScan = async () => {
    setLoadingScan(true);
    try {
      await axios.post("http://localhost:8000/scan");
      await new Promise(r => setTimeout(r, 2000));
      fetchDevices();
      if (selectedDevice) setSelectedDevice(devices.find(d => d.id === selectedDevice.id) || null);
    } finally { setLoadingScan(false); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">DiscoverIT Dashboard</h1>
      <div className="mb-4">
        <button
          onClick={triggerScan}
          disabled={loadingScan}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingScan ? "Scanning..." : "Trigger Network Scan"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <DeviceList devices={devices} onSelect={setSelectedDevice} />
        </div>
        <div className="col-span-2">
          {selectedDevice ? (
            <DeviceDetail device={selectedDevice} />
          ) : <p className="text-gray-600">Select a device to see details.</p>}
        </div>
      </div>
    </div>
  );
}
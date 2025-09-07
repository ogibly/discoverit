import React from 'react';
import { useState, useEffect } from "react";
import axios from "axios";
import DeviceList from "./components/DeviceList";
import DeviceDetail from "./components/DeviceDetail";

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
	const [devices, setDevices] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [loadingScan, setLoadingScan] = useState(false);
	const [newDevice, setNewDevice] = useState({ ip: "", mac: "", vendor: "" });
	const [target, setTarget] = useState("");
    const [statusMsg, setStatusMsg] = useState("");

	const fetchDevices = () => {
		axios.get(`${API_BASE}/devices`).then(res => setDevices(res.data));
	};

	useEffect(() => {
		fetchDevices();
		// fetch suggested subnet
		axios.get(`${API_BASE}/suggest_subnet`).then(res => {
			if (res.data && res.data.subnet && !target) setTarget(res.data.subnet);
		}).catch(() => {});
		// poll for devices every 3 seconds
		const id = setInterval(fetchDevices, 3000);
		return () => clearInterval(id);
	}, []);

	const createDevice = async (e) => {
		e.preventDefault();
		if (!newDevice.ip) return;
		await axios.post(`${API_BASE}/devices`, {
			ip: newDevice.ip,
			mac: newDevice.mac || undefined,
			vendor: newDevice.vendor || undefined,
		});
		setNewDevice({ ip: "", mac: "", vendor: "" });
		fetchDevices();
	};

	const triggerScan = async (scanType) => {
		setLoadingScan(true);
		setStatusMsg(`${scanType.charAt(0).toUpperCase() + scanType.slice(1)} scan started...`);
		try {
			const url = target
				? `${API_BASE}/scan?target=${encodeURIComponent(target)}&scan_type=${scanType}`
				: `${API_BASE}/scan`;
			await axios.post(url);
		} catch (error) {
			setStatusMsg("Failed to start scan.");
		} finally {
			setLoadingScan(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 p-6">
			<h1 className="text-3xl font-bold mb-6">DiscoverIT Dashboard</h1>
			<div className="mb-4 flex items-end gap-4">
				<form onSubmit={createDevice} className="flex gap-2 items-end">
					<div>
						<label className="block text-sm text-gray-600">IP</label>
						<input value={newDevice.ip} onChange={e => setNewDevice({ ...newDevice, ip: e.target.value })} className="border rounded px-2 py-1" placeholder="192.168.1.10" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">MAC</label>
						<input value={newDevice.mac} onChange={e => setNewDevice({ ...newDevice, mac: e.target.value })} className="border rounded px-2 py-1" placeholder="AA:BB:CC:DD:EE:FF" />
					</div>
					<div>
						<label className="block text-sm text-gray-600">Vendor</label>
						<input value={newDevice.vendor} onChange={e => setNewDevice({ ...newDevice, vendor: e.target.value })} className="border rounded px-2 py-1" placeholder="Vendor" />
					</div>
					<button type="submit" className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Device</button>
				</form>
				<div className="ml-auto flex items-end gap-4">
					<div>
						<label className="block text-sm text-gray-600">Target</label>
						<input value={target} onChange={e => setTarget(e.target.value)} className="border rounded px-2 py-1" placeholder="192.168.1.0/24 or 192.168.1.1-50" />
					</div>
					<div className="flex items-end gap-2">
						<button
							onClick={() => triggerScan("quick")}
							disabled={loadingScan}
							className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
						>
							{loadingScan ? "Scanning..." : "Quick Scan"}
						</button>
						<button
							onClick={() => triggerScan("comprehensive")}
							disabled={loadingScan}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{loadingScan ? "Scanning..." : "Comprehensive Scan"}
						</button>
					</div>
				</div>
			</div>
			{statusMsg && (
				<div className="mb-2 text-sm text-gray-700">
					<span>{statusMsg}</span>
				</div>
			)}
			<div className="grid grid-cols-3 gap-6">
				<div className="col-span-1">
					<DeviceList devices={devices} onSelect={setSelectedDevice} />
				</div>
				<div className="col-span-2">
					{selectedDevice ? (
						<DeviceDetail device={selectedDevice} />
					) : (
						<p className="text-gray-600">Select a device to see details.</p>
					)}
				</div>
			</div>
		</div>
	);
}

export default App;

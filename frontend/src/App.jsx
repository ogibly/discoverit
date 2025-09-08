import React from 'react';
import { useState, useEffect } from "react";
import axios from "axios";
import DeviceList from "./components/DeviceList";
import DeviceDetail from "./components/DeviceDetail";
import AssetList from "./components/AssetList";
import AssetDetail from "./components/AssetDetail";
import AssetManager from "./components/AssetManager";
import AssetGroupList from "./components/AssetGroupList";
import AssetGroupDetail from "./components/AssetGroupDetail";
import AssetGroupManager from "./components/AssetGroupManager";

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
	const [devices, setDevices] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [selectedDevices, setSelectedDevices] = useState([]);
	const [assets, setAssets] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState(null);
	const [showAssetManager, setShowAssetManager] = useState(false);
	const [assetGroups, setAssetGroups] = useState([]);
	const [selectedAssetGroup, setSelectedAssetGroup] = useState(null);
	const [showAssetGroupManager, setShowAssetGroupManager] = useState(false);
	const [editingAssetGroup, setEditingAssetGroup] = useState(null);
	const [newDevice, setNewDevice] = useState({ ip: "", mac: "", vendor: "" });
	const [target, setTarget] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [activeScan, setActiveScan] = useState(null);
    const prevActiveScan = React.useRef();

	const fetchDevices = () => {
		axios.get(`${API_BASE}/devices`).then(res => setDevices(res.data));
	};

	const fetchAssets = () => {
		axios.get(`${API_BASE}/assets`).then(res => setAssets(res.data));
	};

	const fetchAssetGroups = () => {
		axios.get(`${API_BASE}/asset_groups`).then(res => setAssetGroups(res.data));
	};

	useEffect(() => {
		fetchDevices();
		fetchAssets();
		fetchAssetGroups();
		// fetch suggested subnet
		axios.get(`${API_BASE}/suggest_subnet`).then(res => {
			if (res.data && res.data.subnet && !target) setTarget(res.data.subnet);
		}).catch(() => {});
		
		// poll for devices and active scan status
		const deviceInterval = setInterval(fetchDevices, 3000);
		const assetInterval = setInterval(fetchAssets, 3000);
		const assetGroupInterval = setInterval(fetchAssetGroups, 3000);
		const scanInterval = setInterval(() => {
			axios.get(`${API_BASE}/scan/active`).then(res => {
				setActiveScan(res.data);
			}).catch(() => setActiveScan(null));
		}, 3000);

		return () => {
			clearInterval(deviceInterval);
			clearInterval(assetInterval);
			clearInterval(assetGroupInterval);
			clearInterval(scanInterval);
		};
	}, []);

	useEffect(() => {
		if (prevActiveScan.current && !activeScan) {
			setStatusMsg("Scan completed.");
			const timer = setTimeout(() => setStatusMsg(""), 5000);
			return () => clearTimeout(timer);
		}
		prevActiveScan.current = activeScan;
	}, [activeScan]);

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
		setStatusMsg(""); // Clear previous messages
		try {
			const url = target
				? `${API_BASE}/scan?target=${encodeURIComponent(target)}&scan_type=${scanType}`
				: `${API_BASE}/scan`;
			const res = await axios.post(url);
			setActiveScan(res.data);
		} catch (error) {
			setStatusMsg("Failed to start scan.");
		}
	};

	const deleteDevice = async (deviceId) => {
		if (window.confirm("Are you sure you want to delete this device and all its scan history?")) {
			try {
				await axios.delete(`${API_BASE}/devices/${deviceId}`);
				fetchDevices();
				if (selectedDevice && selectedDevice.id === deviceId) {
					setSelectedDevice(null);
				}
			} catch (error) {
				setStatusMsg("Failed to delete device.");
			}
		}
	};

	const handleSelectDevice = (deviceId) => {
		setSelectedDevices((prev) =>
			prev.includes(deviceId)
				? prev.filter((id) => id !== deviceId)
				: [...prev, deviceId]
		);
	};

	const handleDeleteSelected = async () => {
		if (window.confirm(`Are you sure you want to delete ${selectedDevices.length} devices?`)) {
			try {
				await Promise.all(
					selectedDevices.map((id) => axios.delete(`${API_BASE}/devices/${id}`))
				);
				fetchDevices();
				setSelectedDevices([]);
			} catch (error) {
				setStatusMsg("Failed to delete devices.");
			}
		}
	};

	const handleCreateAsset = async () => {
		const devicesToConvert = devices.filter((d) => selectedDevices.includes(d.id));
		if (devicesToConvert.length === 0) return;

		const name = devicesToConvert[0].ip;
		if (!name) return;

		const assetData = {
			name,
			mac: devicesToConvert[0].mac,
			ips: devicesToConvert.map((d) => ({ ip: d.ip })),
			// You can add more fields here as needed
		};

		try {
			await axios.post(`${API_BASE}/assets`, assetData);
			setStatusMsg("Asset created successfully.");
			setSelectedDevices([]);
			fetchAssets();
		} catch (error) {
			setStatusMsg("Failed to create asset.");
		}
	};

	const handleUpdateAsset = async (assetId, updatedData) => {
		try {
			await axios.put(`${API_BASE}/assets/${assetId}`, updatedData);
			fetchAssets();
		} catch (error) {
			setStatusMsg("Failed to update asset.");
		}
	};

	const handleSaveAssetGroup = async (groupData) => {
		try {
			if (editingAssetGroup) {
				await axios.put(`${API_BASE}/asset_groups/${editingAssetGroup.id}`, groupData);
			} else {
				await axios.post(`${API_BASE}/asset_groups`, groupData);
			}
			fetchAssetGroups();
			setShowAssetGroupManager(false);
			setEditingAssetGroup(null);
		} catch (error) {
			setStatusMsg("Failed to save asset group.");
		}
	};

	const deleteAssetGroup = async (assetGroupId) => {
		if (window.confirm("Are you sure you want to delete this asset group?")) {
			try {
				await axios.delete(`${API_BASE}/asset_groups/${assetGroupId}`);
				fetchAssetGroups();
				if (selectedAssetGroup && selectedAssetGroup.id === assetGroupId) {
					setSelectedAssetGroup(null);
				}
			} catch (error) {
				setStatusMsg("Failed to delete asset group.");
			}
		}
	};

	const handleRescanSelected = async () => {
		const devicesToRescan = devices.filter((d) => selectedDevices.includes(d.id));
		if (devicesToRescan.length === 0) return;

		const targets = devicesToRescan.map((d) => d.ip).join(",");
		try {
			await triggerScan("comprehensive", targets);
		} catch (error) {
			setStatusMsg("Failed to start re-scan.");
		}
	};

	const deleteAsset = async (assetId) => {
		if (window.confirm("Are you sure you want to delete this asset?")) {
			try {
				await axios.delete(`${API_BASE}/assets/${assetId}`);
				fetchAssets();
				if (selectedAsset && selectedAsset.id === assetId) {
					setSelectedAsset(null);
				}
			} catch (error) {
				setStatusMsg("Failed to delete asset.");
			}
		}
	};

	const deleteScan = async (scanId) => {
		if (window.confirm("Are you sure you want to delete this scan record?")) {
			try {
				await axios.delete(`${API__BASE}/scans/${scanId}`);
				// We need to force a re-fetch of the history for the selected device
				// A simple way is to "deselect" and "reselect" the device
				const currentDevice = selectedDevice;
				setSelectedDevice(null);
				setTimeout(() => setSelectedDevice(currentDevice), 0);
			} catch (error) {
				setStatusMsg("Failed to delete scan record.");
			}
		}
	};

	const cancelScan = async () => {
		if (!activeScan) return;
		try {
			await axios.post(`${API_BASE}/scan/${activeScan.id}/cancel`);
			setStatusMsg("Scan cancellation requested.");
		} catch (error) {
			setStatusMsg("Failed to cancel scan.");
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
							disabled={!!activeScan}
							className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50"
						>
							{activeScan ? "Scanning..." : "Quick Scan"}
						</button>
						<button
							onClick={() => triggerScan("comprehensive")}
							disabled={!!activeScan}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{activeScan ? "Scanning..." : "Comprehensive Scan"}
						</button>
						{activeScan && (
							<button
								onClick={cancelScan}
								className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
							>
								Cancel Scan
							</button>
						)}
					</div>
				</div>
			</div>
			{(activeScan || statusMsg) && (
				<div className="mb-2 text-sm text-gray-700">
					{activeScan ? (
						<span>{`Scanning ${activeScan.target} (${activeScan.scan_type})...`}</span>
					) : (
						<span>{statusMsg}</span>
					)}
				</div>
			)}
			<div className="grid grid-cols-3 gap-6">
				<div className="col-span-1">
					<DeviceList
						devices={devices}
						onSelect={setSelectedDevice}
						onDelete={deleteDevice}
						selectedDevices={selectedDevices}
						onSelectDevice={handleSelectDevice}
						onDeleteSelected={handleDeleteSelected}
						onCreateAsset={handleCreateAsset}
						onRescanSelected={handleRescanSelected}
					/>
					<div className="mt-6">
						<div className="flex justify-between items-center mb-2">
							<h2 className="text-xl font-bold">Assets</h2>
							<button
								onClick={() => setShowAssetManager(true)}
								className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300"
							>
								Manage
							</button>
						</div>
						<AssetList assets={assets} onSelect={setSelectedAsset} onDelete={deleteAsset} />
					</div>
					<div className="mt-6">
						<div className="flex justify-between items-center mb-2">
							<h2 className="text-xl font-bold">Asset Groups</h2>
							<button
								onClick={() => {
									setEditingAssetGroup(null);
									setShowAssetGroupManager(true);
								}}
								className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300"
							>
								Create
							</button>
						</div>
						<AssetGroupList assetGroups={assetGroups} onSelect={setSelectedAssetGroup} onDelete={deleteAssetGroup} />
					</div>
				</div>
				<div className="col-span-2">
					{selectedDevice ? (
						<DeviceDetail device={selectedDevice} onDeleteScan={deleteScan} />
					) : (
						<p className="text-gray-600">Select a device to see details.</p>
					)}
					{selectedAsset && (
						<div className="mt-6">
							<AssetDetail asset={selectedAsset} />
						</div>
					)}
					{selectedAssetGroup && (
						<div className="mt-6">
							<AssetGroupDetail assetGroup={selectedAssetGroup} />
						</div>
					)}
				</div>
			</div>
			{showAssetManager && (
				<AssetManager
					assets={assets}
					onUpdate={handleUpdateAsset}
					onDelete={deleteAsset}
					onClose={() => setShowAssetManager(false)}
				/>
			)}
			{showAssetGroupManager && (
				<AssetGroupManager
					assets={assets}
					assetGroup={editingAssetGroup}
					onSave={handleSaveAssetGroup}
					onClose={() => {
						setShowAssetGroupManager(false);
						setEditingAssetGroup(null);
					}}
				/>
			)}
		</div>
	);
}

export default App;

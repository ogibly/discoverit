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
import Operations from "./components/Operations";
import Scans from "./components/Scans";
import Assets from "./components/Assets";
import AssetGroups from "./components/AssetGroups";
import OperationsTracker from "./components/OperationsTracker";
import "./modern.css";

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
	const [page, setPage] = useState("dashboard");
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
			let scanTarget = target;
			if (selectedDevices.length > 0) {
				scanTarget = devices
					.filter((d) => selectedDevices.includes(d.id))
					.map((d) => d.ip)
					.join(",");
			}
			const url = scanTarget
				? `${API_BASE}/scan?target=${encodeURIComponent(scanTarget)}&scan_type=${scanType}`
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

	const handleSelectAllDevices = () => {
		if (selectedDevices.length === devices.length) {
			setSelectedDevices([]);
		} else {
			setSelectedDevices(devices.map((d) => d.id));
		}
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
		<div className="container">
			<div className="sidebar">
				<h1>DiscoverIT</h1>
				<nav>
					<a href="#" onClick={() => setPage("scans")} className={page === "scans" ? "active" : ""}>Scans</a>
					<a href="#" onClick={() => setPage("assets")} className={page === "assets" ? "active" : ""}>Assets</a>
					<a href="#" onClick={() => setPage("asset_groups")} className={page === "asset_groups" ? "active" : ""}>Asset Groups</a>
					<a href="#" onClick={() => setPage("operations_tracker")} className={page === "operations_tracker" ? "active" : ""}>Operations Tracker</a>
				</nav>
			</div>
			<div className="main-content">
				{page === "scans" && (
					<Scans
						devices={devices}
						selectedDevice={selectedDevice}
						setSelectedDevice={setSelectedDevice}
						deleteDevice={deleteDevice}
						selectedDevices={selectedDevices}
						handleSelectDevice={handleSelectDevice}
						handleSelectAllDevices={handleSelectAllDevices}
						handleDeleteSelected={handleDeleteSelected}
						handleCreateAsset={handleCreateAsset}
						triggerScan={triggerScan}
						activeScan={activeScan}
						cancelScan={cancelScan}
						target={target}
						setTarget={setTarget}
						statusMsg={statusMsg}
						deleteScan={deleteScan}
					/>
				)}
				{page === "assets" && (
					<Assets
						assets={assets}
						selectedAsset={selectedAsset}
						setSelectedAsset={setSelectedAsset}
						deleteAsset={deleteAsset}
						setShowAssetManager={setShowAssetManager}
					/>
				)}
				{page === "asset_groups" && (
					<AssetGroups
						assetGroups={assetGroups}
						selectedAssetGroup={selectedAssetGroup}
						setSelectedAssetGroup={setSelectedAssetGroup}
						deleteAssetGroup={deleteAssetGroup}
						setEditingAssetGroup={setEditingAssetGroup}
						setShowAssetGroupManager={setShowAssetGroupManager}
					/>
				)}
				{page === "operations_tracker" && <OperationsTracker />}
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
		</div>
	);
}

export default App;

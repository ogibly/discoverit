import React from 'react';
import { useState, useEffect } from "react";
import axios from "axios";
import AssetManager from "./components/AssetManager";
import AssetGroupManager from "./components/AssetGroupManager";
import RunOperationModal from "./components/RunOperationModal";
import Operations from "./components/Operations";
import Scans from "./components/Scans";
import Assets from "./components/Assets";
import AssetGroups from "./components/AssetGroups";
import OperationsTracker from "./components/OperationsTracker";
import ScanLog from "./components/ScanLog";
import "./modern.css";

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
	const [page, setPage] = useState("scans");
	const [devices, setDevices] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [selectedDevices, setSelectedDevices] = useState([]);
	const [assets, setAssets] = useState([]);
	const [selectedAsset, setSelectedAsset] = useState(null);
	const [selectedAssets, setSelectedAssets] = useState([]);
	const [showAssetManager, setShowAssetManager] = useState(false);
	const [assetGroups, setAssetGroups] = useState([]);
	const [selectedAssetGroup, setSelectedAssetGroup] = useState(null);
	const [selectedAssetGroups, setSelectedAssetGroups] = useState([]);
	const [showAssetGroupManager, setShowAssetGroupManager] = useState(false);
	const [editingAssetGroup, setEditingAssetGroup] = useState(null);
	const [showOperationModal, setShowOperationModal] = useState(false);
	const [allLabels, setAllLabels] = useState([]);
	const [selectedLabels, setSelectedLabels] = useState([]);
	const [target, setTarget] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [activeScan, setActiveScan] = useState(null);
    const prevActiveScan = React.useRef();

	const fetchLabels = () => {
		axios.get(`${API_BASE}/labels`).then(res => setAllLabels(res.data));
	};

	const fetchDevices = () => {
		axios.get(`${API_BASE}/devices`).then(res => setDevices(res.data));
	};

	const fetchAssets = () => {
		axios.get(`${API_BASE}/assets`).then(res => {
			setAssets(res.data);
		});
	};

	const fetchAssetGroups = () => {
		axios.get(`${API_BASE}/asset_groups`).then(res => {
			setAssetGroups(res.data);
		});
	};

	useEffect(() => {
		fetchDevices();
		fetchAssets();
		fetchAssetGroups();
		fetchLabels();
		// fetch suggested subnet
		axios.get(`${API_BASE}/suggest_subnet`).then(res => {
			if (res.data && res.data.subnet && !target) setTarget(res.data.subnet);
		}).catch(() => {});
		
		// poll for devices and active scan status
		const deviceInterval = setInterval(fetchDevices, 3000);
		const assetInterval = setInterval(fetchAssets, 3000);
		const assetGroupInterval = setInterval(fetchAssetGroups, 3000);
		const labelInterval = setInterval(fetchLabels, 3000);
		const scanInterval = setInterval(() => {
			axios.get(`${API_BASE}/scan/active`).then(res => {
				setActiveScan(res.data);
			}).catch(() => setActiveScan(null));
		}, 3000);

		return () => {
			clearInterval(deviceInterval);
			clearInterval(assetInterval);
			clearInterval(assetGroupInterval);
			clearInterval(labelInterval);
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

	const handleSelectAllDevices = (deviceIds) => {
		const allSelected = deviceIds.every(id => selectedDevices.includes(id));
		if (allSelected) {
			setSelectedDevices(selectedDevices.filter(id => !deviceIds.includes(id)));
		} else {
			setSelectedDevices([...new Set([...selectedDevices, ...deviceIds])]);
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

	const createAssetsFromDevices = async () => {
		const devicesToConvert = devices.filter((d) => selectedDevices.includes(d.id));
		if (devicesToConvert.length === 0) return;

		for (const device of devicesToConvert) {
			const existingAsset = assets.find(a => a.name === device.ip);
			if (existingAsset) {
				setStatusMsg(`Asset for ${device.ip} already exists.`);
				continue;
			}

			const assetData = {
				name: device.ip,
				mac: device.mac,
				ips: [{ ip: device.ip }],
				// You can add more fields here as needed
			};

			try {
				await axios.post(`${API_BASE}/assets`, assetData);
				setStatusMsg(`Asset created for ${device.ip}.`);
			} catch (error) {
				setStatusMsg(`Failed to create asset for ${device.ip}.`);
			}
		}

		setSelectedDevices([]);
		fetchAssets();
	};

	const handleCreateAsset = async (assetData) => {
		try {
			await axios.post(`${API_BASE}/assets`, assetData);
			fetchAssets();
		} catch (error) {
			setStatusMsg("Failed to create asset.");
		}
	};

	const handleSelectAsset = (assetId) => {
		setSelectedAssets((prev) =>
			prev.includes(assetId)
				? prev.filter((id) => id !== assetId)
				: [...prev, assetId]
		);
	};

	const handleSelectAllAssets = (assetIds) => {
		const allSelected = assetIds.every(id => selectedAssets.includes(id));
		if (allSelected) {
			setSelectedAssets(selectedAssets.filter(id => !assetIds.includes(id)));
		} else {
			setSelectedAssets([...new Set([...selectedAssets, ...assetIds])]);
		}
	};

	const handleDeleteSelectedAssets = async () => {
		if (window.confirm(`Are you sure you want to delete ${selectedAssets.length} assets?`)) {
			try {
				await Promise.all(
					selectedAssets.map((id) => axios.delete(`${API_BASE}/assets/${id}`))
				);
				fetchAssets();
				setSelectedAssets([]);
			} catch (error) {
				setStatusMsg("Failed to delete assets.");
			}
		}
	};

	const handleCreateAssetGroup = async () => {
		const assetsToGroup = assets.filter((a) => selectedAssets.includes(a.id));
		if (assetsToGroup.length === 0) return;

		const name = prompt("Enter a name for the new asset group:");
		if (!name) return;

		const existingGroup = assetGroups.find(ag => ag.name === name);
		if (existingGroup) {
			setStatusMsg(`Asset group "${name}" already exists.`);
			return;
		}

		const assetGroupData = {
			name,
			asset_ids: assetsToGroup.map((a) => a.id),
		};

		try {
			await axios.post(`${API_BASE}/asset_groups`, assetGroupData);
			setStatusMsg("Asset group created successfully.");
			setSelectedAssets([]);
			fetchAssetGroups();
		} catch (error) {
			setStatusMsg("Failed to create asset group.");
		}
	};

	const handleSelectAssetGroup = (assetGroupId) => {
		setSelectedAssetGroups((prev) =>
			prev.includes(assetGroupId)
				? prev.filter((id) => id !== assetGroupId)
				: [...prev, assetGroupId]
		);
	};

	const handleSelectAllAssetGroups = (assetGroupIds) => {
		const allSelected = assetGroupIds.every(id => selectedAssetGroups.includes(id));
		if (allSelected) {
			setSelectedAssetGroups(selectedAssetGroups.filter(id => !assetGroupIds.includes(id)));
		} else {
			setSelectedAssetGroups([...new Set([...selectedAssetGroups, ...assetGroupIds])]);
		}
	};

	const handleDeleteSelectedAssetGroups = async () => {
		if (window.confirm(`Are you sure you want to delete ${selectedAssetGroups.length} asset groups?`)) {
			try {
				await Promise.all(
					selectedAssetGroups.map((id) => axios.delete(`${API_BASE}/asset_groups/${id}`))
				);
				fetchAssetGroups();
				setSelectedAssetGroups([]);
			} catch (error) {
				setStatusMsg("Failed to delete asset groups.");
			}
		}
	};

	const handleUpdateAsset = async (assetId, updatedData) => {
		try {
			const res = await axios.put(`${API_BASE}/assets/${assetId}`, updatedData);
			const updatedAsset = res.data;
			setAssets(assets.map(asset => asset.id === assetId ? updatedAsset : asset));
			if (selectedAsset && selectedAsset.id === assetId) {
				setSelectedAsset(updatedAsset);
			}
		} catch (error) {
			setStatusMsg("Failed to update asset.");
		}
	};

	const handleUpdateAssetGroup = async (assetGroupId, updatedData) => {
		try {
			const res = await axios.put(`${API_BASE}/asset_groups/${assetGroupId}`, updatedData);
			const updatedGroup = res.data;
			setAssetGroups(assetGroups.map(group => group.id === assetGroupId ? updatedGroup : group));
			if (selectedAssetGroup && selectedAssetGroup.id === assetGroupId) {
				setSelectedAssetGroup(updatedGroup);
			}
		} catch (error) {
			setStatusMsg("Failed to update asset group.");
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

	const deleteScan = React.useCallback(async (scanId) => {
		if (window.confirm("Are you sure you want to delete this scan record?")) {
			try {
				await axios.delete(`${API_BASE}/scans/${scanId}`);
				// We need to force a re-fetch of the history for the selected device
				// A simple way is to "deselect" and "reselect" the device
				const currentDevice = selectedDevice;
				setSelectedDevice(null);
				setTimeout(() => setSelectedDevice(currentDevice), 0);
			} catch (error) {
				setStatusMsg("Failed to delete scan record.");
			}
		}
	}, [selectedDevice]);

	const cancelScan = async () => {
		if (!activeScan) return;
		try {
			await axios.post(`${API_BASE}/scan/${activeScan.id}/cancel`);
			setStatusMsg("Scan cancelled.");
			setActiveScan(null);
		} catch (error) {
			setStatusMsg("Failed to cancel scan.");
		}
	};

	const navLinkClasses = "block px-4 py-2 rounded-md text-sm font-medium transition-colors";
	const activeLinkClasses = "bg-blue-600 text-white";
	const inactiveLinkClasses = "text-slate-400 hover:bg-slate-800 hover:text-white";

	return (
		<div className="flex h-screen bg-slate-900 text-slate-300">
			<div className="flex flex-col w-64 bg-slate-900/70 border-r border-slate-800">
				<div className="flex items-center justify-center h-16 border-b border-slate-800">
					<h1 className="text-2xl font-bold text-white">DiscoverIT</h1>
				</div>
				<nav className="flex-grow p-4 space-y-2">
					<a href="#" onClick={() => setPage("scans")} className={`${navLinkClasses} ${page === "scans" ? activeLinkClasses : inactiveLinkClasses}`}>Scans</a>
					<a href="#" onClick={() => setPage("scan_log")} className={`${navLinkClasses} ${page === "scan_log" ? activeLinkClasses : inactiveLinkClasses}`}>Scans Log</a>
					<a href="#" onClick={() => setPage("assets")} className={`${navLinkClasses} ${page === "assets" ? activeLinkClasses : inactiveLinkClasses}`}>Assets</a>
					<a href="#" onClick={() => setPage("asset_groups")} className={`${navLinkClasses} ${page === "asset_groups" ? activeLinkClasses : inactiveLinkClasses}`}>Asset Groups</a>
					<a href="#" onClick={() => setPage("operations")} className={`${navLinkClasses} ${page === "operations" ? activeLinkClasses : inactiveLinkClasses}`}>Operations</a>
					<a href="#" onClick={() => setPage("operations_tracker")} className={`${navLinkClasses} ${page === "operations_tracker" ? activeLinkClasses : inactiveLinkClasses}`}>Operations Tracker</a>
				</nav>
			</div>
			<div className="flex-grow p-6 overflow-y-auto">
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
						handleCreateAsset={createAssetsFromDevices}
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
						assets={assets.filter(a => selectedLabels.length === 0 || a.labels.some(l => selectedLabels.map(sl => sl.id).includes(l.id)))}
						selectedAsset={selectedAsset}
						setSelectedAsset={setSelectedAsset}
						deleteAsset={deleteAsset}
						onUpdate={handleUpdateAsset}
						setShowAssetManager={setShowAssetManager}
						selectedAssets={selectedAssets}
						onSelectAsset={handleSelectAsset}
						onSelectAllAssets={handleSelectAllAssets}
						onDeleteSelectedAssets={handleDeleteSelectedAssets}
						onCreateAssetGroup={handleCreateAssetGroup}
						setShowOperationModal={setShowOperationModal}
						allLabels={allLabels}
						selectedLabels={selectedLabels}
						setSelectedLabels={setSelectedLabels}
					/>
				)}
				{page === "asset_groups" && (
					<AssetGroups
						assetGroups={assetGroups.filter(ag => selectedLabels.length === 0 || ag.labels.some(l => selectedLabels.map(sl => sl.id).includes(l.id)))}
						selectedAssetGroup={selectedAssetGroup}
						setSelectedAssetGroup={setSelectedAssetGroup}
						deleteAssetGroup={deleteAssetGroup}
						updateAssetGroup={handleUpdateAssetGroup}
						setEditingAssetGroup={setEditingAssetGroup}
						setShowAssetGroupManager={setShowAssetGroupManager}
						selectedAssetGroups={selectedAssetGroups}
						onSelectAssetGroup={handleSelectAssetGroup}
						onSelectAllAssetGroups={handleSelectAllAssetGroups}
						onDeleteSelectedAssetGroups={handleDeleteSelectedAssetGroups}
						setShowOperationModal={setShowOperationModal}
						allLabels={allLabels}
						selectedLabels={selectedLabels}
						setSelectedLabels={setSelectedLabels}
					/>
				)}
				{page === "operations" && <Operations />}
				{page === "operations_tracker" && <OperationsTracker />}
				{page === "scan_log" && <ScanLog />}
				{showAssetManager && (
					<AssetManager
						assets={selectedAssets.length > 0 ? assets.filter(a => selectedAssets.includes(a.id)) : []}
						onUpdate={handleUpdateAsset}
						onDelete={deleteAsset}
						onCreate={handleCreateAsset}
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
				{showOperationModal && (
					<RunOperationModal
						assets={assets.filter(a => selectedAssets.includes(a.id))}
						assetGroups={assetGroups.filter(ag => selectedAssetGroups.includes(ag.id))}
						onClose={() => setShowOperationModal(false)}
					/>
				)}
			</div>
		</div>
	);
}

export default App;

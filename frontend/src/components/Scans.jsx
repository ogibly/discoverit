import React from "react";
import DeviceList from "./DeviceList";
import DeviceDetail from "./DeviceDetail";

export default function Scans({
	devices,
	selectedDevice,
	setSelectedDevice,
	deleteDevice,
	selectedDevices,
	handleSelectDevice,
	handleSelectAllDevices,
	handleDeleteSelected,
	handleCreateAsset,
	triggerScan,
	activeScan,
	cancelScan,
	target,
	setTarget,
	statusMsg,
	deleteScan,
}) {
	return (
		<div className="flex flex-col h-full">
			<div className="header">
				<h2>Scans</h2>
			</div>
			<div className="card mb-4 shrink-0">
				<div className="flex items-center gap-2">
					<input
						value={target}
						onChange={(e) => setTarget(e.target.value)}
						className="border rounded px-2 py-1 scan-input"
						placeholder="192.168.1.0/24 or 192.168.1.1-50"
					/>
					<button
						onClick={() => triggerScan("quick")}
						disabled={!!activeScan || (!target.trim() && selectedDevices.length === 0)}
						className="btn btn-secondary scan-btn"
					>
						{activeScan ? "Scanning..." : "Quick Scan"}
					</button>
					<button
						onClick={() => triggerScan("comprehensive")}
						disabled={!!activeScan || (!target.trim() && selectedDevices.length === 0)}
						className="btn btn-primary scan-btn"
					>
						{activeScan ? "Scanning..." : "Comprehensive Scan"}
					</button>
					{activeScan && (
						<button onClick={cancelScan} className="btn btn-danger scan-btn">
							Cancel Scan
						</button>
					)}
				</div>
				{(activeScan || statusMsg) && (
					<div className="mt-2 text-sm text-gray-400">
						{activeScan ? (
							<span>{`Scanning ${activeScan.target} (${activeScan.scan_type})...`}</span>
						) : (
							<span>{statusMsg}</span>
						)}
					</div>
				)}
			</div>
			<div className="flex gap-6 flex-grow min-h-0">
				<div className="w-2/3">
					<div className="card h-full">
						<DeviceList
							devices={devices}
							selectedDevice={selectedDevice}
							onSelect={setSelectedDevice}
							onDelete={deleteDevice}
							selectedDevices={selectedDevices}
							onSelectDevice={handleSelectDevice}
							onSelectAll={handleSelectAllDevices}
							onDeleteSelected={handleDeleteSelected}
							onCreateAsset={handleCreateAsset}
						/>
					</div>
				</div>
				<div className="w-1/3">
					<div className="card">
						{selectedDevice ? (
							<DeviceDetail
								device={selectedDevice}
								onDeleteScan={deleteScan}
							/>
						) : (
							<p className="text-gray-400">
								Select a device to see details.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

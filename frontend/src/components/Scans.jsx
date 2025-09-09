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
		<div>
			<div className="header">
				<h2>Scans</h2>
				<div className="flex items-end gap-2">
					<input
						value={target}
						onChange={(e) => setTarget(e.target.value)}
						className="border rounded px-2 py-1"
						placeholder="192.168.1.0/24 or 192.168.1.1-50"
					/>
					<button
						onClick={() => triggerScan("quick")}
						disabled={!!activeScan}
						className="btn btn-secondary"
					>
						{activeScan ? "Scanning..." : "Quick Scan"}
					</button>
					<button
						onClick={() => triggerScan("comprehensive")}
						disabled={!!activeScan}
						className="btn btn-primary"
					>
						{activeScan ? "Scanning..." : "Comprehensive Scan"}
					</button>
					{activeScan && (
						<button onClick={cancelScan} className="btn btn-danger">
							Cancel Scan
						</button>
					)}
				</div>
			</div>
			{(activeScan || statusMsg) && (
				<div className="mb-2 text-sm text-gray-400">
					{activeScan ? (
						<span>{`Scanning ${activeScan.target} (${activeScan.scan_type})...`}</span>
					) : (
						<span>{statusMsg}</span>
					)}
				</div>
			)}
			<div className="grid grid-cols-3 gap-6">
				<div className="col-span-1">
					<div className="card">
						<DeviceList
							devices={devices}
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
				<div className="col-span-2">
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

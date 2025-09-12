import React from "react";
import DeviceList from "./DeviceList";
import DeviceDetail from "./DeviceDetail";
import ActionsDropdown from "./ActionsDropdown";

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
	const actions = [
		{
			label: "Create Asset",
			onClick: handleCreateAsset,
			disabled: selectedDevices.length === 0,
		},
		{
			label: "Delete",
			onClick: handleDeleteSelected,
			disabled: selectedDevices.length === 0,
		},
	];

	return (
		<div className="flex flex-col h-full text-slate-300">
			<div className="mb-6">
				<h2 className="text-3xl font-bold text-white">Scans</h2>
			</div>
			<div className="flex gap-6 flex-grow min-h-0">
				<div className="w-2/3 flex flex-col gap-6">
					<div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
						<div className="flex items-center gap-4">
							<input
								value={target}
								onChange={(e) => setTarget(e.target.value)}
								className="flex-grow bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="192.168.1.0/24 or 192.168.1.1-50"
							/>
							<button
								onClick={() => triggerScan("quick")}
								disabled={!!activeScan || (!target.trim() && selectedDevices.length === 0)}
								className="px-4 py-2 text-sm font-semibold text-white bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{activeScan ? "Scanning..." : "Quick Scan"}
							</button>
							<button
								onClick={() => triggerScan("comprehensive")}
								disabled={!!activeScan || (!target.trim() && selectedDevices.length === 0)}
								className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{activeScan ? "Scanning..." : "Comprehensive Scan"}
							</button>
							{activeScan && (
								<button onClick={cancelScan} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500">
									Cancel Scan
								</button>
							)}
						</div>
						{(activeScan || statusMsg) && (
							<div className="mt-4">
								{activeScan ? (
									<div className="space-y-2">
										<div className="w-full bg-slate-700 rounded-full h-2.5">
											<div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${activeScan.progress || 0}%` }}></div>
										</div>
										<div className="flex justify-between text-xs text-slate-400">
											<span>{activeScan.current_ip ? `Scanning: ${activeScan.current_ip}` : 'Initializing...'}</span>
											<span>{`${activeScan.progress || 0}% (${activeScan.total_ips ? Math.round((activeScan.progress || 0) / 100 * activeScan.total_ips) : 0}/${activeScan.total_ips || 0})`}</span>
										</div>
									</div>
								) : (
									<div className="text-sm text-slate-400">
										<span>{statusMsg}</span>
									</div>
								)}
							</div>
						)}
					</div>
					<div className="flex-grow flex flex-col">
						<div className="flex justify-start mb-4">
							<ActionsDropdown actions={actions} />
						</div>
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
					<div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 h-full">
						{selectedDevice ? (
							<DeviceDetail
								device={selectedDevice}
								onDeleteScan={deleteScan}
							/>
						) : (
							<div className="flex items-center justify-center h-full">
								<p className="text-slate-500">
									Select a device to see details.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

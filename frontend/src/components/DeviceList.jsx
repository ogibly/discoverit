import React from "react";

export default function DeviceList({
	devices,
	onSelect,
	onDelete,
	selectedDevices,
	onSelectDevice,
	onDeleteSelected,
	onCreateAsset,
	onSelectAll,
}) {
	const allSelected = devices.length > 0 && selectedDevices.length === devices.length;

	return (
		<div className="bg-white shadow rounded p-4">
			<div className="flex justify-between items-center mb-2">
				<div className="flex items-center">
					<input
						type="checkbox"
						checked={allSelected}
						onChange={onSelectAll}
						className="mr-2"
					/>
					<h2 className="text-xl font-bold">Devices</h2>
				</div>
				<div>
					<button
						onClick={onDeleteSelected}
						disabled={selectedDevices.length === 0}
						className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:bg-gray-400"
					>
						Delete
					</button>
					<button
						onClick={onCreateAsset}
						disabled={selectedDevices.length === 0}
						className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:bg-gray-400"
					>
						Create Asset
					</button>
				</div>
			</div>
			<ul className="divide-y divide-gray-200">
				{devices.map((device) => (
					<li
						key={device.id}
						className="p-2 hover:bg-gray-100 rounded flex justify-between items-center"
					>
						<div className="flex items-center flex-grow">
							<input
								type="checkbox"
								checked={selectedDevices.includes(device.id)}
								onChange={() => onSelectDevice(device.id)}
								className="mr-2"
							/>
							<div onClick={() => onSelect(device)} className="cursor-pointer flex-grow">
								<p className="font-medium">{device.ip}</p>
								{device.mac && <p className="text-sm text-gray-500">{device.mac}</p>}
							</div>
						</div>
						<button
							onClick={() => onDelete(device.id)}
							className="ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
						>
							Delete
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

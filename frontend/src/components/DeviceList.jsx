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
		<div>
			<div className="flex justify-between items-center mb-4">
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
						className="btn btn-danger"
					>
						Delete
					</button>
					<button
						onClick={onCreateAsset}
						disabled={selectedDevices.length === 0}
						className="btn btn-primary ml-2"
					>
						Create Asset
					</button>
				</div>
			</div>
			<table>
				<thead>
					<tr>
						<th></th>
						<th>IP</th>
						<th>MAC</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{devices.map((device) => (
						<tr key={device.id}>
							<td>
								<input
									type="checkbox"
									checked={selectedDevices.includes(device.id)}
									onChange={() => onSelectDevice(device.id)}
								/>
							</td>
							<td onClick={() => onSelect(device)} className="cursor-pointer">{device.ip}</td>
							<td>{device.mac}</td>
							<td>
								<button
									onClick={() => onDelete(device.id)}
									className="btn btn-danger"
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

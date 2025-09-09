import React, { useState } from "react";

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
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const totalPages = Math.ceil(devices.length / itemsPerPage);
	const paginatedDevices = devices.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const allSelected = paginatedDevices.length > 0 && paginatedDevices.every(d => selectedDevices.includes(d.id));

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center">
					<input
						type="checkbox"
						checked={allSelected}
						onChange={() => onSelectAll(paginatedDevices.map(d => d.id))}
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
					{paginatedDevices.map((device) => (
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
			<div className="flex justify-center mt-4">
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
					<button
						key={page}
						onClick={() => setCurrentPage(page)}
						className={`px-3 py-1 mx-1 rounded ${
							currentPage === page ? "bg-blue-500 text-white" : "bg-gray-700"
						}`}
					>
						{page}
					</button>
				))}
			</div>
		</div>
	);
}

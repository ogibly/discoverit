import React, { useState } from "react";

export default function DeviceList({
	devices,
	selectedDevice,
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
				<h2 className="text-xl font-bold">Devices</h2>
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
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr>
							<th>
								<input
									type="checkbox"
									checked={allSelected}
									onChange={() => onSelectAll(paginatedDevices.map(d => d.id))}
								/>
							</th>
							<th>IP</th>
							<th>MAC</th>
							<th></th>
						</tr>
					</thead>
				</table>
			</div>
			<div className="overflow-y-auto" style={{ height: "300px" }}>
				<table className="w-full">
					<tbody>
						{paginatedDevices.map((device) => (
							<tr
								key={device.id}
								className={selectedDevice && selectedDevice.id === device.id ? "selected" : ""}
							>
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
			<div className="pagination">
				<button
					onClick={() => setCurrentPage(currentPage - 1)}
					disabled={currentPage === 1}
				>
					Previous
				</button>
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
					<button
						key={page}
						onClick={() => setCurrentPage(page)}
						className={currentPage === page ? "active" : ""}
					>
						{page}
					</button>
				))}
				<button
					onClick={() => setCurrentPage(currentPage + 1)}
					disabled={currentPage === totalPages}
				>
					Next
				</button>
			</div>
		</div>
	);
}

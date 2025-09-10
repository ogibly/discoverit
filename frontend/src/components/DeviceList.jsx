import React, { useState, useEffect, useRef } from "react";

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
	const [itemsPerPage, setItemsPerPage] = useState(8);
	const tableBodyRef = useRef(null);

	useEffect(() => {
		if (tableBodyRef.current) {
			const rowHeight = 40; // Approximate height of a row
			const availableHeight = tableBodyRef.current.clientHeight;
			const newItemsPerPage = Math.floor(availableHeight / rowHeight);
			if (newItemsPerPage > 0) {
				setItemsPerPage(newItemsPerPage);
			}
		}
	}, [devices]);

	const sortedDevices = [...devices].sort((a, b) => a.ip.localeCompare(b.ip));
	const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
	const paginatedDevices = sortedDevices.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const allSelected = paginatedDevices.length > 0 && paginatedDevices.every(d => selectedDevices.includes(d.id));

	return (
		<div className="flex flex-col h-full">
			<div className="scrollable-list">
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
					<tbody ref={tableBodyRef}>
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
											className="btn btn-danger btn-sm"
										>
											Delete
										</button>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
			<div className="pagination shrink-0">
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

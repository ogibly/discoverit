import React, { useState, useEffect, useRef } from "react";
import ActionsDropdown from "./ActionsDropdown";

export default React.memo(function DeviceList({
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
	const [itemsPerPage, setItemsPerPage] = useState(10); // Set a fixed itemsPerPage

	const sortedDevices = [...devices].sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
	const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
	const paginatedDevices = sortedDevices.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const allSelected = paginatedDevices.length > 0 && paginatedDevices.every(d => selectedDevices.includes(d.id));

	return (
		<div className="flex flex-col h-full flex-grow">
			{/* Converted to TailwindCSS */}
			<div className="flex flex-col flex-grow overflow-hidden border border-slate-800 rounded-lg bg-slate-900/50">
				<div className="flex-grow overflow-y-auto">
					<table className="w-full text-sm text-left text-slate-300">
						<thead className="text-xs text-slate-400 uppercase bg-slate-800">
							<tr>
								<th scope="col" className="p-4">
									<input
										type="checkbox"
										className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
										checked={allSelected}
										onChange={() => onSelectAll(paginatedDevices.map(d => d.id))}
									/>
								</th>
								<th scope="col" className="px-6 py-3">IP</th>
								<th scope="col" className="px-6 py-3">MAC</th>
								<th scope="col" className="px-6 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{paginatedDevices.map((device) => (
								<tr
									key={device.id}
									className={`border-b border-slate-800 transition-colors duration-150 ${selectedDevice && selectedDevice.id === device.id ? "bg-blue-600/20 hover:bg-blue-600/30" : "hover:bg-slate-800/50"}`}
								>
									<td className="w-4 p-4">
										<input
											type="checkbox"
											className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
											checked={selectedDevices.includes(device.id)}
											onChange={() => onSelectDevice(device.id)}
										/>
									</td>
									<td onClick={() => onSelect(device)} className="px-6 py-4 cursor-pointer">{device.ip}</td>
									<td className="px-6 py-4">{device.mac}</td>
									<td className="px-6 py-4">
										<button
											onClick={() => onDelete(device.id)}
											className="font-medium text-red-500 hover:underline"
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="flex items-center justify-center p-4 border-t border-slate-800">
					<button
						onClick={() => setCurrentPage(currentPage - 1)}
						disabled={currentPage === 1}
						className="px-3 py-1 text-sm font-medium text-slate-300 bg-slate-800 rounded-l-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					<div className="flex items-center mx-2 overflow-x-auto">
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								onClick={() => setCurrentPage(page)}
								className={`px-3 py-1 mx-1 text-sm font-medium rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
							>
								{page}
							</button>
						))}
					</div>
					<button
						onClick={() => setCurrentPage(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="px-3 py-1 text-sm font-medium text-slate-300 bg-slate-800 rounded-r-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
});

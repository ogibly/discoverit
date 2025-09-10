import React, { useState, useEffect, useRef } from "react";
import ActionsDropdown from "./ActionsDropdown";

export default function AssetList({
	assets,
	selectedAsset,
	onSelect,
	onDelete,
	selectedAssets,
	onSelectAsset,
	onDeleteSelected,
	onCreateAssetGroup,
	onSelectAll,
}) {
	const [filter, setFilter] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	const filteredAssets = assets.filter((asset) => {
		if (!filter) return true;
		if (!asset.labels) return false;
		return asset.labels.some((label) =>
			label.name.toLowerCase().includes(filter.toLowerCase())
		);
	});

	const sortedAssets = [...filteredAssets].sort((a, b) => a.name.localeCompare(b.name));
	const totalPages = Math.ceil(sortedAssets.length / itemsPerPage);
	const paginatedAssets = sortedAssets.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const allSelected = paginatedAssets.length > 0 && paginatedAssets.every(a => selectedAssets.includes(a.id));

	return (
		<div className="flex flex-col h-full">
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
										onChange={() => onSelectAll(paginatedAssets.map(a => a.id))}
									/>
								</th>
								<th scope="col" className="px-6 py-3">Name</th>
								<th scope="col" className="px-6 py-3">MAC</th>
								<th scope="col" className="px-6 py-3">Labels</th>
								<th scope="col" className="px-6 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{paginatedAssets.map((asset) => (
								<tr
									key={asset.id}
									className={`border-b border-slate-800 transition-colors duration-150 ${selectedAsset && selectedAsset.id === asset.id ? "bg-blue-600/20 hover:bg-blue-600/30" : "hover:bg-slate-800/50"}`}
								>
									<td className="w-4 p-4">
										<input
											type="checkbox"
											className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
											checked={selectedAssets.includes(asset.id)}
											onChange={() => onSelectAsset(asset.id)}
										/>
									</td>
									<td onClick={() => onSelect(asset)} className="px-6 py-4 cursor-pointer">{asset.name}</td>
									<td className="px-6 py-4">{asset.mac}</td>
									<td className="px-6 py-4">
										{asset.labels && asset.labels.map(label => (
											<span key={label.id} className="inline-block bg-slate-700 text-slate-200 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
												{label.name}
											</span>
										))}
									</td>
									<td className="px-6 py-4">
										<button
											onClick={() => onDelete(asset.id)}
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
					<div className="flex items-center mx-2">
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
}

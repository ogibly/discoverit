import React, { useState } from "react";

export default function AssetList({
	assets,
	onSelect,
	onDelete,
	selectedAssets,
	onSelectAsset,
	onDeleteSelected,
	onSelectAll,
}) {
	const [filter, setFilter] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const filteredAssets = assets.filter((asset) => {
		if (!filter) return true;
		if (!asset.labels) return false;
		const labels = JSON.parse(asset.labels);
		return labels.some((label) =>
			label.toLowerCase().includes(filter.toLowerCase())
		);
	});

	const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
	const paginatedAssets = filteredAssets.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const allSelected = paginatedAssets.length > 0 && paginatedAssets.every(a => selectedAssets.includes(a.id));

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<input
					type="text"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Filter by label"
					className="mb-4"
				/>
				<button
					onClick={onDeleteSelected}
					disabled={selectedAssets.length === 0}
					className="btn btn-danger"
				>
					Delete Selected
				</button>
			</div>
			<div className="table-container">
				<table>
					<thead>
						<tr>
							<th>
								<input
									type="checkbox"
									checked={allSelected}
									onChange={() => onSelectAll(paginatedAssets.map(a => a.id))}
								/>
							</th>
							<th>Asset Details</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{paginatedAssets.map((asset) => (
							<tr key={asset.id}>
								<td>
									<input
										type="checkbox"
										checked={selectedAssets.includes(asset.id)}
										onChange={() => onSelectAsset(asset.id)}
									/>
								</td>
								<td onClick={() => onSelect(asset)} className="cursor-pointer">
									{asset.name} ({asset.mac})
								</td>
								<td>
									<button
										onClick={() => onDelete(asset.id)}
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

import React, { useState, useEffect, useRef } from "react";

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
	}, [assets]);

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
		<div className="flex flex-col h-full">
			<div className="flex justify-between items-center mb-4">
				<div>
					<button
						onClick={onDeleteSelected}
						disabled={selectedAssets.length === 0}
						className="btn btn-danger"
					>
						Delete
					</button>
					<button
						onClick={onCreateAssetGroup}
						disabled={selectedAssets.length === 0}
						className="btn btn-primary ml-2"
					>
						Create Asset Group
					</button>
				</div>
			</div>
			<input
				type="text"
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				placeholder="Filter by label"
				className="mb-4"
			/>
			<div className="overflow-auto flex-grow">
				<table className="w-full">
					<thead>
						<tr>
							<th>
								<input
									type="checkbox"
									checked={allSelected}
									onChange={() => onSelectAll(paginatedAssets.map(a => a.id))}
				/>
			</th>
							<th>Name</th>
							<th>MAC</th>
							<th></th>
						</tr>
					</thead>
					<tbody ref={tableBodyRef}>
						{paginatedAssets.map((asset) => (
							<tr
								key={asset.id}
								className={selectedAsset && selectedAsset.id === asset.id ? "selected" : ""}
							>
								<td>
									<input
										type="checkbox"
											checked={selectedAssets.includes(asset.id)}
											onChange={() => onSelectAsset(asset.id)}
										/>
									</td>
									<td onClick={() => onSelect(asset)} className="cursor-pointer">{asset.name}</td>
									<td>{asset.mac}</td>
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

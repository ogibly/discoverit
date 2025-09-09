import React, { useState, useEffect, useRef } from "react";

export default function AssetGroupList({
	assetGroups,
	selectedAssetGroup,
	onSelect,
	onDelete,
	selectedAssetGroups,
	onSelectAssetGroup,
	onDeleteSelected,
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
	}, [assetGroups]);

	const filteredAssetGroups = assetGroups.filter((group) => {
		if (!filter) return true;
		if (!group.labels) return false;
		const labels = JSON.parse(group.labels);
		return labels.some((label) =>
			label.toLowerCase().includes(filter.toLowerCase())
		);
	});

	const totalPages = Math.ceil(filteredAssetGroups.length / itemsPerPage);
	const paginatedAssetGroups = filteredAssetGroups.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const allSelected = paginatedAssetGroups.length > 0 && paginatedAssetGroups.every(ag => selectedAssetGroups.includes(ag.id));

	return (
		<div className="flex flex-col h-full">
			<div className="flex justify-between items-center mb-4">
				<div>
					<button
						onClick={onDeleteSelected}
						disabled={selectedAssetGroups.length === 0}
						className="btn btn-danger"
					>
						Delete
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
									onChange={() => onSelectAll(paginatedAssetGroups.map(ag => ag.id))}
				/>
							</th>
							<th>Name</th>
							<th></th>
						</tr>
					</thead>
					<tbody ref={tableBodyRef}>
						{paginatedAssetGroups.map((group) => (
							<tr
								key={group.id}
								className={selectedAssetGroup && selectedAssetGroup.id === group.id ? "selected" : ""}
							>
								<td>
									<input
										type="checkbox"
											checked={selectedAssetGroups.includes(group.id)}
											onChange={() => onSelectAssetGroup(group.id)}
										/>
									</td>
									<td onClick={() => onSelect(group)} className="cursor-pointer">{group.name}</td>
									<td>
										<button
											onClick={() => onDelete(group.id)}
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

import React, { useState } from "react";

export default function AssetGroupList({
	assetGroups,
	onSelect,
	onDelete,
	selectedAssetGroups,
	onSelectAssetGroup,
	onDeleteSelected,
	onSelectAll,
}) {
	const [filter, setFilter] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

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
					disabled={selectedAssetGroups.length === 0}
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
									onChange={() => onSelectAll(paginatedAssetGroups.map(ag => ag.id))}
								/>
							</th>
							<th>Name</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{paginatedAssetGroups.map((group) => (
							<tr key={group.id}>
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

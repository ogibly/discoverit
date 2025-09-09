import React, { useState } from "react";

export default function AssetGroupList({ assetGroups, onSelect, onDelete }) {
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

	return (
		<div>
			<input
				type="text"
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				placeholder="Filter by label"
				className="mb-4"
			/>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{paginatedAssetGroups.map((group) => (
						<tr key={group.id}>
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

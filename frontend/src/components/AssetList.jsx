import React, { useState } from "react";

export default function AssetList({ assets, onSelect, onDelete }) {
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
						<th>MAC</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{paginatedAssets.map((asset) => (
						<tr key={asset.id}>
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

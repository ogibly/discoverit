import React, { useState } from "react";

export default function AssetList({ assets, onSelect, onDelete }) {
	const [filter, setFilter] = useState("");

	const filteredAssets = assets.filter((asset) => {
		if (!filter) return true;
		if (!asset.labels) return false;
		const labels = JSON.parse(asset.labels);
		return labels.some((label) =>
			label.toLowerCase().includes(filter.toLowerCase())
		);
	});

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
					{filteredAssets.map((asset) => (
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
		</div>
	);
}

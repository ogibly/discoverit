import React, { useState } from "react";

export default function AssetGroupList({ assetGroups, onSelect, onDelete }) {
	const [filter, setFilter] = useState("");

	const filteredAssetGroups = assetGroups.filter((group) => {
		if (!filter) return true;
		if (!group.labels) return false;
		const labels = JSON.parse(group.labels);
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
						<th></th>
					</tr>
				</thead>
				<tbody>
					{filteredAssetGroups.map((group) => (
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
		</div>
	);
}

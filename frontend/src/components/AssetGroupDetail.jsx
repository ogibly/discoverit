import React from "react";

export default function AssetGroupDetail({ assetGroup }) {
	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold">{assetGroup.name}</h2>
			</div>
			<div className="mt-4">
				<h3 className="text-xl font-bold mb-2">Labels:</h3>
				<p>{assetGroup.labels ? JSON.parse(assetGroup.labels).join(", ") : ""}</p>
			</div>
			<div className="mt-4">
				<h3 className="text-xl font-bold mb-2">Assets</h3>
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>MAC</th>
						</tr>
					</thead>
					<tbody>
						{assetGroup.assets.map((asset) => (
							<tr key={asset.id}>
								<td>{asset.name}</td>
								<td>{asset.mac}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

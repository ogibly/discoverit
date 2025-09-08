import React from "react";

export default function AssetGroupDetail({ assetGroup }) {
	return (
		<div className="bg-white shadow rounded p-4">
			<h2 className="text-xl font-bold mb-2">{assetGroup.name}</h2>
			<div>
				<h3 className="text-lg font-semibold mt-4">Assets</h3>
				<ul className="divide-y divide-gray-200">
					{assetGroup.assets.map((asset) => (
						<li key={asset.id} className="p-2">
							<p className="font-medium">{asset.name}</p>
							{asset.mac && <p className="text-sm text-gray-500">{asset.mac}</p>}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
import React, { useState } from "react";

export default function AssetGroupManager({ assets, assetGroup, onSave, onClose }) {
	const [name, setName] = useState(assetGroup ? assetGroup.name : "");
	const [labels, setLabels] = useState(
		assetGroup && assetGroup.labels ? JSON.parse(assetGroup.labels).join(", ") : ""
	);
	const [selectedAssets, setSelectedAssets] = useState(
		assetGroup ? assetGroup.assets.map((a) => a.id) : []
	);

	const handleSave = () => {
		onSave({
			name,
			labels: JSON.stringify(labels.split(",").map(s => s.trim())),
			asset_ids: selectedAssets,
		});
	};

	const toggleAsset = (assetId) => {
		setSelectedAssets((prev) =>
			prev.includes(assetId)
				? prev.filter((id) => id !== assetId)
				: [...prev, assetId]
		);
	};

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
				<div className="mt-3 text-center">
					<h3 className="text-lg leading-6 font-medium text-gray-900">
						{assetGroup ? "Edit Asset Group" : "Create Asset Group"}
					</h3>
					<div className="mt-2 px-7 py-3">
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Group Name"
							className="border rounded px-2 py-1 w-full mb-4"
						/>
						<input
							type="text"
							value={labels}
							onChange={(e) => setLabels(e.target.value)}
							placeholder="Labels (comma-separated)"
							className="border rounded px-2 py-1 w-full mb-4"
						/>
						<h4 className="text-md font-semibold mb-2">Select Assets</h4>
						<ul className="divide-y divide-gray-200 h-48 overflow-y-auto">
							{assets.map((asset) => (
								<li key={asset.id} className="p-2 flex items-center">
									<input
										type="checkbox"
										checked={selectedAssets.includes(asset.id)}
										onChange={() => toggleAsset(asset.id)}
										className="mr-2"
									/>
									<span>{asset.name}</span>
								</li>
							))}
						</ul>
					</div>
					<div className="items-center px-4 py-3">
						<button
							onClick={handleSave}
							className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
						>
							Save
						</button>
						<button
							onClick={onClose}
							className="mt-2 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

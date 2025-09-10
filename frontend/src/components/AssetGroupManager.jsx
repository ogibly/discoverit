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
		<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
			<div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-300">
				<h3 className="text-2xl font-bold text-white mb-6">{assetGroup ? "Edit Asset Group" : "Create Asset Group"}</h3>
				<div className="space-y-4">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Group Name"
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="text"
						value={labels}
						onChange={(e) => setLabels(e.target.value)}
						placeholder="Labels (comma-separated)"
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<div>
						<h4 className="text-lg font-semibold text-white mb-2">Select Assets</h4>
						<ul className="max-h-48 overflow-y-auto border border-slate-700 rounded-md p-4 space-y-2">
							{assets.map((asset) => (
								<li key={asset.id} className="flex items-center">
									<input
										type="checkbox"
										checked={selectedAssets.includes(asset.id)}
										onChange={() => toggleAsset(asset.id)}
										className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
									/>
									<span className="ml-3">{asset.name}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
				<div className="mt-8 flex justify-end gap-4">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
					>
						Close
					</button>
					<button
						onClick={handleSave}
						className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

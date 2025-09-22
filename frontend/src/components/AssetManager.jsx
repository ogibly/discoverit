import React, { useState } from "react";
import LabelManager from "./LabelManager";

export default function AssetManager({ assets, onUpdate, onDelete, onCreate, onClose }) {
	const [newAssetName, setNewAssetName] = useState("");
	const [newAssetLabels, setNewAssetLabels] = useState([]);

	const handleCreate = () => {
		onCreate({
			name: newAssetName,
			labels: newAssetLabels.map(l => l.id),
		});
		setNewAssetName("");
		setNewAssetLabels([]);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
			<div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-300">
				<h3 className="text-2xl font-bold text-white mb-6">Asset Manager</h3>
				<div className="max-h-96 overflow-y-auto pr-4">
					{assets.length > 0 ? (
						<ul className="space-y-6">
							{assets.map((asset) => (
								<li key={asset.id} className="border-b border-slate-800 pb-6">
									<div className="space-y-4">
										<input
											type="text"
											defaultValue={asset.name}
											onBlur={(e) =>
												onUpdate(asset.id, {
													...asset,
													name: e.target.value,
													labels: asset.labels.map((l) => l.id),
												})
											}
											className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
										<LabelManager
											selectedObject={asset}
											onUpdate={(updatedAsset) =>
												onUpdate(asset.id, {
													...updatedAsset,
													labels: updatedAsset.labels.map((l) => l.id),
												})
											}
										/>
										<button
											onClick={() => onDelete(asset.id)}
											className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500"
										>
											Delete
										</button>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="space-y-4">
							<input
								type="text"
								value={newAssetName}
								onChange={(e) => setNewAssetName(e.target.value)}
								placeholder="Asset Name"
								className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<LabelManager
								selectedObject={{ labels: newAssetLabels }}
								onUpdate={(updated) => setNewAssetLabels(updated.labels)}
							/>
							<button
								onClick={handleCreate}
								className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
							>
								Create Asset
							</button>
						</div>
					)}
				</div>
				<div className="mt-8 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

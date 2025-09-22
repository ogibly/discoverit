import React from "react";
import LabelManager from "./LabelManager";

function safeJsonParse(jsonString, fallback) {
	if (typeof jsonString !== 'string' || !jsonString.trim()) {
		return fallback;
	}
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		console.error("Failed to parse JSON:", jsonString, error);
		return fallback;
	}
}

export default function AssetGroupDetail({ assetGroup, onUpdate }) {
	return (
		<div className="text-slate-300">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-white">{assetGroup.name}</h2>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Labels:</h3>
				<LabelManager
					selectedObject={assetGroup}
					onUpdate={(updatedAssetGroup) =>
						onUpdate(assetGroup.id, {
							name: updatedAssetGroup.name,
							asset_ids: updatedAssetGroup.assets.map((a) => a.id),
							labels: updatedAssetGroup.labels.map((l) => l.id),
						})
					}
				/>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Assets</h3>
				<div className="flex flex-col flex-grow overflow-hidden border border-slate-800 rounded-lg bg-slate-900/50">
					<div className="flex-grow overflow-y-auto">
						<table className="w-full text-sm text-left text-slate-300">
							<thead className="text-xs text-slate-400 uppercase bg-slate-800">
								<tr>
									<th scope="col" className="px-6 py-3">Name</th>
									<th scope="col" className="px-6 py-3">MAC</th>
								</tr>
							</thead>
							<tbody>
								{assetGroup.assets.map((asset) => (
									<tr key={asset.id} className="border-b border-slate-800 transition-colors duration-150 hover:bg-slate-800/50">
										<td className="px-6 py-4">{asset.name}</td>
										<td className="px-6 py-4">{asset.mac}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

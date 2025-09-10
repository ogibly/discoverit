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

export default function AssetDetail({ asset, onUpdate }) {
	if (!asset) {
		return <p className="text-gray-400">Select an asset to see details.</p>;
	}

	const scanData = safeJsonParse(asset.scan_data, {});

	return (
		<div className="text-slate-300">
			<h2 className="text-2xl font-bold mb-6 text-white">{asset.name}</h2>
			<div className="space-y-2 text-sm">
				<p><span className="font-semibold text-slate-400">MAC:</span> {asset.mac}</p>
				<p><span className="font-semibold text-slate-400">Owner:</span> {asset.owner}</p>
				<p><span className="font-semibold text-slate-400">Username:</span> {asset.username}</p>
				<p><span className="font-semibold text-slate-400">Password:</span> {asset.password ? "********" : "Not set"}</p>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">IP Addresses:</h3>
				<ul className="list-disc list-inside text-sm">
					{asset.ips.map((ip) => (
						<li key={ip.id}>{ip.ip}</li>
					))}
				</ul>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Labels:</h3>
				<LabelManager
					selectedObject={asset}
					onUpdate={(updatedAsset) =>
						onUpdate(asset.id, {
							...updatedAsset,
							labels: updatedAsset.labels.map((l) => l.id),
						})
					}
				/>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Custom Fields:</h3>
				<p className="text-sm">{asset.custom_fields}</p>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Scan Data:</h3>
				<pre className="bg-slate-900/70 border border-slate-800 p-4 rounded-lg text-xs overflow-x-auto">
					{JSON.stringify(scanData, null, 2)}
				</pre>
			</div>
		</div>
	);
}

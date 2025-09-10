import React from "react";
import LabelManager from "./LabelManager";

export default function AssetDetail({ asset, onUpdate }) {
	if (!asset) {
		return <p className="text-gray-400">Select an asset to see details.</p>;
	}

	const handleAddLabel = (label) => {
		const labels = asset.labels ? JSON.parse(asset.labels) : [];
		onUpdate(asset.id, { labels: JSON.stringify([...labels, label]) });
	};

	const handleRemoveLabel = (label) => {
		const labels = asset.labels ? JSON.parse(asset.labels) : [];
		onUpdate(asset.id, { labels: JSON.stringify(labels.filter(l => l !== label)) });
	};

	return (
		<div>
			<h2 className="text-2xl font-bold mb-4">{asset.name}</h2>
			<p><span className="font-bold">MAC:</span> {asset.mac}</p>
			<p><span className="font-bold">Owner:</span> {asset.owner}</p>
			<p><span className="font-bold">Username:</span> {asset.username}</p>
			<p><span className="font-bold">Password:</span> {asset.password ? "********" : "Not set"}</p>
			<div className="mt-4">
				<h3 className="text-xl font-bold mb-2">IP Addresses:</h3>
				<ul>
					{asset.ips.map((ip) => (
						<li key={ip.id}>{ip.ip}</li>
					))}
				</ul>
			</div>
			<div className="mt-4">
				<h3 className="text-xl font-bold mb-2">Labels:</h3>
				<LabelManager
					labels={asset.labels ? JSON.parse(asset.labels) : []}
					onAdd={handleAddLabel}
					onRemove={handleRemoveLabel}
				/>
			</div>
			<div className="mt-4">
				<h3 className="text-xl font-bold mb-2">Custom Fields:</h3>
				<p>{asset.custom_fields}</p>
			</div>
			<div className="mt-4">
				<h3 className="text-xl font-bold mb-2">Scan Data:</h3>
				<pre className="bg-gray-800 p-4 rounded">
					{JSON.stringify(JSON.parse(asset.scan_data || "{}"), null, 2)}
				</pre>
			</div>
		</div>
	);
}

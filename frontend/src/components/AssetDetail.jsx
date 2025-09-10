import React, { useState } from "react";

export default function AssetDetail({ asset, onUpdate }) {
	if (!asset) {
		return <p className="text-gray-400">Select an asset to see details.</p>;
	}

	const [newLabel, setNewLabel] = useState('');

	const handleAddLabel = () => {
		if (newLabel && !asset.labels.includes(newLabel)) {
			const labels = asset.labels ? JSON.parse(asset.labels) : [];
			onUpdate(asset.id, { labels: JSON.stringify([...labels, newLabel]) });
			setNewLabel('');
		}
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
				<div>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={newLabel}
							onChange={(e) => setNewLabel(e.target.value)}
							placeholder="Add a label"
							className="border rounded px-2 py-1"
						/>
						<button onClick={handleAddLabel} className="btn btn-primary btn-sm">
							Add
						</button>
					</div>
					<div className="mt-2">
						{asset.labels && JSON.parse(asset.labels).map(label => (
							<span key={label} className="inline-block bg-gray-700 text-gray-200 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
								{label}
								<button
									onClick={() => handleRemoveLabel(label)}
									className="ml-2 text-red-500 hover:text-red-700"
								>
									&times;
								</button>
							</span>
						))}
					</div>
				</div>
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

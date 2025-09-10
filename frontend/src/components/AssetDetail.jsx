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
				<div>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={newLabel}
							onChange={(e) => setNewLabel(e.target.value)}
							placeholder="Add a label"
							className="bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
						/>
						<button onClick={handleAddLabel} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500">
							Add
						</button>
					</div>
					<div className="mt-4 flex flex-wrap gap-2">
						{asset.labels && JSON.parse(asset.labels).map(label => (
							<span key={label} className="inline-flex items-center bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full">
								{label}
								<button
									onClick={() => handleRemoveLabel(label)}
									className="ml-2 text-red-500 hover:text-red-400"
								>
									&times;
								</button>
							</span>
						))}
					</div>
				</div>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Custom Fields:</h3>
				<p className="text-sm">{asset.custom_fields}</p>
			</div>
			<div className="mt-6">
				<h3 className="text-lg font-bold mb-2 text-white">Scan Data:</h3>
				<pre className="bg-slate-900/70 border border-slate-800 p-4 rounded-lg text-xs overflow-x-auto">
					{JSON.stringify(JSON.parse(asset.scan_data || "{}"), null, 2)}
				</pre>
			</div>
		</div>
	);
}

import React from "react";

export default function AssetDetail({ asset }) {
	if (!asset) {
		return <p className="text-gray-600">Select an asset to see details.</p>;
	}

	return (
		<div className="bg-white shadow rounded p-4">
			<h2 className="text-xl font-bold mb-2">{asset.name}</h2>
			<p><strong>MAC:</strong> {asset.mac}</p>
			<p><strong>Owner:</strong> {asset.owner}</p>
			<p><strong>Username:</strong> {asset.username}</p>
			<p><strong>Password:</strong> {asset.password ? "********" : "Not set"}</p>
			<div>
				<h3 className="font-bold mt-2">IP Addresses:</h3>
				<ul>
					{asset.ips.map((ip) => (
						<li key={ip.id}>{ip.ip}</li>
					))}
				</ul>
			</div>
			<div>
				<h3 className="font-bold mt-2">Labels:</h3>
				<p>{asset.labels}</p>
			</div>
			<div>
				<h3 className="font-bold mt-2">Custom Fields:</h3>
				<p>{asset.custom_fields}</p>
			</div>
			<div>
				<h3 className="font-bold mt-2">Scan Data:</h3>
				<pre className="bg-gray-100 p-2 rounded">
					{JSON.stringify(JSON.parse(asset.scan_data || "{}"), null, 2)}
				</pre>
			</div>
		</div>
	);
}

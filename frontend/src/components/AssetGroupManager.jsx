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
		<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div className="card" style={{ width: '50%', maxWidth: '600px' }}>
				<h3>{assetGroup ? "Edit Asset Group" : "Create Asset Group"}</h3>
				<div style={{ marginTop: '20px' }}>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Group Name"
						style={{ marginBottom: '15px' }}
					/>
					<input
						type="text"
						value={labels}
						onChange={(e) => setLabels(e.target.value)}
						placeholder="Labels (comma-separated)"
						style={{ marginBottom: '15px' }}
					/>
					<h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '10px' }}>Select Assets</h4>
					<ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto', border: '1px solid #30363D', borderRadius: '6px', padding: '10px' }}>
						{assets.map((asset) => (
							<li key={asset.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
								<input
									type="checkbox"
									checked={selectedAssets.includes(asset.id)}
									onChange={() => toggleAsset(asset.id)}
									style={{ marginRight: '10px' }}
								/>
								<span>{asset.name}</span>
							</li>
						))}
					</ul>
				</div>
				<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
					<button
						onClick={onClose}
						className="btn btn-secondary"
					>
						Close
					</button>
					<button
						onClick={handleSave}
						className="btn btn-primary"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

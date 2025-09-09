import React from "react";

export default function AssetManager({ assets, onUpdate, onDelete, onClose }) {
	return (
		<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div className="card" style={{ width: '50%', maxWidth: '600px' }}>
				<h3>Asset Manager</h3>
				<div style={{ marginTop: '20px' }}>
					<ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
						{assets.map((asset) => (
							<li key={asset.id} style={{ marginBottom: '15px', borderBottom: '1px solid #30363D', paddingBottom: '15px' }}>
								<input
									type="text"
									defaultValue={asset.name}
									onBlur={(e) => onUpdate(asset.id, { ...asset, name: e.target.value })}
									style={{ marginBottom: '10px' }}
								/>
								<input
									type="text"
									defaultValue={asset.labels ? JSON.parse(asset.labels).join(", ") : ""}
									onBlur={(e) => onUpdate(asset.id, { ...asset, labels: JSON.stringify(e.target.value.split(",").map(s => s.trim())) })}
									placeholder="Labels (comma-separated)"
								/>
								<button
									onClick={() => onDelete(asset.id)}
									className="btn btn-danger"
									style={{ marginTop: '10px' }}
								>
									Delete
								</button>
							</li>
						))}
					</ul>
				</div>
				<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
					<button
						onClick={onClose}
						className="btn btn-secondary"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

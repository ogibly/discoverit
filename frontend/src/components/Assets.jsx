import React from "react";
import AssetList from "./AssetList";
import AssetDetail from "./AssetDetail";

export default function Assets({
	assets,
	selectedAsset,
	setSelectedAsset,
	deleteAsset,
	setShowAssetManager,
}) {
	return (
		<div>
			<div className="header">
				<h2>Assets</h2>
				<button
					onClick={() => setShowAssetManager(true)}
					className="btn btn-secondary"
				>
					Manage
				</button>
			</div>
			<div className="grid grid-cols-2 gap-6">
				<div className="col-span-1">
					<div className="card">
						<AssetList
							assets={assets}
							onSelect={setSelectedAsset}
							onDelete={deleteAsset}
						/>
					</div>
				</div>
				<div className="col-span-1">
					<div className="card">
						{selectedAsset ? (
							<AssetDetail asset={selectedAsset} />
						) : (
							<p className="text-gray-400">
								Select an asset to see details.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

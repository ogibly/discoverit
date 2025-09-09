import React from "react";
import AssetList from "./AssetList";
import AssetDetail from "./AssetDetail";

export default function Assets({
	assets,
	selectedAsset,
	setSelectedAsset,
	deleteAsset,
	setShowAssetManager,
	selectedAssets,
	onSelectAsset,
	onSelectAllAssets,
	onDeleteSelectedAssets,
	onCreateAssetGroup,
}) {
	return (
		<div className="flex flex-col h-full">
			<div className="header">
				<h2>Assets</h2>
				<button
					onClick={() => setShowAssetManager(true)}
					className="btn btn-secondary"
				>
					Manage
				</button>
			</div>
			<div className="flex gap-6 flex-grow min-h-0">
				<div className="w-2/3">
					<div className="card h-full">
						<AssetList
							assets={assets}
							selectedAsset={selectedAsset}
							onSelect={setSelectedAsset}
							onDelete={deleteAsset}
							selectedAssets={selectedAssets}
							onSelectAsset={onSelectAsset}
							onSelectAll={onSelectAllAssets}
							onDeleteSelected={onDeleteSelectedAssets}
							onCreateAssetGroup={onCreateAssetGroup}
						/>
					</div>
				</div>
				<div className="w-1/3">
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

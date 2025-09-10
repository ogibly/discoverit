import React from "react";
import AssetList from "./AssetList";
import AssetDetail from "./AssetDetail";
import ActionsDropdown from "./ActionsDropdown";

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
	const actions = [
		{
			label: "Create Asset Group",
			onClick: onCreateAssetGroup,
			disabled: selectedAssets.length === 0,
		},
		{
			label: "Edit",
			onClick: () => setShowAssetManager(true),
			disabled: selectedAssets.length === 0,
		},
		{
			label: "Delete",
			onClick: onDeleteSelectedAssets,
			disabled: selectedAssets.length === 0,
		},
	];

	return (
		<div className="flex flex-col h-full">
			<div className="header">
				<h2>Assets</h2>
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
							<AssetDetail asset={selectedAsset} onUpdate={onUpdate} />
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

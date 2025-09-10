import React from "react";
import AssetList from "./AssetList";
import AssetDetail from "./AssetDetail";
import ActionsDropdown from "./ActionsDropdown";
import LabelFilter from "./LabelFilter";

export default function Assets({
	assets,
	selectedAsset,
	setSelectedAsset,
	deleteAsset,
	onUpdate,
	setShowAssetManager,
	selectedAssets,
	onSelectAsset,
	onSelectAllAssets,
	onDeleteSelectedAssets,
	onCreateAssetGroup,
	allLabels,
	selectedLabels,
	setSelectedLabels,
}) {
	const actions = [
		{
			label: "Create Asset Group",
			onClick: onCreateAssetGroup,
			disabled: selectedAssets.length === 0,
		},
		{
			label: "Manage Assets",
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
		<div className="flex flex-col h-full text-slate-300">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-3xl font-bold text-white">Assets</h2>
				<div className="flex items-center gap-4">
					<LabelFilter allLabels={allLabels} selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} />
					<button
						onClick={() => setShowAssetManager(true)}
						className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
					>
						Create Asset
					</button>
				</div>
			</div>
			<div className="flex justify-between items-center mb-4">
				<ActionsDropdown actions={actions} />
			</div>
			<div className="flex gap-6 flex-grow min-h-0">
				<div className="w-2/3 flex flex-col">
					<div className="flex-grow flex flex-col">
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
					<div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 h-full">
						{selectedAsset ? (
							<AssetDetail asset={selectedAsset} onUpdate={onUpdate} />
						) : (
							<div className="flex items-center justify-center h-full">
								<p className="text-slate-500">
									Select an asset to see details.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

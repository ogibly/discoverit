import React from "react";
import AssetGroupList from "./AssetGroupList";
import AssetGroupDetail from "./AssetGroupDetail";

export default function AssetGroups({
	assetGroups,
	selectedAssetGroup,
	setSelectedAssetGroup,
	deleteAssetGroup,
	setEditingAssetGroup,
	setShowAssetGroupManager,
	selectedAssetGroups,
	onSelectAssetGroup,
	onSelectAllAssetGroups,
	onDeleteSelectedAssetGroups,
}) {
	return (
		<div className="flex flex-col h-full">
			<div className="header">
				<h2>Asset Groups</h2>
				<button
					onClick={() => {
						setEditingAssetGroup(null);
						setShowAssetGroupManager(true);
					}}
					className="btn btn-secondary"
				>
					Create
				</button>
			</div>
			<div className="flex gap-6 flex-grow min-h-0">
				<div className="w-2/3">
					<div className="card h-full">
						<AssetGroupList
							assetGroups={assetGroups}
							selectedAssetGroup={selectedAssetGroup}
							onSelect={setSelectedAssetGroup}
							onDelete={deleteAssetGroup}
							selectedAssetGroups={selectedAssetGroups}
							onSelectAssetGroup={onSelectAssetGroup}
							onSelectAll={onSelectAllAssetGroups}
							onDeleteSelected={onDeleteSelectedAssetGroups}
						/>
					</div>
				</div>
				<div className="w-1/3">
					<div className="card">
						{selectedAssetGroup ? (
							<AssetGroupDetail assetGroup={selectedAssetGroup} />
						) : (
							<p className="text-gray-400">
								Select an asset group to see details.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

import React from "react";
import AssetGroupList from "./AssetGroupList";
import AssetGroupDetail from "./AssetGroupDetail";
import Operations from "./Operations";

export default function AssetGroups({
	assetGroups,
	selectedAssetGroup,
	setSelectedAssetGroup,
	deleteAssetGroup,
	setEditingAssetGroup,
	setShowAssetGroupManager,
}) {
	return (
		<div>
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
			<div className="grid grid-cols-3 gap-6">
				<div className="col-span-1">
					<div className="card">
						<AssetGroupList
							assetGroups={assetGroups}
							onSelect={setSelectedAssetGroup}
							onDelete={deleteAssetGroup}
						/>
					</div>
				</div>
				<div className="col-span-1">
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
				<div className="col-span-1">
					<div className="card">
						<Operations />
					</div>
				</div>
			</div>
		</div>
	);
}

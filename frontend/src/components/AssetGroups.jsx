import React from "react";
import AssetGroupList from "./AssetGroupList";
import AssetGroupDetail from "./AssetGroupDetail";
import ActionsDropdown from "./ActionsDropdown";
import LabelFilter from "./LabelFilter";

export default function AssetGroups({
	assetGroups,
	selectedAssetGroup,
	setSelectedAssetGroup,
	deleteAssetGroup,
	updateAssetGroup,
	setEditingAssetGroup,
	setShowAssetGroupManager,
	selectedAssetGroups,
	onSelectAssetGroup,
	onSelectAllAssetGroups,
	onDeleteSelectedAssetGroups,
	setShowOperationModal,
	allLabels,
	selectedLabels,
	setSelectedLabels,
}) {
	const actions = [
		{
			label: "Run Operation",
			onClick: () => setShowOperationModal(true),
			disabled: selectedAssetGroups.length === 0,
		},
		{
			label: "Create",
			onClick: () => {
				setEditingAssetGroup(null);
				setShowAssetGroupManager(true);
			},
			disabled: false,
		},
		{
			label: "Edit",
			onClick: () => {
				const groupToEdit = assetGroups.find(ag => ag.id === selectedAssetGroups[0]);
				setEditingAssetGroup(groupToEdit);
				setShowAssetGroupManager(true);
			},
			disabled: selectedAssetGroups.length !== 1,
		},
		{
			label: "Delete",
			onClick: onDeleteSelectedAssetGroups,
			disabled: selectedAssetGroups.length === 0,
		},
	];

	return (
		<div className="flex flex-col h-full text-slate-300">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-3xl font-bold text-white">Asset Groups</h2>
				<div className="flex items-center gap-4">
					<LabelFilter allLabels={allLabels} selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} />
				</div>
			</div>
			<div className="flex justify-between items-center mb-4">
				<ActionsDropdown actions={actions} />
			</div>
			<div className="flex gap-6 flex-grow min-h-0">
				<div className="w-2/3 flex flex-col">
					<div className="flex-grow flex flex-col">
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
					<div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 h-full">
						{selectedAssetGroup ? (
							<AssetGroupDetail assetGroup={selectedAssetGroup} onUpdate={updateAssetGroup} />
						) : (
							<div className="flex items-center justify-center h-full">
								<p className="text-slate-500">
									Select an asset group to see details.
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

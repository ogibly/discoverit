import React, { useState } from "react";
import StandardList from "./common/StandardList";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { cn } from "../utils/cn";

export default function AssetGroupList({
	assetGroups,
	selectedAssetGroup,
	onSelect,
	onDelete,
	selectedAssetGroups,
	onSelectAssetGroup,
	onDeleteSelected,
	onSelectAll,
	onCreateAssetGroup,
}) {
	const [searchValue, setSearchValue] = useState("");
	const [filterValue, setFilterValue] = useState("all");
	const [sortValue, setSortValue] = useState("name");
	const [sortOrder, setSortOrder] = useState("asc");
	const [viewMode, setViewMode] = useState("table");

	const filterOptions = [
		{ value: "all", label: "All Groups", icon: "📁" },
		{ value: "active", label: "Active", icon: "✅" },
		{ value: "inactive", label: "Inactive", icon: "❌" },
	];

	const sortOptions = [
		{ value: "name", label: "Name" },
		{ value: "created_at", label: "Created Date" },
		{ value: "asset_count", label: "Asset Count" },
	];

	const statistics = [
		{
			value: assetGroups.length,
			label: "Total Groups",
			color: "text-primary",
			icon: "📁",
			bgColor: "bg-primary/20",
			iconColor: "text-primary"
		},
		{
			value: assetGroups.filter(ag => ag.is_active !== false).length,
			label: "Active",
			color: "text-success",
			icon: "✅",
			bgColor: "bg-success/20",
			iconColor: "text-success"
		},
		{
			value: assetGroups.filter(ag => ag.is_active === false).length,
			label: "Inactive",
			color: "text-error",
			icon: "❌",
			bgColor: "bg-error/20",
			iconColor: "text-error"
		},
		{
			value: selectedAssetGroups.length,
			label: "Selected",
			color: "text-warning",
			icon: "✓",
			bgColor: "bg-warning/20",
			iconColor: "text-warning"
		}
	];

	const renderAssetGroupCard = (group) => (
		<div className="surface-interactive p-6 rounded-lg border border-border">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">
						📁
					</div>
				</div>
				<Badge className={cn("text-xs", group.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
					{group.is_active !== false ? 'Active' : 'Inactive'}
				</Badge>
			</div>

			<div className="space-y-3">
				<div>
					<h3 className="text-subheading text-foreground truncate">
						{group.name}
					</h3>
					<p className="text-caption text-muted-foreground">
						{group.description || 'No description'}
					</p>
				</div>

				<div className="space-y-2 text-caption text-muted-foreground">
					<div className="flex justify-between">
						<span>Assets:</span>
						<span>{group.assets?.length || 0}</span>
					</div>
					<div className="flex justify-between">
						<span>Labels:</span>
						<span>{group.labels?.length || 0}</span>
					</div>
					{group.created_at && (
						<div className="flex justify-between">
							<span>Created:</span>
							<span>{new Date(group.created_at).toLocaleDateString()}</span>
						</div>
					)}
				</div>

				{group.labels && group.labels.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{group.labels.map(label => (
							<Badge key={label.id} variant="secondary" className="text-xs">
								{label.name}
							</Badge>
						))}
					</div>
				)}

				<div className="flex space-x-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onSelect(group)}
						className="flex-1 text-xs"
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(group.id)}
						className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	);

	const renderAssetGroupRow = (group) => (
		<>
			<td className="px-6 py-4">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-sm">
						📁
					</div>
					<div>
						<div className="text-body font-medium text-foreground">
							{group.name}
						</div>
						<div className="text-caption text-muted-foreground">
							{group.description || 'No description'}
						</div>
					</div>
				</div>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-foreground">
					{group.assets?.length || 0} assets
				</span>
			</td>
			<td className="px-6 py-4">
				<div className="flex flex-wrap gap-1">
					{group.labels && group.labels.map(label => (
						<Badge key={label.id} variant="secondary" className="text-xs">
							{label.name}
						</Badge>
					))}
				</div>
			</td>
			<td className="px-6 py-4">
				<Badge className={cn("text-xs", group.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
					{group.is_active !== false ? 'Active' : 'Inactive'}
				</Badge>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-muted-foreground">
					{group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}
				</span>
			</td>
			<td className="px-6 py-4">
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onSelect(group)}
						className="text-xs"
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(group.id)}
						className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
					>
						Delete
					</Button>
				</div>
			</td>
		</>
	);

	return (
		<StandardList
			items={assetGroups}
			title="Asset Groups"
			subtitle="Organize your assets into groups"
			itemName="group"
			itemNamePlural="groups"
			searchPlaceholder="Search asset groups by name, description, or labels..."
			searchValue={searchValue}
			onSearchChange={setSearchValue}
			filterOptions={filterOptions}
			filterValue={filterValue}
			onFilterChange={setFilterValue}
			sortOptions={sortOptions}
			sortValue={sortValue}
			onSortChange={setSortValue}
			sortOrder={sortOrder}
			onSortOrderChange={setSortOrder}
			viewMode={viewMode}
			onViewModeChange={setViewMode}
			selectedItems={selectedAssetGroups}
			onItemSelect={onSelectAssetGroup}
			onSelectAll={onSelectAll}
			onCreateClick={onCreateAssetGroup}
			createButtonText="Create Asset Group"
			onBulkDelete={onDeleteSelected}
			statistics={statistics}
			renderItemCard={renderAssetGroupCard}
			renderItemRow={renderAssetGroupRow}
			emptyStateIcon="📁"
			emptyStateTitle="No asset groups found"
			emptyStateDescription="Create your first asset group to organize your assets."
		/>
	);
}

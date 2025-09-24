import React, { useState } from "react";
import StandardList from "./common/StandardList";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { cn } from "../utils/cn";

export default function AssetList({
	assets,
	selectedAsset,
	onSelect,
	onDelete,
	selectedAssets,
	onSelectAsset,
	onDeleteSelected,
	onCreateAssetGroup,
	onSelectAll,
	onCreateAsset,
}) {
	const [searchValue, setSearchValue] = useState("");
	const [filterValue, setFilterValue] = useState("all");
	const [sortValue, setSortValue] = useState("name");
	const [sortOrder, setSortOrder] = useState("asc");
	const [viewMode, setViewMode] = useState("table");

	const filterOptions = [
		{ value: "all", label: "All Assets", icon: "📱" },
		{ value: "active", label: "Active", icon: "✅" },
		{ value: "inactive", label: "Inactive", icon: "❌" },
	];

	const sortOptions = [
		{ value: "name", label: "Name" },
		{ value: "created_at", label: "Created Date" },
		{ value: "mac", label: "MAC Address" },
	];

	const statistics = [
		{
			value: assets.length,
			label: "Total Assets",
			color: "text-primary",
			icon: "📱",
			bgColor: "bg-primary/20",
			iconColor: "text-primary"
		},
		{
			value: assets.filter(a => a.is_active !== false).length,
			label: "Active",
			color: "text-success",
			icon: "✅",
			bgColor: "bg-success/20",
			iconColor: "text-success"
		},
		{
			value: assets.filter(a => a.is_active === false).length,
			label: "Inactive",
			color: "text-error",
			icon: "❌",
			bgColor: "bg-error/20",
			iconColor: "text-error"
		},
		{
			value: selectedAssets.length,
			label: "Selected",
			color: "text-warning",
			icon: "✓",
			bgColor: "bg-warning/20",
			iconColor: "text-warning"
		}
	];

	const renderAssetCard = (asset) => (
		<div className="surface-interactive p-6 rounded-lg border border-border">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-lg">
						📱
					</div>
				</div>
				<Badge className={cn("text-xs", asset.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
					{asset.is_active !== false ? 'Active' : 'Inactive'}
				</Badge>
			</div>

			<div className="space-y-3">
				<div>
					<h3 className="text-subheading text-foreground truncate">
						{asset.name}
					</h3>
					<p className="text-caption text-muted-foreground">
						{asset.description || 'No description'}
					</p>
				</div>

				<div className="space-y-2 text-caption text-muted-foreground">
					{asset.mac && (
						<div className="flex justify-between">
							<span>MAC:</span>
							<span className="font-mono">{asset.mac}</span>
						</div>
					)}
					{asset.ip_address && (
						<div className="flex justify-between">
							<span>IP:</span>
							<span className="font-mono">{asset.ip_address}</span>
						</div>
					)}
					<div className="flex justify-between">
						<span>Labels:</span>
						<span>{asset.labels?.length || 0}</span>
					</div>
					{asset.created_at && (
						<div className="flex justify-between">
							<span>Created:</span>
							<span>{new Date(asset.created_at).toLocaleDateString()}</span>
						</div>
					)}
				</div>

				{asset.labels && asset.labels.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{asset.labels.map(label => (
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
						onClick={() => onSelect(asset)}
						className="flex-1 text-xs"
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(asset.id)}
						className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	);

	const renderAssetRow = (asset) => (
		<>
			<td className="px-6 py-4">
				<div className="flex items-center space-x-3">
					<div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-sm">
						📱
					</div>
					<div>
						<div className="text-body font-medium text-foreground">
							{asset.name}
						</div>
						<div className="text-caption text-muted-foreground">
							{asset.description || 'No description'}
						</div>
					</div>
				</div>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-foreground font-mono">
					{asset.mac || '-'}
				</span>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-foreground font-mono">
					{asset.ip_address || '-'}
				</span>
			</td>
			<td className="px-6 py-4">
				<div className="flex flex-wrap gap-1">
					{asset.labels && asset.labels.map(label => (
						<Badge key={label.id} variant="secondary" className="text-xs">
							{label.name}
						</Badge>
					))}
				</div>
			</td>
			<td className="px-6 py-4">
				<Badge className={cn("text-xs", asset.is_active !== false ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground")}>
					{asset.is_active !== false ? 'Active' : 'Inactive'}
				</Badge>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-muted-foreground">
					{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '-'}
				</span>
			</td>
			<td className="px-6 py-4">
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onSelect(asset)}
						className="text-xs"
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(asset.id)}
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
			items={assets}
			title="Assets"
			subtitle="Manage your network assets"
			itemName="asset"
			itemNamePlural="assets"
			searchPlaceholder="Search assets by name, IP, description, manufacturer, model, or labels..."
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
			selectedItems={selectedAssets}
			onItemSelect={onSelectAsset}
			onSelectAll={onSelectAll}
			onCreateClick={onCreateAsset}
			createButtonText="Create Asset"
			onBulkDelete={onDeleteSelected}
			statistics={statistics}
			renderItemCard={renderAssetCard}
			renderItemRow={renderAssetRow}
			emptyStateIcon="📱"
			emptyStateTitle="No assets found"
			emptyStateDescription="Create your first asset to get started."
		/>
	);
}

import React, { useState } from "react";
import StandardList from "./common/StandardList";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { cn } from "../utils/cn";

export default React.memo(function DeviceList({
	devices,
	selectedDevice,
	onSelect,
	onDelete,
	selectedDevices,
	onSelectDevice,
	onDeleteSelected,
	onCreateAsset,
	onSelectAll,
	onViewDevice,
	onConvertToAsset,
}) {
	const [searchValue, setSearchValue] = useState("");
	const [filterValue, setFilterValue] = useState("all");
	const [sortValue, setSortValue] = useState("last_seen");
	const [sortOrder, setSortOrder] = useState("desc");
	const [viewMode, setViewMode] = useState("table");

	const filterOptions = [
		{ value: "all", label: "All Devices", icon: "📱" },
		{ value: "online", label: "Online", icon: "🟢" },
		{ value: "offline", label: "Offline", icon: "🔴" },
		{ value: "unknown", label: "Unknown", icon: "❓" },
	];

	const sortOptions = [
		{ value: "last_seen", label: "Last Seen" },
		{ value: "ip_address", label: "IP Address" },
		{ value: "hostname", label: "Hostname" },
		{ value: "device_type", label: "Device Type" },
	];

	const statistics = [
		{
			value: devices.length,
			label: "Total Devices",
			color: "text-primary",
			icon: "📱",
			bgColor: "bg-primary/20",
			iconColor: "text-primary"
		},
		{
			value: devices.filter(d => d.status === 'online').length,
			label: "Online",
			color: "text-success",
			icon: "🟢",
			bgColor: "bg-success/20",
			iconColor: "text-success"
		},
		{
			value: devices.filter(d => d.status === 'offline').length,
			label: "Offline",
			color: "text-error",
			icon: "🔴",
			bgColor: "bg-error/20",
			iconColor: "text-error"
		},
		{
			value: selectedDevices.length,
			label: "Selected",
			color: "text-warning",
			icon: "✓",
			bgColor: "bg-warning/20",
			iconColor: "text-warning"
		}
	];

	const getDeviceTypeIcon = (deviceType) => {
		switch (deviceType) {
			case 'router': return '🌐';
			case 'switch': return '🔀';
			case 'server': return '🖥️';
			case 'workstation': return '💻';
			case 'printer': return '🖨️';
			default: return '📱';
		}
	};

	const getDeviceTypeColor = (deviceType) => {
		switch (deviceType) {
			case 'router': return 'bg-blue-500/20 text-blue-600';
			case 'switch': return 'bg-green-500/20 text-green-600';
			case 'server': return 'bg-purple-500/20 text-purple-600';
			case 'workstation': return 'bg-orange-500/20 text-orange-600';
			case 'printer': return 'bg-pink-500/20 text-pink-600';
			default: return 'bg-gray-500/20 text-gray-600';
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case 'online': return 'bg-success text-success-foreground';
			case 'offline': return 'bg-error text-error-foreground';
			case 'unknown': return 'bg-warning text-warning-foreground';
			default: return 'bg-muted text-muted-foreground';
		}
	};

	const getStatusText = (status) => {
		switch (status) {
			case 'online': return 'Online';
			case 'offline': return 'Offline';
			case 'unknown': return 'Unknown';
			default: return 'New';
		}
	};

	const formatLastSeen = (lastSeen) => {
		if (!lastSeen) return 'Never';
		const date = new Date(lastSeen);
		return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
	};

	const renderDeviceCard = (device) => (
		<div className="surface-interactive p-6 rounded-lg border border-border">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center space-x-3">
					<div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getDeviceTypeColor(device.device_type))}>
						{getDeviceTypeIcon(device.device_type)}
					</div>
				</div>
				<Badge className={cn("text-xs", getStatusColor(device.status))}>
					{getStatusText(device.status)}
				</Badge>
			</div>

			<div className="space-y-3">
				<div>
					<h3 className="text-subheading text-foreground truncate">
						{device.hostname || device.ip_address || 'Unknown Device'}
					</h3>
					<p className="text-caption text-muted-foreground">
						{device.ip_address || 'Unknown IP'}
					</p>
				</div>

				<div className="space-y-2 text-caption text-muted-foreground">
					{device.mac_address && (
						<div className="flex justify-between">
							<span>MAC:</span>
							<span className="font-mono">{device.mac_address}</span>
						</div>
					)}
					{device.device_type && (
						<div className="flex justify-between">
							<span>Type:</span>
							<span className="capitalize">{device.device_type}</span>
						</div>
					)}
					<div className="flex justify-between">
						<span>Last Seen:</span>
						<span>{formatLastSeen(device.last_seen)}</span>
					</div>
					{device.response_time && (
						<div className="flex justify-between">
							<span>Response:</span>
							<span className="font-mono">{device.response_time}ms</span>
						</div>
					)}
				</div>

				<div className="flex space-x-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onViewDevice ? onViewDevice(device) : onSelect(device)}
						className="flex-1 text-xs"
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onConvertToAsset ? onConvertToAsset(device) : onCreateAsset(device)}
						className="flex-1 text-xs"
					>
						Convert
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(device.id)}
						className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20"
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	);

	const renderDeviceRow = (device) => (
		<>
			<td className="px-6 py-4">
				<div className="flex items-center space-x-3">
					<div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-sm", getDeviceTypeColor(device.device_type))}>
						{getDeviceTypeIcon(device.device_type)}
					</div>
					<div>
						<div className="text-body font-medium text-foreground">
							{device.hostname || 'Unknown Device'}
						</div>
						{device.mac_address && (
							<div className="text-caption text-muted-foreground font-mono">
								{device.mac_address}
							</div>
						)}
					</div>
				</div>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-foreground font-mono">{device.ip_address || 'Unknown'}</span>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-foreground capitalize">{device.device_type || 'Unknown'}</span>
			</td>
			<td className="px-6 py-4">
				<Badge className={cn("text-xs", getStatusColor(device.status))}>
					{getStatusText(device.status)}
				</Badge>
			</td>
			<td className="px-6 py-4">
				<span className="text-body text-muted-foreground">{formatLastSeen(device.last_seen)}</span>
			</td>
			<td className="px-6 py-4">
				<div className="flex space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onViewDevice ? onViewDevice(device) : onSelect(device)}
						className="text-xs"
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onConvertToAsset ? onConvertToAsset(device) : onCreateAsset(device)}
						className="text-xs"
					>
						Convert
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(device.id)}
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
			items={devices}
			title="Discovered Devices"
			subtitle="Manage and convert discovered network devices"
			itemName="device"
			itemNamePlural="devices"
			searchPlaceholder="Search devices by IP, hostname, MAC, OS, or manufacturer..."
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
			selectedItems={selectedDevices}
			onItemSelect={onSelectDevice}
			onSelectAll={onSelectAll}
			onBulkDelete={onDeleteSelected}
			statistics={statistics}
			renderItemCard={renderDeviceCard}
			renderItemRow={renderDeviceRow}
			emptyStateIcon="🔍"
			emptyStateTitle="No devices found"
			emptyStateDescription="Start a network discovery scan to find devices on your network."
		/>
	);
});

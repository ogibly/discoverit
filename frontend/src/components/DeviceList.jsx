import React from "react";

export default function DeviceList({ devices, onSelect }) {
	return (
		<div className="bg-white shadow rounded p-4">
			<h2 className="text-xl font-bold mb-2">Devices</h2>
			<ul className="divide-y divide-gray-200">
				{devices.map((device) => (
					<li
						key={device.id}
						className="p-2 cursor-pointer hover:bg-gray-100 rounded"
						onClick={() => onSelect(device)}
					>
						<p className="font-medium">{device.ip}</p>
						{device.mac && <p className="text-sm text-gray-500">{device.mac}</p>}
					</li>
				))}
			</ul>
		</div>
	);
}
import React from "react";

export default function DeviceList({ devices, onSelect, onDelete }) {
	return (
		<div className="bg-white shadow rounded p-4">
			<h2 className="text-xl font-bold mb-2">Devices</h2>
			<ul className="divide-y divide-gray-200">
				{devices.map((device) => (
					<li
						key={device.id}
						className="p-2 hover:bg-gray-100 rounded flex justify-between items-center"
					>
						<div onClick={() => onSelect(device)} className="cursor-pointer flex-grow">
							<p className="font-medium">{device.ip}</p>
							{device.mac && <p className="text-sm text-gray-500">{device.mac}</p>}
						</div>
						<button
							onClick={() => onDelete(device.id)}
							className="ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
						>
							Delete
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

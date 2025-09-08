import React from "react";

export default function AssetList({ assets, onSelect, onDelete }) {
	return (
		<div className="bg-white shadow rounded p-4">
			<ul className="divide-y divide-gray-200">
				{assets.map((asset) => (
					<li
						key={asset.id}
						className="p-2 hover:bg-gray-100 rounded flex justify-between items-center"
					>
						<div onClick={() => onSelect(asset)} className="cursor-pointer flex-grow">
							<p className="font-medium">{asset.name}</p>
							{asset.mac && <p className="text-sm text-gray-500">{asset.mac}</p>}
						</div>
						<button
							onClick={() => onDelete(asset.id)}
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

import React from "react";

export default function AssetGroupList({ assetGroups, onSelect, onDelete }) {
	return (
		<div className="bg-white shadow rounded p-4">
			<h2 className="text-xl font-bold mb-2">Asset Groups</h2>
			<ul className="divide-y divide-gray-200">
				{assetGroups.map((group) => (
					<li
						key={group.id}
						className="p-2 hover:bg-gray-100 rounded flex justify-between items-center"
					>
						<div onClick={() => onSelect(group)} className="cursor-pointer flex-grow">
							<p className="font-medium">{group.name}</p>
						</div>
						<button
							onClick={() => onDelete(group.id)}
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
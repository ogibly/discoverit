import React from "react";

export default function AssetManager({ assets, onUpdate, onDelete, onClose }) {
	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white">
				<div className="mt-3 text-center">
					<h3 className="text-lg leading-6 font-medium text-gray-900">Asset Manager</h3>
					<div className="mt-2 px-7 py-3">
						<ul className="divide-y divide-gray-200">
							{assets.map((asset) => (
								<li key={asset.id} className="p-2 flex justify-between items-center">
									<input
										type="text"
										defaultValue={asset.name}
										onBlur={(e) => onUpdate(asset.id, { name: e.target.value })}
										className="border rounded px-2 py-1 flex-grow"
									/>
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
					<div className="items-center px-4 py-3">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

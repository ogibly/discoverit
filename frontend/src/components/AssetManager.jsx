import React from "react";

export default function AssetManager({ assets, onUpdate, onDelete, onClose }) {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
			<div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-300">
				<h3 className="text-2xl font-bold text-white mb-6">Asset Manager</h3>
				<div className="max-h-96 overflow-y-auto pr-4">
					<ul className="space-y-6">
						{assets.map((asset) => (
							<li key={asset.id} className="border-b border-slate-800 pb-6">
								<div className="space-y-4">
									<input
										type="text"
										defaultValue={asset.name}
										onBlur={(e) => onUpdate(asset.id, { ...asset, name: e.target.value })}
										className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<input
										type="text"
										defaultValue={asset.labels ? JSON.parse(asset.labels).join(", ") : ""}
										onBlur={(e) => onUpdate(asset.id, { ...asset, labels: JSON.stringify(e.target.value.split(",").map(s => s.trim())) })}
										placeholder="Labels (comma-separated)"
										className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<button
										onClick={() => onDelete(asset.id)}
										className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500"
									>
										Delete
									</button>
								</div>
							</li>
						))}
					</ul>
				</div>
				<div className="mt-8 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

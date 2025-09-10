import React, { useState } from "react";

export default function OperationModal({ operation, onSave, onClose }) {
	const [name, setName] = useState(operation ? operation.name : "");
	const [apiUrl, setApiUrl] = useState(operation ? operation.api_url : "");
	const [apiMethod, setApiMethod] = useState(operation ? operation.api_method : "GET");
	const [apiHeaders, setApiHeaders] = useState(
		operation ? operation.api_headers : ""
	);
	const [apiBody, setApiBody] = useState(operation ? operation.api_body : "");

	const handleSave = () => {
		onSave({
			name,
			api_url: apiUrl,
			api_method: apiMethod,
			api_headers: apiHeaders,
			api_body: apiBody,
		});
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
			<div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-slate-300">
				<h3 className="text-2xl font-bold text-white mb-6">{operation ? "Edit Operation" : "Create Operation"}</h3>
				<div className="space-y-4">
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Operation Name"
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<input
						type="text"
						value={apiUrl}
						onChange={(e) => setApiUrl(e.target.value)}
						placeholder="API URL"
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<select
						value={apiMethod}
						onChange={(e) => setApiMethod(e.target.value)}
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option>GET</option>
						<option>POST</option>
						<option>PUT</option>
						<option>DELETE</option>
					</select>
					<textarea
						value={apiHeaders}
						onChange={(e) => setApiHeaders(e.target.value)}
						placeholder="API Headers (JSON)"
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
					/>
					<textarea
						value={apiBody}
						onChange={(e) => setApiBody(e.target.value)}
						placeholder="API Body (JSON)"
						className="w-full bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
					/>
				</div>
				<div className="mt-8 flex justify-end gap-4">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
					>
						Close
					</button>
					<button
						onClick={handleSave}
						className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

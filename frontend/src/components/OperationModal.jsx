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
		<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div className="card" style={{ width: '50%', maxWidth: '600px' }}>
				<h3>{operation ? "Edit Operation" : "Create Operation"}</h3>
				<div style={{ marginTop: '20px' }}>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Operation Name"
						style={{ marginBottom: '15px' }}
					/>
					<input
						type="text"
						value={apiUrl}
						onChange={(e) => setApiUrl(e.target.value)}
						placeholder="API URL"
						style={{ marginBottom: '15px' }}
					/>
					<select
						value={apiMethod}
						onChange={(e) => setApiMethod(e.target.value)}
						style={{ marginBottom: '15px' }}
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
						style={{ marginBottom: '15px', minHeight: '80px' }}
					/>
					<textarea
						value={apiBody}
						onChange={(e) => setApiBody(e.target.value)}
						placeholder="API Body (JSON)"
						style={{ minHeight: '80px' }}
					/>
				</div>
				<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
					<button
						onClick={onClose}
						className="btn btn-secondary"
					>
						Close
					</button>
					<button
						onClick={handleSave}
						className="btn btn-primary"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}

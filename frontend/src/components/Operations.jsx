import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function Operations() {
	const [operations, setOperations] = useState([]);
	const [showModal, setShowModal] = useState(false);
	const [editingOperation, setEditingOperation] = useState(null);

	const fetchOperations = () => {
		axios.get(`${API_BASE}/operations`).then((res) => setOperations(res.data));
	};

	useEffect(() => {
		fetchOperations();
	}, []);

	const handleSave = (operationData) => {
		if (editingOperation) {
			axios
				.put(`${API_BASE}/operations/${editingOperation.id}`, operationData)
				.then(() => {
					fetchOperations();
					setShowModal(false);
					setEditingOperation(null);
				});
		} else {
			axios.post(`${API_BASE}/operations`, operationData).then(() => {
				fetchOperations();
				setShowModal(false);
			});
		}
	};

	const handleDelete = (operationId) => {
		if (window.confirm("Are you sure you want to delete this operation?")) {
			axios.delete(`${API_BASE}/operations/${operationId}`).then(() => {
				fetchOperations();
			});
		}
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-2xl font-bold">Operations</h2>
				<button
					onClick={() => {
						setEditingOperation(null);
						setShowModal(true);
					}}
					className="btn btn-primary"
				>
					Create Operation
				</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>URL</th>
						<th>Method</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{operations.map((op) => (
						<tr key={op.id}>
							<td>{op.name}</td>
							<td>{op.api_url}</td>
							<td>{op.api_method}</td>
							<td>
								<button
									onClick={() => {
										setEditingOperation(op);
										setShowModal(true);
									}}
									className="btn btn-secondary"
								>
									Edit
								</button>
								<button
									onClick={() => handleDelete(op.id)}
									className="btn btn-danger ml-2"
								>
									Delete
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{showModal && (
				<OperationModal
					operation={editingOperation}
					onSave={handleSave}
					onClose={() => {
						setShowModal(false);
						setEditingOperation(null);
					}}
				/>
			)}
		</div>
	);
}

function OperationModal({ operation, onSave, onClose }) {
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
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-gray-800">
				<div className="mt-3">
					<h3 className="text-lg leading-6 font-medium text-white text-center">
						{operation ? "Edit Operation" : "Create Operation"}
					</h3>
					<div className="mt-2 px-7 py-3">
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Operation Name"
							className="mb-4"
						/>
						<input
							type="text"
							value={apiUrl}
							onChange={(e) => setApiUrl(e.target.value)}
							placeholder="API URL"
							className="mb-4"
						/>
						<select
							value={apiMethod}
							onChange={(e) => setApiMethod(e.target.value)}
							className="mb-4"
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
							className="mb-4"
						/>
						<textarea
							value={apiBody}
							onChange={(e) => setApiBody(e.target.value)}
							placeholder="API Body (JSON)"
							className="mb-4"
						/>
					</div>
					<div className="items-center px-4 py-3">
						<button
							onClick={handleSave}
							className="btn btn-primary w-full"
						>
							Save
						</button>
						<button
							onClick={onClose}
							className="btn btn-secondary w-full mt-2"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

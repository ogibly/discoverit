import React, { useState, useEffect } from "react";
import axios from "axios";
import OperationModal from "./OperationModal";

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

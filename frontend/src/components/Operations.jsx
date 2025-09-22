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
		const data = {
			...operationData,
			asset_ids: [],
			asset_group_ids: [],
			params: {},
		};

		if (editingOperation) {
			axios
				.put(`${API_BASE}/operations/${editingOperation.id}`, data)
				.then(() => {
					fetchOperations();
					setShowModal(false);
					setEditingOperation(null);
				});
		} else {
			axios.post(`${API_BASE}/operations`, data).then(() => {
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
		<div className="flex flex-col h-full text-slate-300">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-3xl font-bold text-white">Operations</h2>
				<button
					onClick={() => {
						setEditingOperation(null);
						setShowModal(true);
					}}
					className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500"
				>
					Create Operation
				</button>
			</div>
			<div className="flex flex-col flex-grow overflow-hidden border border-slate-800 rounded-lg bg-slate-900/50">
				<div className="flex-grow overflow-y-auto">
					<table className="w-full text-sm text-left text-slate-300">
						<thead className="text-xs text-slate-400 uppercase bg-slate-800">
							<tr>
								<th scope="col" className="px-6 py-3">Name</th>
								<th scope="col" className="px-6 py-3">URL</th>
								<th scope="col" className="px-6 py-3">Method</th>
								<th scope="col" className="px-6 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{operations.map((op) => (
								<tr key={op.id} className="border-b border-slate-800 transition-colors duration-150 hover:bg-slate-800/50">
									<td className="px-6 py-4">{op.name}</td>
									<td className="px-6 py-4">{op.api_url}</td>
									<td className="px-6 py-4">{op.api_method}</td>
									<td className="px-6 py-4 text-right">
										<button
											onClick={() => {
												setEditingOperation(op);
												setShowModal(true);
											}}
											className="font-medium text-blue-500 hover:underline mr-4"
										>
											Edit
										</button>
										<button
											onClick={() => handleDelete(op.id)}
											className="font-medium text-red-500 hover:underline"
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
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

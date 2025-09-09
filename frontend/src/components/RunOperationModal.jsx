import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function RunOperationModal({ assetGroup, onClose }) {
	const [operations, setOperations] = useState([]);
	const [selectedOperation, setSelectedOperation] = useState(null);
	const [job, setJob] = useState(null);

	useEffect(() => {
		axios.get(`${API_BASE}/operations`).then((res) => setOperations(res.data));
	}, []);

	useEffect(() => {
		if (job && job.status === "running") {
			const interval = setInterval(() => {
				axios.get(`${API_BASE}/jobs/${job.id}`).then((res) => {
					setJob(res.data);
					if (res.data.status !== "running") {
						clearInterval(interval);
					}
				});
			}, 3000);
			return () => clearInterval(interval);
		}
	}, [job]);

	const handleRun = () => {
		if (!selectedOperation) return;
		axios
			.post(
				`${API_BASE}/operations/${selectedOperation}/run/${assetGroup.id}`
			)
			.then((res) => {
				setJob(res.data);
			});
	};

	return (
		<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
			<div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-gray-800">
				<div className="mt-3">
					<h3 className="text-lg leading-6 font-medium text-white text-center">
						Run Operation on {assetGroup.name}
					</h3>
					<div className="mt-2 px-7 py-3">
						<select
							onChange={(e) => setSelectedOperation(e.target.value)}
							className="mb-4"
						>
							<option>Select an operation</option>
							{operations.map((op) => (
								<option key={op.id} value={op.id}>
									{op.name}
								</option>
							))}
						</select>
						{job && (
							<div>
								<p>Status: {job.status}</p>
								{job.results && (
									<pre className="bg-gray-900 p-2 rounded mt-2">
										{JSON.stringify(JSON.parse(job.results), null, 2)}
									</pre>
								)}
							</div>
						)}
					</div>
					<div className="items-center px-4 py-3">
						<button
							onClick={handleRun}
							disabled={!selectedOperation || (job && job.status === "running")}
							className="btn btn-primary w-full"
						>
							{job && job.status === "running" ? "Running..." : "Run"}
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

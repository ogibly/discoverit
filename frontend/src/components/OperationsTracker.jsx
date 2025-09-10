import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function OperationsTracker() {
	const [jobs, setJobs] = useState([]);
	const [operations, setOperations] = useState([]);
	const [assetGroups, setAssetGroups] = useState([]);

	useEffect(() => {
		const fetchJobs = () => {
			axios.get(`${API_BASE}/jobs`).then((res) => setJobs(res.data));
		};
		const fetchOperations = () => {
			axios.get(`${API_BASE}/operations`).then((res) => setOperations(res.data));
		};
		const fetchAssetGroups = () => {
			axios.get(`${API_BASE}/asset_groups`).then((res) => setAssetGroups(res.data));
		};

		fetchJobs();
		fetchOperations();
		fetchAssetGroups();

		const interval = setInterval(fetchJobs, 3000);
		return () => clearInterval(interval);
	}, []);

	const getOperationName = (id) => {
		const op = operations.find((o) => o.id === id);
		return op ? op.name : id;
	};

	const getAssetGroupName = (id) => {
		const group = assetGroups.find((g) => g.id === id);
		return group ? group.name : id;
	};

	return (
		<div className="flex flex-col h-full text-slate-300">
			<div className="mb-6">
				<h2 className="text-3xl font-bold text-white">Operations Tracker</h2>
			</div>
			<div className="flex flex-col flex-grow overflow-hidden border border-slate-800 rounded-lg bg-slate-900/50">
				<div className="flex-grow overflow-y-auto">
					<table className="w-full text-sm text-left text-slate-300">
						<thead className="text-xs text-slate-400 uppercase bg-slate-800">
							<tr>
								<th scope="col" className="px-6 py-3">Job ID</th>
								<th scope="col" className="px-6 py-3">Operation</th>
								<th scope="col" className="px-6 py-3">Asset Group</th>
								<th scope="col" className="px-6 py-3">Status</th>
								<th scope="col" className="px-6 py-3">Start Time</th>
								<th scope="col" className="px-6 py-3">End Time</th>
							</tr>
						</thead>
						<tbody>
							{jobs.map((job) => (
								<tr key={job.id} className="border-b border-slate-800 transition-colors duration-150 hover:bg-slate-800/50">
									<td className="px-6 py-4">{job.id}</td>
									<td className="px-6 py-4">{getOperationName(job.operation_id)}</td>
									<td className="px-6 py-4">{getAssetGroupName(job.asset_group_id)}</td>
									<td className="px-6 py-4">{job.status}</td>
									<td className="px-6 py-4">{new Date(job.start_time).toLocaleString()}</td>
									<td className="px-6 py-4">{job.end_time ? new Date(job.end_time).toLocaleString() : ""}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

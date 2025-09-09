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
		<div>
			<div className="header">
				<h2>Operations Tracker</h2>
			</div>
			<table>
				<thead>
					<tr>
						<th>Job ID</th>
						<th>Operation</th>
						<th>Asset Group</th>
						<th>Status</th>
						<th>Start Time</th>
						<th>End Time</th>
					</tr>
				</thead>
				<tbody>
					{jobs.map((job) => (
						<tr key={job.id}>
							<td>{job.id}</td>
							<td>{getOperationName(job.operation_id)}</td>
							<td>{getAssetGroupName(job.asset_group_id)}</td>
							<td>{job.status}</td>
							<td>{new Date(job.start_time).toLocaleString()}</td>
							<td>{job.end_time ? new Date(job.end_time).toLocaleString() : ""}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

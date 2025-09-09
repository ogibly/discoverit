import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function OperationsTracker() {
	const [jobs, setJobs] = useState([]);

	useEffect(() => {
		const fetchJobs = () => {
			axios.get(`${API_BASE}/jobs`).then((res) => setJobs(res.data));
		};
		fetchJobs();
		const interval = setInterval(fetchJobs, 3000);
		return () => clearInterval(interval);
	}, []);

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
							<td>{job.operation_id}</td>
							<td>{job.asset_group_id}</td>
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

import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function HistoryTimeline({ deviceId }) {
	const [history, setHistory] = useState([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);

	const fetchHistory = async (p = 1) => {
		const res = await axios.get(`${API_BASE}/devices/${deviceId}/history?page=${p}&limit=1`);
		setHistory(res.data.scan ? [res.data.scan] : []);
		setPage(res.data.page);
		setTotal(res.data.total);
	};

	useEffect(() => {
		fetchHistory(1);
	}, [deviceId]);

	const prevPage = () => { if (page > 1) fetchHistory(page - 1); };
	const nextPage = () => { if (page < total) fetchHistory(page + 1); };

	if (!history.length) return <p className="text-gray-500">No scans available</p>;

	return (
		<div className="bg-white shadow rounded p-4 mt-4">
			<h3 className="text-lg font-bold mb-2">Scan History</h3>
			<ul className="divide-y divide-gray-200">
				{history.map((scan, idx) => (
					<li key={idx} className="p-2">
						<p className="text-sm text-gray-400 mb-1">Timestamp: {new Date(scan.timestamp).toLocaleString()}</p>
						<ul className="ml-4">
							{scan.ports.map((port, i) => (
								<li key={i}>
									<span className="font-medium">{port.port}/{port.proto}</span> - {port.state} {port.service && `(${port.service})`}
								</li>
							))}
						</ul>
					</li>
				))}
			</ul>
			<div className="flex justify-between mt-4">
				<button
					onClick={prevPage}
					disabled={page <= 1}
					className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
				>
					Previous
				</button>
				<button
					onClick={nextPage}
					disabled={page >= total}
					className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
				>
					Next
				</button>
			</div>
		</div>
	);
}
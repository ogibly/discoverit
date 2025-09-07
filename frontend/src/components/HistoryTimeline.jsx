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

	const prevPage = () => { if (page < total) fetchHistory(page + 1); };
	const nextPage = () => { if (page > 1) fetchHistory(page - 1); };

	if (!history.length) return <p className="text-gray-500">No scans available</p>;

	return (
		<div className="bg-white shadow rounded p-4 mt-4">
			<h3 className="text-lg font-bold mb-2">Scan History</h3>
			<ul className="divide-y divide-gray-200">
				{history.map((scan, idx) => (
					<li key={idx} className="p-2">
						<div className="flex items-center justify-between mb-2">
							<p className="text-sm text-gray-400">Timestamp: {new Date(scan.timestamp).toLocaleString()}</p>
							{scan.aborted && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">ABORTED</span>}
						</div>
						
						{/* Device Information */}
						{scan.hostname && (
							<div className="mb-2">
								<p className="text-sm"><span className="font-medium">Hostname:</span> {scan.hostname}</p>
							</div>
						)}
						
						{/* OS Information */}
						{scan.os_info && scan.os_info.os_name !== 'Unknown' && (
							<div className="mb-2">
								<p className="text-sm"><span className="font-medium">OS:</span> {scan.os_info.os_name} ({scan.os_info.os_accuracy}% accuracy)</p>
							</div>
						)}
						
						{/* Services */}
						{scan.services && scan.services.length > 0 && (
							<div className="mb-2">
								<p className="text-sm font-medium mb-1">Services:</p>
								<ul className="ml-4 text-sm">
									{scan.services.map((service, i) => (
										<li key={i} className="mb-1">
											<span className="font-medium">{service.port}/{service.proto}</span> - {service.service}
											{service.version && <span className="text-gray-600"> ({service.version})</span>}
											{service.product && <span className="text-gray-600"> - {service.product}</span>}
										</li>
									))}
								</ul>
							</div>
						)}
						
						{/* Basic Ports (fallback for old scans) */}
						{scan.ports && scan.ports.length > 0 && (
							<div className="mb-2">
								<p className="text-sm font-medium mb-1">Open Ports:</p>
								<ul className="ml-4 text-sm">
									{scan.ports.map((port, i) => (
										<li key={i}>
											<span className="font-medium">{port.port}/{port.proto}</span> - {port.state} {port.service && `(${port.service})`}
										</li>
									))}
								</ul>
							</div>
						)}
						
						{/* Script Results */}
						{scan.script_results && Object.keys(scan.script_results).length > 0 && (
							<div className="mb-2">
								<p className="text-sm font-medium mb-1">Additional Info:</p>
								<div className="ml-4 text-xs text-gray-600">
									{Object.entries(scan.script_results).slice(0, 3).map(([script, result]) => (
										<div key={script} className="mb-1">
											<span className="font-medium">{script}:</span> {result}
										</div>
									))}
									{Object.keys(scan.script_results).length > 3 && (
										<p>... and {Object.keys(scan.script_results).length - 3} more</p>
									)}
								</div>
							</div>
						)}
					</li>
				))}
			</ul>
			<div className="flex justify-between mt-4">
				<button
					onClick={prevPage}
					disabled={page >= total}
					className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
				>
					&larr; Older
				</button>
				<button
					onClick={nextPage}
					disabled={page <= 1}
					className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
				>
					Newer &rarr;
				</button>
			</div>
		</div>
	);
}

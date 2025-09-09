import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function HistoryTimeline({ deviceId, onDeleteScan }) {
	const [history, setHistory] = useState([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);

	const fetchHistory = async (p = 1) => {
		try {
			const res = await axios.get(`${API_BASE}/devices/${deviceId}/history?page=${p}&limit=1`);
			setHistory(res.data.scan ? [res.data.scan] : []);
			setPage(res.data.page);
			setTotal(res.data.total);
		} catch (error) {
			setHistory([]);
			setTotal(0);
		}
	};

	useEffect(() => {
		fetchHistory(1);
	}, [deviceId]);

	const prevPage = () => { if (page < total) fetchHistory(page + 1); };
	const nextPage = () => { if (page > 1) fetchHistory(page - 1); };

	if (!history.length) return <p>No scans available.</p>;

	return (
		<div className="card">
			<h3>Scan History</h3>
			<ul style={{ listStyle: 'none', padding: 0 }}>
				{history.map((scan) => (
					<li key={scan.id} style={{ marginBottom: '20px', borderBottom: '1px solid #30363D', paddingBottom: '15px' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
							<p style={{ fontSize: '12px', color: '#8B949E' }}>{new Date(scan.timestamp).toLocaleString()}</p>
							<div>
								{scan.aborted && <span style={{ backgroundColor: '#DA3633', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', marginRight: '10px', fontWeight: '500' }}>ABORTED</span>}
								<button
									onClick={() => onDeleteScan(scan.id)}
									className="btn btn-danger"
								>
									Delete
								</button>
							</div>
						</div>
						
						{scan.hostname && (
							<div style={{ marginBottom: '8px' }}>
								<p><span style={{ fontWeight: '500', color: '#8B949E' }}>Hostname:</span> {scan.hostname}</p>
							</div>
						)}
						
						{scan.os_info && scan.os_info.os_name !== 'Unknown' && (
							<div style={{ marginBottom: '8px' }}>
								<p><span style={{ fontWeight: '500', color: '#8B949E' }}>OS:</span> {scan.os_info.os_name} ({scan.os_info.os_accuracy}% accuracy)</p>
							</div>
						)}
						
						{scan.services && scan.services.length > 0 && (
							<div style={{ marginBottom: '8px' }}>
								<p style={{ fontWeight: '500', color: '#8B949E', marginBottom: '5px' }}>Services:</p>
								<ul style={{ listStyle: 'none', paddingLeft: '15px' }}>
									{scan.services.map((service, i) => (
										<li key={i} style={{ marginBottom: '3px' }}>
											<span style={{ fontWeight: '500' }}>{service.port}/{service.proto}</span> - {service.service}
											{service.version && <span style={{ color: '#8B949E' }}> ({service.version})</span>}
											{service.product && <span style={{ color: '#8B949E' }}> - {service.product}</span>}
										</li>
									))}
								</ul>
							</div>
						)}
						
						{scan.ports && scan.ports.length > 0 && (
							<div style={{ marginBottom: '8px' }}>
								<p style={{ fontWeight: '500', color: '#8B949E', marginBottom: '5px' }}>Open Ports:</p>
								<ul style={{ listStyle: 'none', paddingLeft: '15px' }}>
									{scan.ports.map((port, i) => (
										<li key={i}>
											<span style={{ fontWeight: '500' }}>{port.port}/{port.proto}</span> - {port.state} {port.service && `(${port.service})`}
										</li>
									))}
								</ul>
							</div>
						)}
						
						{scan.script_results && Object.keys(scan.script_results).length > 0 && (
							<div style={{ marginBottom: '8px' }}>
								<p style={{ fontWeight: '500', color: '#8B949E', marginBottom: '5px' }}>Additional Info:</p>
								<div style={{ paddingLeft: '15px', fontSize: '12px', color: '#8B949E' }}>
									{Object.entries(scan.script_results).slice(0, 3).map(([script, result]) => (
										<div key={script} style={{ marginBottom: '3px' }}>
											<span style={{ fontWeight: '500' }}>{script}:</span> {String(result)}
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
			<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
				<button
					onClick={prevPage}
					disabled={page >= total}
					className="btn btn-secondary"
				>
					&larr; Older
				</button>
				<button
					onClick={nextPage}
					disabled={page <= 1}
					className="btn btn-secondary"
				>
					Newer &rarr;
				</button>
			</div>
		</div>
	);
}

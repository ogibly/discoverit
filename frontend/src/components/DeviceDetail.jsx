import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function DeviceDetail({ device, onDeleteScan }) {
	console.log("Rendering DeviceDetail for device:", device.id);
	const [history, setHistory] = useState([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);

	const fetchHistory = async (p = 1) => {
		try {
			const res = await axios.get(`${API_BASE}/devices/${device.id}/history?page=${p}&limit=1`);
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
	}, [device.id]);

	const prevPage = () => { if (page < total) fetchHistory(page + 1); };
	const nextPage = () => { if (page > 1) fetchHistory(page - 1); };

	return (
		<div className="text-slate-300">
			<h2 className="text-2xl font-bold mb-6 text-white">Device Details</h2>
			<div className="space-y-2 text-sm">
				<p key="device-ip"><span className="font-semibold text-slate-400">IP:</span> {device.ip}</p>
				{device.mac && <p key="device-mac"><span className="font-semibold text-slate-400">MAC:</span> {device.mac}</p>}
				{device.vendor && <p key="device-vendor"><span className="font-semibold text-slate-400">Vendor:</span> {device.vendor}</p>}
				{device.hostname && <p key="device-hostname"><span className="font-semibold text-slate-400">Hostname:</span> {device.hostname}</p>}
				{device.os_name && <p key="device-os"><span className="font-semibold text-slate-400">OS:</span> {device.os_name} {device.os_family} {device.os_version}</p>}
				{device.manufacturer && <p key="device-manufacturer"><span className="font-semibold text-slate-400">Manufacturer:</span> {device.manufacturer}</p>}
			</div>

			<div className="mt-8">
				<h3 className="text-xl font-bold mb-4 text-white">Scan History</h3>
				{history.length > 0 ? (
					<div className="bg-slate-900/70 border border-slate-800 rounded-lg">
						<ul className="divide-y divide-slate-800">
							{history.map((scan, index) => (
								<li key={scan.id || `${device.id}-scan-${index}`} className="p-6">
									<div className="flex justify-between items-center mb-4">
										<p className="text-xs text-slate-500">{new Date(scan.timestamp).toLocaleString()}</p>
										<div className="flex items-center gap-2">
											{scan.aborted && <span className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full">ABORTED</span>}
											<button
												onClick={() => onDeleteScan(scan.id)}
												className="px-3 py-1 text-xs font-medium text-red-500 bg-red-900/50 border border-red-800 rounded-md hover:bg-red-900"
											>
												Delete
											</button>
										</div>
									</div>

									<div className="space-y-4 text-sm">
										{scan.hostname && (
											<div>
												<p><span className="font-semibold text-slate-400">Hostname:</span> {scan.hostname}</p>
											</div>
										)}

										{scan.dns_info && Object.keys(scan.dns_info).length > 0 && (
											<div>
												<p><span className="font-semibold text-slate-400">DNS Info:</span> {scan.dns_info[0]}</p>
											</div>
										)}

										{scan.os_info && scan.os_info.os_name !== 'Unknown' && (
											<div>
												<p><span className="font-semibold text-slate-400">OS:</span> {scan.os_info.os_name} ({scan.os_info.os_accuracy}% accuracy)</p>
												<p className="pl-4 text-slate-500">{scan.os_info.os_family} {scan.os_info.os_version}</p>
											</div>
										)}

										{scan.device_info && scan.device_info.manufacturer !== 'Unknown' && (
											<div>
												<p><span className="font-semibold text-slate-400">Device Info:</span> {scan.device_info.manufacturer}</p>
											</div>
										)}

										{scan.addresses && (
											<div>
												<p><span className="font-semibold text-slate-400">Addresses:</span></p>
												<ul className="pl-4 space-y-1 text-slate-500">
													{['ipv4', 'ipv6', 'mac'].map((type) =>
														scan.addresses[type] ? (
															<li key={`${type}-${scan.id}`}>
																{type.toUpperCase()}: {scan.addresses[type]}
															</li>
														) : null
													)}
												</ul>

											</div>
										)}

										{scan.open_ports && (
											<div>
												<p className="font-semibold text-slate-400 mb-2">Open Ports:</p>
												<div className="pl-4 space-y-1">
													{scan.open_ports.tcp.length > 0 && <p>TCP: {scan.open_ports.tcp.join(', ')}</p>}
													{scan.open_ports.udp.length > 0 && <p>UDP: {scan.open_ports.udp.join(', ')}</p>}
												</div>
											</div>
										)}

										{scan.services && scan.services.length > 0 && (
											<div>
												<p className="font-semibold text-slate-400 mb-2">Services:</p>
												<ul className="pl-4 space-y-1">
													{scan.services.map((service) => (
														<li key={`${service.port}-${service.proto}`}>
															<span className="font-semibold">{service.port}/{service.proto}</span> - {service.service}
															{service.version && <span className="text-slate-500"> ({service.version})</span>}
															{service.product && <span className="text-slate-500"> - {service.product}</span>}
														</li>
													))}
												</ul>
											</div>
										)}

										{scan.ports && scan.ports.length > 0 && (
											<div>
												<p className="font-semibold text-slate-400 mb-2">Open Ports:</p>
												<ul className="pl-4 space-y-1">
													{scan.ports.map((port) => (
														<li key={`${port.port}-${port.proto}`}>
															<span className="font-semibold">{port.port}/{port.proto}</span> - {port.state} {port.service && `(${port.service})`}
														</li>
													))}
												</ul>
											</div>
										)}

										{scan.script_results && Object.keys(scan.script_results).length > 0 && (
											<div>
												<p className="font-semibold text-slate-400 mb-2">Additional Info:</p>
												<div className="pl-4 text-xs text-slate-500 space-y-1">
													{Object.entries(scan.script_results).slice(0, 3).map(([script, result]) => (
														<div key={`${scan.id}-${script}`}>
															<span className="font-semibold">{script}:</span> {String(result)}
														</div>
													))}
													{Object.keys(scan.script_results).length > 3 && (
														<p>... and {Object.keys(scan.script_results).length - 3} more</p>
													)}
												</div>
											</div>
										)}
									</div>
								</li>
							))}
						</ul>
						<div className="flex justify-between p-4 border-t border-slate-800">
							<button
								onClick={prevPage}
								disabled={page >= total}
								className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								&larr; Older
							</button>
							<button
								onClick={nextPage}
								disabled={page <= 1}
								className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Newer &rarr;
							</button>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-lg">
						<p className="text-slate-500">No scans available.</p>
					</div>
				)}
			</div>
		</div>
	);
}

import React from "react";
import HistoryTimeline from "./HistoryTimeline";

export default function DeviceDetail({ device, onDeleteScan }) {
    return (
        <div className="bg-white shadow rounded p-4">
            <h2 className="text-xl font-bold mb-2">Device Details</h2>
            <p><span className="font-medium">IP:</span> {device.ip}</p>
            {device.mac && <p><span className="font-medium">MAC:</span> {device.mac}</p>}
            {device.vendor && <p><span className="font-medium">Vendor:</span> {device.vendor}</p>}

            <HistoryTimeline deviceId={device.id} onDeleteScan={onDeleteScan} />
        </div>
    );
}

import React from "react";
import HistoryTimeline from "./HistoryTimeline";

export default function DeviceDetail({ device, onDeleteScan }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Device Details</h2>
            <p><span className="font-bold">IP:</span> {device.ip}</p>
            {device.mac && <p><span className="font-bold">MAC:</span> {device.mac}</p>}
            {device.vendor && <p><span className="font-bold">Vendor:</span> {device.vendor}</p>}

            <div className="mt-6">
                <HistoryTimeline deviceId={device.id} onDeleteScan={onDeleteScan} />
            </div>
        </div>
    );
}

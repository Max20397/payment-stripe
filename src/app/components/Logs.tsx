"use client";

import { useEffect, useState } from "react";

const Logs = () => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const response = await fetch("/api/logs");
            const data = await response.json();
            const logEntries: string[] = data.logs.split("\n").filter(Boolean);
            const sortedLogs = logEntries.sort((a: string, b: string) => {
                const dateA = new Date(a.split(" - ")[0]);
                const dateB = new Date(b.split(" - ")[0]);
                return dateB.getTime() - dateA.getTime();
            });
            setLogs(sortedLogs);
        };

        fetchLogs();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Webhook Logs ({logs.length})</h1>
            <div className="overflow-auto max-h-[500px] text-start">
                {logs.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log, index) => {
                                const [timestamp, event, id, customerId] = log.split(" - ");
                                return (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {timestamp}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {customerId}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    "No logs available"
                )}
            </div>
        </div>
    );
};

export default Logs;

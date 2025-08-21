"use client";

import { useEffect, useState } from "react";

const LogsPage = () => {
    const [logs, setLogs] = useState<string>("");

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch("/api/logs");
                if (!response.ok) {
                    throw new Error("Failed to fetch logs");
                }
                const data = await response.text();
                setLogs(data);
            } catch (error) {
                console.error("Error fetching logs:", error);
                setLogs("Error loading logs");
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Webhook Logs</h1>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
                {logs || "No logs available"}
            </pre>
        </div>
    );
};

export default LogsPage;

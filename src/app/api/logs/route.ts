import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const logFilePath = path.resolve(__dirname, "../../../logs/webhook-events.log");
    const logs = fs.readFileSync(logFilePath, "utf-8");
    return new Response(logs, { status: 200 });
  } catch (error) {
    console.error("Error reading logs:", error);
    return new Response("Error loading logs", { status: 500 });
  }
}

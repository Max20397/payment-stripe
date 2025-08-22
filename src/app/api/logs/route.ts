import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const logFilePath = path.resolve(process.cwd(), 'src/logs/webhook-events.log'); // Path to the log file
    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({ error: 'Log file not found' }, { status: 404 });
    }

    const logs = fs.readFileSync(logFilePath, 'utf-8');
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error reading log file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

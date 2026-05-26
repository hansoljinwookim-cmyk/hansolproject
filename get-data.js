import https from 'https';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';
    const payload = JSON.stringify({ action: "fetch_data", timestamp: Date.now() });

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Dashboard-Engine/3.0',
            'Content-Length': Buffer.byteLength(payload)
        },
        rejectUnauthorized: false
    };

    const request = https.request(WEBHOOK_URL, options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            if (data.length === 0) {
                fallback(res);
                return;
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(data);
        });
    });

    request.on('error', (e) => {
        fallback(res, e.message);
    });

    // Timeout after 5 seconds to prevent hanging on Vercel
    request.setTimeout(5000, () => {
        request.destroy();
        fallback(res, 'Request timed out');
    });

    request.write(payload);
    request.end();
}

function fallback(res, errorMsg = "No data") {
    try {
        const fallbackData = fs.readFileSync(path.join(process.cwd(), 'last_response.json'), 'utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(fallbackData);
    } catch (e) {
        res.status(500).json({ error: "Data Load Failed after retries", detail: errorMsg, fallbackError: e.message });
    }
}

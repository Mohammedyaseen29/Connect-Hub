import { NextApiRequest, NextApiResponse } from "next";

// Socket.IO is attached by server.js before requests arrive.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    res.status(503).json({ error: "Realtime requires npm run dev or npm start on a persistent Node server" });
}

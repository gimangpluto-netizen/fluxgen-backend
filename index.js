const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000; // Render akan mengisi port otomatis

app.use(cors());
app.use(express.json());

// --- DATABASE BLACKLIST ---
const BLOCKED_IPS = [
    "87.188.89.108", 
    "47.185.20.244",
    "212.105.155.153"
];

// --- SERVER SIDE FILTER ---
const HARD_BANNED_WORDS = ["child porn", "cp", "loli", "shota", "underage nude"];

// Endpoint Utama
app.post('/api/log', async (req, res) => {
    const data = req.body;

    // Ambil IP dari Header Render
    let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (userIp.includes(',')) userIp = userIp.split(',')[0].trim(); // Bersihkan IP

    console.log(`Request from: ${userIp}`);

    // 1. Cek Blokir IP
    if (BLOCKED_IPS.includes(userIp)) {
        return res.status(403).json({ status: "blocked", message: "IP Banned." });
    }

    // 2. Cek Kata Terlarang
    const promptCheck = data.prompt ? data.prompt.toLowerCase() : "";
    for (const word of HARD_BANNED_WORDS) {
        if (promptCheck.includes(word)) {
            return res.status(400).json({ status: "illegal", message: "Illegal Content." });
        }
    }

    // 3. Kirim ke Discord (Pakai Environment Variable)
    try {
        let webhookUrl = process.env.DISCORD_WEBHOOK;
        if (data.type === "feedback") webhookUrl = process.env.FEEDBACK_WEBHOOK;

        if (webhookUrl) {
            await axios.post(webhookUrl, data.discordPayload);
        }
        res.json({ status: "success" });
    } catch (error) {
        console.error("Discord Error:", error.message);
        res.json({ status: "success_no_log" });
    }
});

app.get('/', (req, res) => res.send('FLUXGEN BACKEND IS LIVE 🟢'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  

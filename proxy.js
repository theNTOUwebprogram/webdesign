const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 使用 node-fetch v3+ 的方式
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// 啟用 CORS 和 JSON 支援
app.use(cors());
app.use(express.json());

// 靜態文件服務
app.use(express.static('public'));

// 根路由
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

// Horoscope 路由代理
app.get('/horoscope', async (req, res) => {
    const { name } = req.query;
    console.log("收到星座請求:", name);

    const targetUrl = `https://api.leafone.cn/api/horoscope?name=${encodeURIComponent(name)}`;
    console.log("請求 URL:", targetUrl);

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("API 錯誤:", errorText);
            return res.status(response.status).json({ error: "API 請求失敗" });
        }
        const data = await response.json();
        console.log("API 返回數據:", data);
        res.status(200).json(data);
    } catch (error) {
        console.error("完整錯誤:", error);
        res.status(500).json({ error: "服務器錯誤", details: error.message });
    }
});

// Convert 路由代理
app.post('/convert', async (req, res) => {
    const { text, converter } = req.body;
    const apiUrl = "https://api.zhconvert.org/convert";

    try {
        console.log("收到請求內容:", req.body);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, converter }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API 錯誤響應:", errorText);
            return res.status(response.status).json({
                error: "目標 API 請求失敗",
                details: errorText
            });
        }

        const data = await response.json();
        console.log("API 返回數據:", data);
        res.status(200).json(data);
    } catch (error) {
        console.error("詳細錯誤信息:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            error: "代理伺服器無法處理請求",
            details: error.message
        });
    }
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('錯誤詳情:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ error: '服務器內部錯誤' });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: '找不到請求的資源' });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器正在執行：http://localhost:${PORT}`);
});

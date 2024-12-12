import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors'; // 引入 CORS 支援

const app = express();
const PORT = process.env.PORT || 10000; // 可以修改為您需要的埠號

// 啟用 CORS 和 JSON 處理
app.use(cors());
app.use(bodyParser.json());

// 添加靜態文件服務
app.use(express.static('public'));

// 根路由
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

// Horoscope 路由代理
app.get('/horoscope', async (req, res) => {
    const { name } = req.query; // 從查詢參數中獲取星座名稱
    const targetUrl = `https://api.leafone.cn/api/horoscope?name=${encodeURIComponent(name)}`;

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            console.error("目標 API 錯誤:", response.status, await response.text());
            return res.status(response.status).json({ error: "目標 API 請求失敗" });
        }
        const data = await response.json();

        // 打印目標 API 返回的數據（用於調試）
        console.log("目標 API 返回數據:", data);

        res.status(200).json(data);
    } catch (error) {
        console.error("代理伺服器錯誤:", error);
        res.status(500).json({ error: "代理伺服器無法處理請求" });
    }
});

// Convert 路由代理
app.post('/convert', async (req, res) => {
    const { text, converter } = req.body;

    const apiUrl = "https://api.zhconvert.org/convert";

    try {
        console.log("代理伺服器接收到的數據:", { text, converter });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, converter }),
        });

        if (!response.ok) {
            console.error("目標 API 錯誤:", response.status, await response.text());
            return res.status(response.status).json({ error: "目標 API 請求失敗" });
        }

        const data = await response.json();

        console.log("目標 API 返回數據:", data);

        res.status(200).json(data);
    } catch (error) {
        console.error("代理伺服器錯誤:", error);
        res.status(500).json({ error: "代理伺服器無法處理請求" });
    }
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('錯誤:', err);
    res.status(500).json({ error: '伺服器內部錯誤' });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: '找不到請求的資源' });
});

// 啟動代理伺服器
app.listen(PORT, () => {
    console.log(`代理伺服器正在執行：http://localhost:${PORT}`);
    console.log(`代理伺服器已啟動：http://localhost:${PORT}`);
});
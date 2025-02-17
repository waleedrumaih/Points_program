const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

const DB_PATH = path.join(__dirname, 'data', 'points.json');

async function ensureDatabase() {
    try {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        try {
            await fs.access(DB_PATH);
        } catch {
            await fs.writeFile(DB_PATH, JSON.stringify({ points: [] }, null, 2));
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

app.get('/api/points', async (req, res) => {
    await ensureDatabase();
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading points:', error);
        res.json({ points: [] });
    }
});

app.post('/api/points', async (req, res) => {
    await ensureDatabase();
    try {
        const { name, points } = req.body;
        let data = { points: [] };
        
        try {
            const fileContent = await fs.readFile(DB_PATH, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            console.log('Creating new data structure');
        }

        data.points = data.points.filter(p => p.name !== name);
        
        Object.entries(points).forEach(([pointType, count]) => {
            data.points.push({
                name,
                point_type: pointType,
                point_count: count
            });
        });

        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving points:', error);
        res.status(500).json({ error: 'Failed to save points' });
    }
});

app.delete('/api/points', async (req, res) => {
    await ensureDatabase();
    try {
        await fs.writeFile(DB_PATH, JSON.stringify({ points: [] }, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing points:', error);
        res.status(500).json({ error: 'Failed to clear points' });
    }
});

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    ensureDatabase().then(() => {
        console.log(`Database initialized at ${DB_PATH}`);
    });
});
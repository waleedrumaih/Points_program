// api/index.js
import { join } from 'path';
import { promises as fs } from 'fs';

// Initialize data file
const dataFile = join(process.cwd(), 'data', 'points.json');

// Ensure data directory and file exist
async function ensureDataFile() {
  try {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    try {
      await fs.access(dataFile);
    } catch {
      await fs.writeFile(dataFile, JSON.stringify({ points: [] }));
    }
  } catch (error) {
    console.error('Error initializing data file:', error);
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await ensureDataFile();

  try {
    if (req.method === 'GET') {
      const data = await fs.readFile(dataFile, 'utf8');
      res.json(JSON.parse(data));
    }
    else if (req.method === 'POST') {
      const { name, points } = req.body;
      const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
      
      data.points = data.points.filter(p => p.name !== name);
      
      Object.entries(points).forEach(([pointType, count]) => {
        data.points.push({
          name,
          point_type: pointType,
          point_count: count
        });
      });
      
      await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
      res.json({ success: true });
    }
    else if (req.method === 'DELETE') {
      await fs.writeFile(dataFile, JSON.stringify({ points: [] }));
      res.json({ success: true });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
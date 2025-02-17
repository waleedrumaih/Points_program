// api/index.js
import { put, get } from '@vercel/blob';

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

  const BLOB_KEY = 'points.json';

  try {
    if (req.method === 'GET') {
      try {
        const blob = await get(BLOB_KEY);
        const data = await blob.text();
        res.json(JSON.parse(data));
      } catch (error) {
        // If no blob exists, return empty points
        res.json({ points: [] });
      }
    }
    else if (req.method === 'POST') {
      const { name, points } = req.body;
      
      // Retrieve existing data
      let data;
      try {
        const existingBlob = await get(BLOB_KEY);
        data = JSON.parse(await existingBlob.text());
      } catch {
        data = { points: [] };
      }
      
      // Remove existing points for this name
      data.points = data.points.filter(p => p.name !== name);
      
      // Add new points
      Object.entries(points).forEach(([pointType, count]) => {
        data.points.push({
          name,
          point_type: pointType,
          point_count: count
        });
      });
      
      // Store updated data
      await put(BLOB_KEY, JSON.stringify(data, null, 2), {
        access: 'public',
        contentType: 'application/json'
      });
      
      res.json({ success: true });
    }
    else if (req.method === 'DELETE') {
      // Clear all points
      await put(BLOB_KEY, JSON.stringify({ points: [] }, null, 2), {
        access: 'public',
        contentType: 'application/json'
      });
      res.json({ success: true });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
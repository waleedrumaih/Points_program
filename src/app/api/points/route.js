// src/api/points.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const points = await sql`SELECT * FROM points`;
      res.status(200).json({ points });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Failed to fetch points' });
    }
  } 
  else if (req.method === 'POST') {
    try {
      const { name, points } = req.body;
      
      // Delete existing points for this name
      await sql`DELETE FROM points WHERE name = ${name}`;
      
      // Insert new points
      for (const [pointType, count] of Object.entries(points)) {
        await sql`
          INSERT INTO points (name, point_type, point_count)
          VALUES (${name}, ${pointType}, ${count})
        `;
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Failed to save points' });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM points`;
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Failed to clear points' });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
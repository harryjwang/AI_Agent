const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/history
 * Returns past questions and answers
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await db.query(
      `SELECT id, query, answer, query_type, created_at
       FROM questions
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

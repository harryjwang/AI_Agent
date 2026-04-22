const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/corrections
 * User submits a correction: "the agent said X but the answer is actually Y"
 * This gets stored in Postgres and retrieved via RAG on future similar queries.
 */
router.post('/', async (req, res) => {
  const { query, original_answer, correct_answer } = req.body;

  if (!query?.trim() || !correct_answer?.trim()) {
    return res.status(400).json({ error: 'query and correct_answer are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO corrections (query, original_answer, correct_answer)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [query, original_answer || '', correct_answer]
    );

    res.json({
      message: 'Correction saved. The agent will use this on future similar questions.',
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('Correction error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/corrections
 * Returns all stored corrections (useful for reviewing what the agent has learned)
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, query, original_answer, correct_answer, created_at
       FROM corrections
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/corrections/:id
 * Remove a correction if it was wrong
 */
router.delete('/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM corrections WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Correction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

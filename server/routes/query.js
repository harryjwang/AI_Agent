const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../db');

const AGENT_URL = process.env.AGENT_URL || 'http://localhost:5001';

/**
 * POST /api/query
 * Main endpoint — takes a user question, fetches relevant corrections
 * from Postgres (RAG), sends everything to the Python agent, saves result.
 */
router.post('/', async (req, res) => {
  const { query } = req.body;
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // RAG: fetch relevant past corrections from Postgres using full-text search
    const correctionResult = await db.query(
      `SELECT query, correct_answer AS answer
       FROM corrections
       WHERE to_tsvector('english', query) @@ plainto_tsquery('english', $1)
       ORDER BY created_at DESC
       LIMIT 5`,
      [query]
    );
    const corrections = correctionResult.rows;

    // Call the Python LangGraph agent
    const agentResponse = await fetch(`${AGENT_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, corrections }),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent service error: ${agentResponse.status}`);
    }

    const agentData = await agentResponse.json();

    if (agentData.error) {
      return res.status(500).json({ error: agentData.error });
    }

    // Save the question + answer to Postgres for history
    await db.query(
      `INSERT INTO questions (query, answer, query_type) VALUES ($1, $2, $3)`,
      [query, agentData.answer, agentData.query_type]
    );

    res.json({
      answer: agentData.answer,
      query_type: agentData.query_type,
      corrections_used: corrections.length,
    });

  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

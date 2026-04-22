#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Command } = require('commander');
const fetch = require('node-fetch');

const API = process.env.API_URL || 'http://localhost:3000';
const program = new Command();

program
  .name('agent')
  .description('AI Search Agent CLI')
  .version('1.0.0');

// ── ask ──────────────────────────────────────────
program
  .command('ask <query...>')
  .description('Ask the agent a question')
  .action(async (queryParts) => {
    const query = queryParts.join(' ');
    process.stdout.write(`\nAsking: "${query}"\n`);
    process.stdout.write('Thinking...\n\n');

    try {
      const res = await fetch(`${API}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      if (data.error) {
        console.error(`Error: ${data.error}`);
        process.exit(1);
      }

      const typeLabel = data.query_type === 'search' ? '🔍 web search' : '🧠 direct';
      const ragLabel = data.corrections_used > 0 ? ` | ✦ ${data.corrections_used} correction(s) applied` : '';
      console.log(`[${typeLabel}${ragLabel}]\n`);
      console.log(data.answer);
      console.log('');
    } catch (err) {
      console.error(`Network error: ${err.message}`);
      process.exit(1);
    }
  });

// ── correct ──────────────────────────────────────
program
  .command('correct')
  .description('Submit a correction for a previous answer')
  .requiredOption('-q, --query <query>', 'The original question')
  .requiredOption('-a, --answer <answer>', 'The correct answer')
  .action(async (opts) => {
    try {
      const res = await fetch(`${API}/api/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: opts.query,
          original_answer: '',
          correct_answer: opts.answer,
        }),
      });
      const data = await res.json();
      if (data.error) { console.error(`Error: ${data.error}`); process.exit(1); }
      console.log(`✓ Correction saved (id: ${data.id})`);
    } catch (err) {
      console.error(`Network error: ${err.message}`);
      process.exit(1);
    }
  });

// ── history ──────────────────────────────────────
program
  .command('history')
  .description('Show recent question history')
  .option('-n, --limit <n>', 'Number of results', '10')
  .action(async (opts) => {
    try {
      const res = await fetch(`${API}/api/history?limit=${opts.limit}`);
      const data = await res.json();
      if (!data.length) { console.log('No history yet.'); return; }
      data.forEach((item, i) => {
        console.log(`\n[${i + 1}] ${item.query}`);
        console.log(`    ${item.answer.slice(0, 120)}${item.answer.length > 120 ? '...' : ''}`);
        console.log(`    ${new Date(item.created_at).toLocaleString()} | ${item.query_type}`);
      });
      console.log('');
    } catch (err) {
      console.error(`Network error: ${err.message}`);
      process.exit(1);
    }
  });

// ── corrections ───────────────────────────────────
program
  .command('corrections')
  .description('List all stored corrections')
  .action(async () => {
    try {
      const res = await fetch(`${API}/api/corrections`);
      const data = await res.json();
      if (!data.length) { console.log('No corrections yet.'); return; }
      data.forEach((item, i) => {
        console.log(`\n[${item.id}] Q: ${item.query}`);
        console.log(`     ✦ ${item.correct_answer}`);
      });
      console.log('');
    } catch (err) {
      console.error(`Network error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

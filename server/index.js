require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const queryRoutes = require('./routes/query');
const correctionsRoutes = require('./routes/corrections');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static web UI from /client
app.use(express.static(path.join(__dirname, '../client')));

// API routes
app.use('/api/query', queryRoutes);
app.use('/api/corrections', correctionsRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Agent microservice expected at ${process.env.AGENT_URL || 'http://localhost:5001'}`);
});

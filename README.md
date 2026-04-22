# AI Search Agent

A full-stack AI agent that answers any question, searches the web when needed, and learns from user corrections via RAG.

## Stack
- **Node.js + Express** — REST API
- **PostgreSQL** — stores questions, history, corrections
- **Python + LangGraph + Gemini** — AI agent microservice
- **Tavily** — web search
- **HTML/JS** — web UI
- **commander.js** — CLI

## Setup

### 1. PostgreSQL
```bash
createdb ai_search_agent
psql ai_search_agent < server/db/schema.sql
```

### 2. Python agent
```bash
cd agent
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

### 3. Node server + CLI
```bash
cd server && npm install
cd ../cli && npm install
```

### 4. Environment
```bash
cp .env.example .env
# Fill in GOOGLE_API_KEY, TAVILY_API_KEY, DATABASE_URL
```

## Running

Terminal 1 — Python agent:
```bash
cd agent && source venv/bin/activate
python -m agent.service
```

Terminal 2 — Node server:
```bash
cd server && npm start
```

Web UI: http://localhost:3000

## CLI Usage
```bash
cd cli && npm install -g .

agent ask what is the capital of France
agent ask who won the world cup in 2022
agent correct -q "what is 2+2" -a "4"
agent history
agent corrections
```

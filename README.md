# AI Search Agent

A full-stack AI agent that answers any question, searches the web when needed, and learns from user corrections via RAG (Retrieval Augmented Generation).

## Stack

- **Node.js + Express** — REST API
- **PostgreSQL** — stores questions, history, and corrections
- **Python + LangGraph + Groq** — AI agent microservice
- **Tavily** — web search
- **HTML/JS** — web UI
- **commander.js** — CLI

## Prerequisites

Make sure you have the following installed before starting:

- [Homebrew](https://brew.sh) (Mac package manager)
- Python 3.12+
- Node.js + npm
- PostgreSQL

If you don't have Homebrew, install it first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install the rest:
```bash
brew install python node postgresql@15
brew services start postgresql@15
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## API Keys

You'll need two free API keys before starting:

1. **Groq** — go to [console.groq.com](https://console.groq.com), sign up, and create an API key
2. **Tavily** — go to [app.tavily.com](https://app.tavily.com), sign up, and create an API key

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/AI_Agent.git
cd AI_Agent
```

### 2. Create the PostgreSQL database
```bash
createdb ai_search_agent
psql ai_search_agent < server/db/schema.sql
```

### 3. Create your `.env` file
```bash
touch .env
```

Open it and add the following (replace the placeholder values with your actual keys):
```
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
DATABASE_URL=postgresql://YOUR_MAC_USERNAME@localhost:5432/ai_search_agent
PORT=3000
AGENT_URL=http://localhost:5001
API_URL=http://localhost:3000
```

To find your Mac username for the DATABASE_URL, run:
```bash
psql postgres -c "\du"
```

The Role name shown is your username.

### 4. Set up the Python agent
```bash
cd agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install langchain-groq
cd ..
```

### 5. Set up the Node server
```bash
cd server && npm install && cd ..
```

### 6. Set up the CLI
```bash
cd cli && npm install && cd ..
```

### 7. Enable the VS Code terminal command (optional but recommended)
In VS Code, press **Cmd + Shift + P**, type `Shell Command`, and click **"Install 'code' command in PATH"**.

## Running the App

You need two terminals running simultaneously.

**Terminal 1 — Python agent:**
```bash
cd agent
source venv/bin/activate
cd ..
python -m agent.service
```

Should print: `Running on http://127.0.0.1:5001`

**Terminal 2 — Node server:**
```bash
cd server
npm start
```

Should print: `Server running at http://localhost:3000`

Then open your browser and go to **http://localhost:3000**.

## Using the Web UI

- **Ask tab** — type any question and hit Send. The agent will search the web if needed.
- **History tab** — view all past questions and answers.
- **Corrections tab** — view and delete stored corrections.
- **"Correct this" button** — appears under every answer. Click it to submit a correction if the agent got something wrong. The correction is stored in PostgreSQL and automatically injected into future similar queries.

## Using the CLI

From the project root with the servers running:

```bash
# Ask a question
node cli/index.js ask what is the capital of France

# Ask a question that needs web search
node cli/index.js ask what is the weather in toronto tomorrow

# Submit a correction
node cli/index.js correct -q "what is 2+2" -a "4"

# View question history
node cli/index.js history

# View stored corrections
node cli/index.js corrections
```

Or install the CLI globally to use the `agent` command from anywhere:
```bash
cd cli && npm install -g . && cd ..
agent ask what is the speed of light
```

## Project Structure

```
AI_Agent/
├── .env                    # Your API keys (never commit this)
├── .gitignore
├── README.md
├── agent/                  # Python LangGraph microservice
│   ├── venv/               # Python virtual environment
│   ├── __init__.py
│   ├── graph.py            # LangGraph FSM — wires nodes and edges
│   ├── nodes.py            # Planner, Router, Searcher, Answerer nodes
│   ├── service.py          # Flask server exposing the agent as an API
│   ├── state.py            # AgentState TypedDict — shared memory
│   ├── tools.py            # Tavily web search tool
│   └── requirements.txt
├── server/                 # Node.js Express API
│   ├── db/
│   │   ├── index.js        # PostgreSQL connection pool
│   │   └── schema.sql      # Database table definitions
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── corrections.js  # POST/GET/DELETE /api/corrections
│   │   ├── history.js      # GET /api/history
│   │   └── query.js        # POST /api/query
│   ├── index.js            # Express server entry point
│   └── package.json
├── client/
│   └── index.html          # Web UI (chat interface)
└── cli/
    ├── index.js            # commander.js CLI
    └── package.json
```

## How It Works

1. You type a question in the web UI or CLI
2. Node.js checks PostgreSQL for relevant past corrections (RAG)
3. Node.js sends the query + corrections to the Python agent
4. LangGraph router decides: does this need a web search?
5. If yes → Tavily searches the web and returns results
6. Groq (LLaMA 3.3) generates a final answer using the search results + correction context
7. The answer is saved to PostgreSQL history and returned to the UI
8. If the answer is wrong, click "Correct this" → stored in PostgreSQL → used automatically next time
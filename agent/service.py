"""
Flask microservice — Node.js calls this internally.
Exposes two endpoints:
  POST /query   — run the LangGraph agent
  POST /correct — store a user correction (called by Node after saving to Postgres)
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from .graph import build_graph

load_dotenv()

app = Flask(__name__)
CORS(app)
graph = build_graph()


@app.route("/query", methods=["POST"])
def query():
    data = request.json
    user_query = data.get("query", "").strip()
    corrections = data.get("corrections", [])  # RAG context passed in from Node/Postgres

    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    initial_state = {
        "query": user_query,
        "query_type": None,
        "search_results": None,
        "answer": None,
        "corrections": corrections,
        "error": None,
    }

    try:
        result = graph.invoke(initial_state)
        return jsonify({
            "answer": result["answer"],
            "query_type": result["query_type"],
            "error": result.get("error"),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001, debug=True)

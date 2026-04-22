import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from .graph import build_graph

app = Flask(__name__)
CORS(app)
graph = build_graph()


@app.route("/query", methods=["POST"])
def query():
    data = request.json
    user_query = data.get("query", "").strip()
    corrections = data.get("corrections", [])

    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        initial_state = {
            "query": user_query,
            "query_type": None,
            "search_results": None,
            "answer": None,
            "corrections": corrections,
            "error": None,
        }
        result = graph.invoke(initial_state)
        return jsonify({
            "answer": result["answer"],
            "query_type": result["query_type"],
            "error": result.get("error"),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(port=5001, debug=False, use_reloader=False)
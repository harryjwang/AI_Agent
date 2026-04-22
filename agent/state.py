from typing import TypedDict, Optional, List

class AgentState(TypedDict):
    """
    Shared memory passed through every LangGraph node.
    """
    query: str                        # The user's original question
    query_type: Optional[str]         # "search", "code", or "correction"
    search_results: Optional[str]     # Raw results from Tavily
    answer: Optional[str]             # Final answer to return
    corrections: Optional[List[dict]] # Relevant past corrections from Postgres (RAG)
    error: Optional[str]              # Any error that occurred

from tavily import TavilyClient
import os

def search_web(query: str) -> str:
    """
    Uses Tavily to search the web and return a clean summary.
    Returns a string of concatenated search result snippets.
    """
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = client.search(
        query=query,
        search_depth="basic",
        max_results=5,
    )
    results = response.get("results", [])
    if not results:
        return "No results found."

    formatted = []
    for r in results:
        formatted.append(f"Source: {r['url']}\n{r['content']}")
    return "\n\n---\n\n".join(formatted)

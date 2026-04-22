from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from .state import AgentState
from .tools import search_web

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)


# ─────────────────────────────────────────────
# NODE 1: Router
# Decides if the query needs web search or can be answered directly
# ─────────────────────────────────────────────
def router_node(state: AgentState) -> AgentState:
    # If we have corrections from RAG, inject them as context hint
    correction_hint = ""
    if state.get("corrections"):
        pairs = "\n".join(
            f"Q: {c['query']}\nA: {c['answer']}" for c in state["corrections"]
        )
        correction_hint = f"\n\nNote: A user has previously provided verified answers for similar questions:\n{pairs}\nUse these as ground truth if relevant."

    messages = [
        SystemMessage(content=(
            "You are a query router. Given a user question, decide if it needs "
            "a live web search or can be answered from your training knowledge. "
            "Reply with exactly one word: SEARCH or DIRECT."
            "Use SEARCH for: current events, news, prices, recent releases, live data. "
            "Use DIRECT for: general knowledge, definitions, concepts, math, coding help."
            f"{correction_hint}"
        )),
        HumanMessage(content=state["query"])
    ]

    response = llm.invoke(messages)
    query_type = "search" if "SEARCH" in response.content.upper() else "direct"
    return {**state, "query_type": query_type}


# ─────────────────────────────────────────────
# NODE 2: Web Searcher
# Calls Tavily and stores raw results in state
# ─────────────────────────────────────────────
def search_node(state: AgentState) -> AgentState:
    try:
        results = search_web(state["query"])
        return {**state, "search_results": results}
    except Exception as e:
        return {**state, "search_results": None, "error": str(e)}


# ─────────────────────────────────────────────
# NODE 3: Answer Generator
# Synthesizes a final answer from search results or knowledge
# ─────────────────────────────────────────────
def answer_node(state: AgentState) -> AgentState:
    # Build correction context for RAG
    correction_context = ""
    if state.get("corrections"):
        pairs = "\n".join(
            f"Q: {c['query']}\nA: {c['answer']}" for c in state["corrections"]
        )
        correction_context = (
            f"\n\nIMPORTANT: A verified user has confirmed the following answers. "
            f"If any of these are relevant, prioritize them over other sources:\n{pairs}"
        )

    # Build search context if available
    search_context = ""
    if state.get("search_results"):
        search_context = f"\n\nWeb search results:\n{state['search_results']}"

    messages = [
        SystemMessage(content=(
            "You are a helpful, accurate assistant. "
            "Answer the user's question clearly and concisely. "
            "If you used web search results, cite the sources. "
            "If a verified correction exists for this topic, use it as ground truth."
            f"{correction_context}"
        )),
        HumanMessage(content=(
            f"Question: {state['query']}"
            f"{search_context}"
        ))
    ]

    response = llm.invoke(messages)
    return {**state, "answer": response.content}

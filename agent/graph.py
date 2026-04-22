from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import router_node, search_node, answer_node


def route_query(state: AgentState) -> str:
    """
    Conditional edge: after routing, go to search or skip straight to answer.
    """
    if state["query_type"] == "search":
        return "search"
    return "answer"


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("router", router_node)
    graph.add_node("search", search_node)
    graph.add_node("answer", answer_node)

    # After router, conditionally go to search or answer
    graph.add_conditional_edges("router", route_query)

    # After search, always go to answer
    graph.add_edge("search", "answer")
    graph.add_edge("answer", END)

    graph.set_entry_point("router")
    return graph.compile()

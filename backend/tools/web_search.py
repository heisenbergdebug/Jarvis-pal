"""Web search tool using DuckDuckGo (no API key needed)."""

from duckduckgo_search import DDGS


def search_web(query, max_results=5):
    """Search the web and return formatted results."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return "No results found."

        formatted = []
        for i, r in enumerate(results, 1):
            formatted.append(
                f"{i}. {r.get('title', 'No title')}\n"
                f"   {r.get('href', '')}\n"
                f"   {r.get('body', '')}"
            )
        return "\n\n".join(formatted)
    except Exception as e:
        return f"Search error: {e}"

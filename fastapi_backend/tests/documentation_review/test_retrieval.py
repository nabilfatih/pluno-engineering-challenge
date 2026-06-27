from app.documentation_review.corpus_loader import load_documentation_sources
from app.documentation_review.retrieval import retrieve_documentation


def test_retrieve_documentation_matches_agents_as_tools_language() -> None:
    """Retrieval should find the tool-wiring docs for agent-as-tool requests."""

    sources = load_documentation_sources()
    chunks = retrieve_documentation("Explain agents-as-tools with as_tool", sources)

    assert chunks
    assert chunks[0].source_path == "tools-agents-sdk.md"
    assert "as_tool" in chunks[0].text
